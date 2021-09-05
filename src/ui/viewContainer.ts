import { t } from 'src/lang/helpers';
import { IMG_TOOLBAR_ICONS, CLOSE_ICON } from '../conf/constants';
import { calculateImgZoomSize, zoom, rotate, invertImgColor, copyImage } from '../util/imgUtil';


let DRAGGING = false;
let INVERT_SWITCH = false;
let REAL_IMG_INTERVAL: NodeJS.Timeout;
export const TARGET_IMG_INFO: IMG_INFO = {
    // true: the popup layer of viewing image is displayed
    state: false,

    viewContainerEl: null,
    imgViewEl: null,
    imgTitleEl: null,
    imgTipEl: null,
    imgTipTimeout: null,

    curWidth: 0,
    curHeight: 0,
    realWidth: 0,
    realHeight: 0,
    left: 0,
    top: 0,
    moveX: 0,
    moveY: 0,
    rotate: 0
}

export interface IMG_INFO {
    state: boolean,

    viewContainerEl: HTMLDivElement,
    imgViewEl: HTMLImageElement,
    imgTitleEl: HTMLDivElement,
    imgTipEl: HTMLDivElement,
    imgTipTimeout?: NodeJS.Timeout,

    curWidth: number,
    curHeight: number,
    realWidth: number,
    realHeight: number,
    left: number,
    top: number,
    moveX: number,
    moveY: number,
    rotate: number,
}

export interface OFFSET_SIZE {
    offsetX: number,
    offsetY: number
}

export function renderViewContainer(targetEl: HTMLImageElement, containerEl: HTMLElement) {
    initViewContainer(targetEl, containerEl);
    openViewContainer();
    refreshImg(targetEl.src, targetEl.alt);
}

export function initViewContainer(targetEl: HTMLImageElement, containerEl: HTMLElement) {
    if (null == TARGET_IMG_INFO.viewContainerEl || !TARGET_IMG_INFO.viewContainerEl) {
        // console.log('initViewContainer....', containerEl);
        // <div class="image-toolkit-view-container">
        TARGET_IMG_INFO.viewContainerEl = createDiv();
        TARGET_IMG_INFO.viewContainerEl.setAttribute('class', 'image-toolkit-view-container');
        containerEl.appendChild(TARGET_IMG_INFO.viewContainerEl);
        // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
        const imgContainerDiv = createDiv();
        imgContainerDiv.setAttribute('class', 'img-container');
        TARGET_IMG_INFO.imgViewEl = createEl('img');
        TARGET_IMG_INFO.imgViewEl.setAttribute('class', 'img-view');
        TARGET_IMG_INFO.imgViewEl.setAttribute('src', '');
        TARGET_IMG_INFO.imgViewEl.setAttribute('alt', '');
        imgContainerDiv.appendChild(TARGET_IMG_INFO.imgViewEl);
        TARGET_IMG_INFO.viewContainerEl.appendChild(imgContainerDiv); // img-container
        // <div class="img-close"></div>
        // const imgCloseDiv = createDiv();
        // imgCloseDiv.innerHTML = CLOSE_ICON.svg;
        // imgCloseDiv.setAttribute('class', 'img-close');
        // TARGET_IMG_INFO.viewContainerEl.appendChild(imgCloseDiv); // img-close
        // <div class="img-tip"></div>
        TARGET_IMG_INFO.imgTipEl = createDiv();
        TARGET_IMG_INFO.imgTipEl.setAttribute('class', 'img-tip');
        TARGET_IMG_INFO.imgTipEl.hidden = true;
        TARGET_IMG_INFO.viewContainerEl.appendChild(TARGET_IMG_INFO.imgTipEl); // img-tip
        // <div class="img-footer"> ... <div>
        const imgFooterDiv = createDiv();
        imgFooterDiv.setAttribute('class', 'img-footer');
        TARGET_IMG_INFO.viewContainerEl.appendChild(imgFooterDiv); // img-footer
        // <div class="img-title"></div>
        TARGET_IMG_INFO.imgTitleEl = createDiv();
        TARGET_IMG_INFO.imgTitleEl.setAttribute('class', 'img-title');
        imgFooterDiv.appendChild(TARGET_IMG_INFO.imgTitleEl);
        // <ul class="img-toolbar">
        const imgToolbarUl = createEl('ul');
        imgToolbarUl.setAttribute('class', 'img-toolbar');
        imgFooterDiv.appendChild(imgToolbarUl);
        for (const toolbar of IMG_TOOLBAR_ICONS) {
            const toolbarLi = createEl('li');
            toolbarLi.setAttribute('class', toolbar.class);
            toolbarLi.setAttribute('alt', toolbar.key);
            // @ts-ignore
            toolbarLi.setAttribute('title', t(toolbar.title));
            imgToolbarUl.appendChild(toolbarLi);
        }
        // add event: for img-toolbar ul
        imgToolbarUl.addEventListener('click', clickToolbarUl);
    }
    // show the clicked image
    renderImgTitle(targetEl.alt);
    // add all events
    addOrRemoveEvent(true);
}

