import { IMG_TOOLBAR_ICONS, CLOSE_ICON } from '../conf/constants';
import { calculateImgZoomSize, zoom, rotate } from '../util/imgUtil';


let DRAGGING = false;
export const TARGET_IMG_INFO: IMG_INFO = {
    // true: the popup layer of viewing image is displayed
    state: false,

    viewContainerEl: null,
    imgViewEl: null,
    imgTitleEl: null,

    curWidth: 0,
    curHeight: 0,
    realWidth: 0,
    realHeight: 0,
    moveX: 0,
    moveY: 0,
    rotate: 0
}

export interface IMG_INFO {
    state: boolean,

    viewContainerEl: HTMLDivElement,
    imgViewEl: HTMLImageElement,
    imgTitleEl: HTMLDivElement

    curWidth: number,
    curHeight: number,
    realWidth: number,
    realHeight: number,
    moveX: number,
    moveY: number,
    rotate: number,
}

export function renderViewContainer(targetEl: HTMLImageElement, containerEl: HTMLElement) {
    initViewContainer(targetEl, containerEl);
    openViewContainer();
    refreshImg(targetEl.src);
}

export function initViewContainer(targetEl: HTMLImageElement, containerEl: HTMLElement) {
    if (null == TARGET_IMG_INFO.viewContainerEl || !TARGET_IMG_INFO.viewContainerEl) {
        console.log('initViewContainer....');
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
        TARGET_IMG_INFO.viewContainerEl.appendChild(imgContainerDiv);
        // <div class="img-close"></div>
        const imgCloseDiv = createDiv();
        imgCloseDiv.innerHTML = CLOSE_ICON.svg;
        imgCloseDiv.setAttribute('class', 'img-close');
        // add event: close the popup layer (image-toolkit-view-container) via clicking close button
        imgCloseDiv.addEventListener('click', closeViewContainer);
        TARGET_IMG_INFO.viewContainerEl.appendChild(imgCloseDiv);
        // <div class="img-footer"> ... <div>
        const imgFooterDiv = createDiv();
        imgFooterDiv.setAttribute('class', 'img-footer');
        TARGET_IMG_INFO.viewContainerEl.appendChild(imgFooterDiv);
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
            imgToolbarUl.appendChild(toolbarLi);
        }
        // add event: for img-toolbar ul
        imgToolbarUl.addEventListener('click', clickToolbarUl);
    }
    // show the clicked image
    renderImgView(targetEl.src, targetEl.alt);
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

function closeViewContainer() {
    if (TARGET_IMG_INFO.viewContainerEl) {
        TARGET_IMG_INFO.viewContainerEl.style.setProperty('display', 'none');
        TARGET_IMG_INFO.state = false;
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

function renderImgView(src: string, alt: string) {
    if (TARGET_IMG_INFO.imgTitleEl) {
        TARGET_IMG_INFO.imgTitleEl.setText(alt);
    }
    if (TARGET_IMG_INFO.imgViewEl) {
        TARGET_IMG_INFO.imgViewEl.setAttribute('src', src);
        TARGET_IMG_INFO.imgViewEl.setAttribute('alt', alt);
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

function refreshImg(imgSrc?: string) {
    const src = imgSrc ? imgSrc : TARGET_IMG_INFO.imgViewEl.src;
    if (src) {
        let imgZoomSize = calculateImgZoomSize(src);
        setImgViewPosition(imgZoomSize, 0);
    }
}

function clickToolbarUl(event: MouseEvent) {
    const targetElClass = (<HTMLElement>event.target).className;
    switch (targetElClass) {
        case 'toolbar_zoom_im':
            TARGET_IMG_INFO.imgViewEl.setAttribute('width', zoom(0.1) + 'px');
            break;
        case 'toolbar_zoom_out':
            TARGET_IMG_INFO.imgViewEl.setAttribute('width', zoom(-0.1) + 'px');
            break;
        case 'toolbar_refresh':
            refreshImg();
            break;
        case 'toolbar_rotate_left':
            rotate(-90);
            break;
        case 'toolbar_rotate_right':
            rotate(90);
            break;
        default:
            break;
    }
}

function closeViewContainerByKeyup(event: KeyboardEvent) {
    console.log('keyup', event, event.code);
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
    event.preventDefault();
    event.stopPropagation();
    // 鼠标相对于图片的位置
    TARGET_IMG_INFO.moveX = TARGET_IMG_INFO.imgViewEl.offsetLeft - event.clientX;
    TARGET_IMG_INFO.moveY = TARGET_IMG_INFO.imgViewEl.offsetTop - event.clientY;
    // 鼠标按下时持续触发/移动事件 
    TARGET_IMG_INFO.imgViewEl.addEventListener('mousemove', mousemoveImgView);
    // 鼠标松开/回弹触发事件
    TARGET_IMG_INFO.imgViewEl.addEventListener('mouseup', mouseupImgView);
}

const mousemoveImgView = (event: MouseEvent) => {
    if (!DRAGGING) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    // 修改图片位置
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-top', (event.clientY + TARGET_IMG_INFO.moveY) + 'px', 'important');
    TARGET_IMG_INFO.imgViewEl.style.setProperty('margin-left', (event.clientX + TARGET_IMG_INFO.moveX) + 'px', 'important');
}

const mouseupImgView = (event: MouseEvent) => {
    DRAGGING = false;
    event.preventDefault();
    event.stopPropagation();
    TARGET_IMG_INFO.imgViewEl && TARGET_IMG_INFO.imgViewEl.removeEventListener('mousemove', mousemoveImgView);
    TARGET_IMG_INFO.imgViewEl && TARGET_IMG_INFO.imgViewEl.removeEventListener('mouseup', mouseupImgView);
}

const mousewheelViewContainer = (event: WheelEvent) => {
    // console.log('mousewheel', event, event.wheelDelta);
    event.preventDefault();
    event.stopPropagation();
    TARGET_IMG_INFO.imgViewEl && TARGET_IMG_INFO.imgViewEl.setAttribute('width', zoom(0 < event.wheelDelta ? 0.1 : -0.1) + 'px');
}

function addOrRemoveEvent(flag: boolean) {
    if (flag) {
        // close the popup layer (image-toolkit-view-container) via clicking pressing Esc
        document.addEventListener('keyup', closeViewContainerByKeyup);
        // drag the image via mouse
        TARGET_IMG_INFO.imgViewEl && TARGET_IMG_INFO.imgViewEl.addEventListener('mousedown', mousedownImgView);
        // zoom the image via mouse wheel
        TARGET_IMG_INFO.viewContainerEl && TARGET_IMG_INFO.viewContainerEl.addEventListener('mousewheel', mousewheelViewContainer);
    } else {
        document.removeEventListener('keyup', closeViewContainerByKeyup);
        TARGET_IMG_INFO.imgViewEl && TARGET_IMG_INFO.imgViewEl.removeEventListener('mousedown', mousedownImgView);
        TARGET_IMG_INFO.viewContainerEl && TARGET_IMG_INFO.viewContainerEl.removeEventListener('mousewheel', mousewheelViewContainer);
    }
}