function openViewContainer() {
    if (!TARGET_IMG_INFO.viewContainerEl) {
        console.error('obsidian-image-toolkit: image-toolkit-view-container has not been initialized.');
        return;
    }
    TARGET_IMG_INFO.viewContainerEl.style.setProperty('display', 'block');
    TARGET_IMG_INFO.state = true;
}

const closeViewContainer = (event?: MouseEvent): void => {
    if (event) {
        const targetClassName = (<HTMLElement>event.target).className;
        if ('img-container' != targetClassName && 'image-toolkit-view-container' != targetClassName && 'img-close' != targetClassName) {
            return;
        }
    }
    if (TARGET_IMG_INFO.viewContainerEl) {
        TARGET_IMG_INFO.viewContainerEl.style.setProperty('display', 'none');
        TARGET_IMG_INFO.state = false;
        renderImgTitle('');
        renderImgView('', '');
        // remove all events
        addOrRemoveEvent(false);
    }
}

export function removeViewContainer() {
    if (TARGET_IMG_INFO.viewContainerEl) {
        TARGET_IMG_INFO.viewContainerEl.remove();
    }
    DRAGGING = false;
    TARGET_IMG_INFO.state = false;
    TARGET_IMG_INFO.viewContainerEl = null;
    TARGET_IMG_INFO.imgViewEl = null;
    TARGET_IMG_INFO.imgTitleEl = null;
    TARGET_IMG_INFO.curWidth = 0;
    TARGET_IMG_INFO.curHeight = 0;
    TARGET_IMG_INFO.realWidth = 0;
    TARGET_IMG_INFO.realHeight = 0
    TARGET_IMG_INFO.moveX = 0;
    TARGET_IMG_INFO.moveY = 0;
    TARGET_IMG_INFO.rotate = 0;
}

function renderImgTitle(alt: string) {
    if (TARGET_IMG_INFO.imgTitleEl) {
        TARGET_IMG_INFO.imgTitleEl.setText(alt);
    }
}

function renderImgView(src: string, alt: string) {
    if (TARGET_IMG_INFO.imgViewEl) {
        TARGET_IMG_INFO.imgViewEl.setAttribute('src', src);
        TARGET_IMG_INFO.imgViewEl.setAttribute('alt', alt);
    }
}

export function renderImgTip() {
    if (TARGET_IMG_INFO.realWidth > 0 && TARGET_IMG_INFO.curWidth > 0) {
        if (TARGET_IMG_INFO.imgTipTimeout) {
            clearTimeout(TARGET_IMG_INFO.imgTipTimeout);
        }
        TARGET_IMG_INFO.imgTipEl.hidden = false;
        TARGET_IMG_INFO.imgTipEl.setText(parseInt(TARGET_IMG_INFO.curWidth * 100 / TARGET_IMG_INFO.realWidth + '') + '%');
        TARGET_IMG_INFO.imgTipTimeout = setTimeout(() => {
            TARGET_IMG_INFO.imgTipEl.hidden = true;
        }, 1000);
    }
}

function setImgViewPosition(imgZoomSize: any, rotate?: number) {
    if (imgZoomSize) {
        TARGET_IMG_INFO.imgViewEl.setAttribute('width', imgZoomSize.width);
        TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-top', imgZoomSize.top, 'important');
        TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-left', imgZoomSize.left, 'important');
    }
    const rotateDeg = rotate ? rotate : 0;
    TARGET_IMG_INFO.imgViewEl.style.transform = 'rotate(' + rotateDeg + 'deg)';
    TARGET_IMG_INFO.rotate = rotateDeg;
}

function refreshImg(imgSrc?: string, imgAlt?: string) {
    const src = imgSrc ? imgSrc : TARGET_IMG_INFO.imgViewEl.src;
    const alt = imgAlt ? imgAlt : TARGET_IMG_INFO.imgViewEl.alt;
    if (src) {
        let realImg = new Image();
        realImg.src = src;
        REAL_IMG_INTERVAL = setInterval((img) => {
            if (img.width > 0 || img.height > 0) {
                clearInterval(REAL_IMG_INTERVAL);
                REAL_IMG_INTERVAL = null;
                let imgZoomSize = calculateImgZoomSize(img, TARGET_IMG_INFO);
                setImgViewPosition(imgZoomSize, 0);
                renderImgView(src, alt);
                invertImgColor(TARGET_IMG_INFO.imgViewEl, false);
                renderImgTip();
            }
        }, 40, realImg);
    }
}

function zoomAndRender(ratio: number, event?: WheelEvent): any {
    let offsetSize: OFFSET_SIZE = { offsetX: 0, offsetY: 0 };
    if (event) {
        offsetSize.offsetX = event.offsetX;
        offsetSize.offsetY = event.offsetY;
    } else {
        offsetSize.offsetX = TARGET_IMG_INFO.curWidth / 2;
        offsetSize.offsetY = TARGET_IMG_INFO.curHeight / 2;
    }
    const zoomData = zoom(ratio, TARGET_IMG_INFO, offsetSize);
    renderImgTip();
    TARGET_IMG_INFO.imgViewEl.setAttribute('width', zoomData.newWidth) + 'px';
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-top', zoomData.top + 'px', 'important');
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-left', zoomData.left + 'px', 'important');
}

function clickToolbarUl(event: MouseEvent) {
    const targetElClass = (<HTMLElement>event.target).className;
    switch (targetElClass) {
        case 'toolbar_zoom_im':
            zoomAndRender(0.1);
            break;
        case 'toolbar_zoom_out':
            zoomAndRender(-0.1);
            break;
        case 'toolbar_refresh':
            refreshImg();
            break;
        case 'toolbar_rotate_left':
            rotate(-90, TARGET_IMG_INFO);
            break;
        case 'toolbar_rotate_right':
            rotate(90, TARGET_IMG_INFO);
            break;
        case 'toolbar_invert_color':
            INVERT_SWITCH = !INVERT_SWITCH;
            invertImgColor(TARGET_IMG_INFO.imgViewEl, INVERT_SWITCH);
            break;
        case 'toolbar_copy':
            copyImage(TARGET_IMG_INFO.imgViewEl, TARGET_IMG_INFO.curWidth, TARGET_IMG_INFO.curHeight);
            break;
        default:
            break;
    }
}

function closeViewContainerByKeyup(event: KeyboardEvent) {
    //console.log('keyup', event, event.code);
    event.stopPropagation();
    switch (event.code) {
        case 'Escape': // Esc
            closeViewContainer();
            break;
        default:
            break
    }
}

const mousedownImgView = (event: MouseEvent) => {
    // console.log('mousedownImgView', event);
    DRAGGING = true;
    event.stopPropagation();
    event.preventDefault();
    // 鼠标相对于图片的位置
    TARGET_IMG_INFO.moveX = TARGET_IMG_INFO.imgViewEl.offsetLeft - event.clientX;
    TARGET_IMG_INFO.moveY = TARGET_IMG_INFO.imgViewEl.offsetTop - event.clientY;
    // 鼠标按下时持续触发/移动事件 
    TARGET_IMG_INFO.viewContainerEl.onmousemove = mousemoveImgView;
    // 鼠标松开/回弹触发事件
    TARGET_IMG_INFO.viewContainerEl.onmouseup = mouseupImgView;
    TARGET_IMG_INFO.viewContainerEl.onmouseleave = mouseupImgView;
}

const mousemoveImgView = (event: MouseEvent) => {
    if (!DRAGGING) {
        return;
    }
    TARGET_IMG_INFO.top = event.clientY + TARGET_IMG_INFO.moveY;
    TARGET_IMG_INFO.left = event.clientX + TARGET_IMG_INFO.moveX;
    // 修改图片位置
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-top', TARGET_IMG_INFO.top + 'px', 'important');
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-left', TARGET_IMG_INFO.left + 'px', 'important');
}

const mouseupImgView = (event: MouseEvent) => {
    // console.log('mouseup...');
    DRAGGING = false;
    event.preventDefault();
    event.stopPropagation();
    TARGET_IMG_INFO.imgViewEl.onmousemove = null;
    TARGET_IMG_INFO.imgViewEl.onmouseup = null;
}

const mousewheelViewContainer = (event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // @ts-ignore
    zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
}

function addOrRemoveEvent(flag: boolean) {
    if (flag) {
        // close the popup layer (image-toolkit-view-container) via clicking pressing Esc
        document.addEventListener('keyup', closeViewContainerByKeyup);
        TARGET_IMG_INFO.viewContainerEl.onclick = closeViewContainer;
        // drag the image via mouse
        TARGET_IMG_INFO.imgViewEl.onmousedown = mousedownImgView;
        // zoom the image via mouse wheel
        TARGET_IMG_INFO.imgViewEl.addEventListener('mousewheel', mousewheelViewContainer);
    } else {
        document.removeEventListener('keyup', closeViewContainerByKeyup);
        TARGET_IMG_INFO.viewContainerEl.removeEventListener('onclick', closeViewContainer);
        TARGET_IMG_INFO.imgViewEl.removeEventListener('mousedown', mousedownImgView);
        TARGET_IMG_INFO.viewContainerEl.removeEventListener('mousewheel', mousewheelViewContainer);
        if (REAL_IMG_INTERVAL) {
            clearInterval(REAL_IMG_INTERVAL);
            REAL_IMG_INTERVAL = null;
        }
    }
}


