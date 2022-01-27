import { IMG_FULL_SCREEN_MODE, IMG_TOOLBAR_ICONS } from 'src/conf/constants';
import { IMG_GLOBAL_SETTINGS } from 'src/conf/settings';
import { t } from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import { ImgInfoIto } from 'src/to/ImgInfoIto';
import { ImgStatusIto } from 'src/to/ImgStatusIto';
import { OffsetSizeIto } from 'src/to/OffsetSizeIto';
import { calculateImgZoomSize, copyImage, invertImgColor, transform, zoom } from 'src/util/imgUtil';
import { renderGalleryImg } from './galleryNavbarView';

export class ContainerView {

    private readonly plugin: ImageToolkitPlugin;

    // the clicked original image element
    public targetImgEl: HTMLImageElement;

    private realImgInterval: NodeJS.Timeout;

    public imgInfo: ImgInfoIto = {
        oitContainerViewEl: null,
        imgViewEl: null,
        imgTitleEl: null,
        imgTipEl: null,
        imgTipTimeout: null,
        imgFooterEl: null,
        imgPlayerEl: null,
        imgPlayerImgViewEl: null,
        galleryNavbar: null,
        galleryList: null,

        curWidth: 0,
        curHeight: 0,
        realWidth: 0,
        realHeight: 0,
        left: 0,
        top: 0,
        moveX: 0,
        moveY: 0,
        rotate: 0,

        invertColor: false,
        scaleX: false,
        scaleY: false,

        fullScreen: false
    }

    private imgStatus: ImgStatusIto = {
        // whether the image is clicked and displayed on the popup layer
        popup: false,

        dragging: false,

        arrowUp: false,
        arrowDown: false,
        arrowLeft: false,
        arrowRight: false
    }

    private defaultImgStyles = {
        transform: 'none',
        filter: 'none',
        mixBlendMode: 'normal',

        borderWidth: '',
        borderStyle: '',
        borderColor: ''
    }

    constructor(plugin: ImageToolkitPlugin) {
        this.plugin = plugin;
    }

    public renderContainerView = (targetEl: HTMLImageElement): void => {
        if (this.imgStatus.popup) return;
        this.initContainerView(targetEl, this.plugin.app.workspace.containerEl);
        this.openOitContainerView();
        // <div class="gallery-navbar"> <ul class="img-toolbar"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        // this.imgInfo.imgFooterEl.append(renderGalleryImg(this, this.plugin));
        this.refreshImg(targetEl.src, targetEl.alt);
    }

    public initContainerView = (targetEl: HTMLImageElement, containerEl: HTMLElement): void => {
        if (null == this.imgInfo.oitContainerViewEl || !this.imgInfo.oitContainerViewEl) {
            // console.log('initContainerView....', this.imgInfo.containerViewEl);
            // <div class="oit-container-view">
            containerEl.appendChild(this.imgInfo.oitContainerViewEl = createDiv()) // oit-container-view
            this.imgInfo.oitContainerViewEl.addClass('oit-container-view');

            // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
            const imgContainerEl = createDiv();
            imgContainerEl.addClass('img-container');
            imgContainerEl.appendChild(this.imgInfo.imgViewEl = createEl('img')); // img-view
            this.imgInfo.imgViewEl.addClass('img-view');
            this.imgInfo.oitContainerViewEl.appendChild(imgContainerEl);

            // <div class="img-tip"></div>
            this.imgInfo.oitContainerViewEl.appendChild(this.imgInfo.imgTipEl = createDiv()); // img-tip
            this.imgInfo.imgTipEl.addClass('img-tip');
            this.imgInfo.imgTipEl.hidden = true; // hide 'img-tip'

            // <div class="img-footer"> ... <div>
            this.imgInfo.oitContainerViewEl.appendChild(this.imgInfo.imgFooterEl = createDiv()); // img-footer
            this.imgInfo.imgFooterEl.addClass('img-footer');
            // <div class="img-title"></div>
            this.imgInfo.imgFooterEl.appendChild(this.imgInfo.imgTitleEl = createDiv()); // img-title
            this.imgInfo.imgTitleEl.addClass('img-title');
            // <ul class="img-toolbar">
            const imgToolbarUlEL = createEl('ul'); // img-toolbar
            imgToolbarUlEL.addClass('img-toolbar');
            this.imgInfo.imgFooterEl.appendChild(imgToolbarUlEL);
            let toolbarLi: HTMLLIElement;
            for (const toolbar of IMG_TOOLBAR_ICONS) {
                imgToolbarUlEL.appendChild(toolbarLi = createEl('li'));
                toolbarLi.addClass(toolbar.class);
                toolbarLi.setAttribute('alt', toolbar.key);
                // @ts-ignore
                toolbarLi.setAttribute('title', t(toolbar.title));
            }
            // add event: for img-toolbar ul
            imgToolbarUlEL.addEventListener('click', this.clickImgToolbar);

            // <div class="img-player"> <img src=''> </div>
            this.imgInfo.oitContainerViewEl.appendChild(this.imgInfo.imgPlayerEl = createDiv()); // img-player for full screen mode
            this.imgInfo.imgPlayerEl.addClass('img-player');
            this.imgInfo.imgPlayerEl.appendChild(this.imgInfo.imgPlayerImgViewEl = createEl('img'));
        }
        this.setTargetImg(targetEl);
        this.initDefaultData(window.getComputedStyle(targetEl));
        this.addOrRemoveEvents(true); // add events
    }

    private setTargetImg = (targetEl: HTMLImageElement) => {
        this.restoreBorderForLastTargetImg();
        this.targetImgEl?.removeAttribute('data-oit-target');
        this.targetImgEl = targetEl;
        this.targetImgEl.setAttribute('data-oit-target', '1');
    }

    public initDefaultData = (targetImgStyle: CSSStyleDeclaration) => {
        if (targetImgStyle) {
            this.defaultImgStyles.transform = 'none';
            this.defaultImgStyles.filter = targetImgStyle.filter;
            // @ts-ignore
            this.defaultImgStyles.mixBlendMode = targetImgStyle.mixBlendMode;

            this.defaultImgStyles.borderWidth = targetImgStyle.borderWidth;
            this.defaultImgStyles.borderStyle = targetImgStyle.borderStyle;
            this.defaultImgStyles.borderColor = targetImgStyle.borderColor;
        }

        this.realImgInterval = null;

        this.imgStatus.dragging = false;
        this.imgStatus.arrowUp = false;
        this.imgStatus.arrowDown = false;
        this.imgStatus.arrowLeft = false;
        this.imgStatus.arrowRight = false;

        this.imgInfo.invertColor = false;
        this.imgInfo.scaleX = false;
        this.imgInfo.scaleY = false;
        this.imgInfo.fullScreen = false;
    }

    private openOitContainerView = () => {
        if (!this.imgInfo.oitContainerViewEl) {
            console.error('obsidian-image-toolkit: oit-container-view has not been initialized!');
            return;
        }
        this.imgStatus.popup = true;
        this.imgInfo.oitContainerViewEl.style.setProperty('display', 'block'); // display 'oit-container-view'
    }

    private closeViewContainer = (event?: MouseEvent): void => {
        if (event) {
            const targetClassName = (<HTMLElement>event.target).className;
            if ('img-container' != targetClassName && 'oit-container-view' != targetClassName) return;
        }
        if (this.imgInfo.oitContainerViewEl) {
            this.addBorderForTargetImg();
            this.imgInfo.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-container-view'
            this.renderImgTitle('');
            this.renderImgView('', '');
            // remove events
            this.addOrRemoveEvents(false);
            this.imgStatus.popup = false;
        }
    }

    public removeOitContainerView = () => {
        this.imgInfo.oitContainerViewEl?.remove();

        this.imgStatus.dragging = false;
        this.imgStatus.popup = false;

        this.imgInfo.oitContainerViewEl = null;
        this.imgInfo.imgViewEl = null;
        this.imgInfo.imgTitleEl = null;
        this.imgInfo.curWidth = 0;
        this.imgInfo.curHeight = 0;
        this.imgInfo.realWidth = 0;
        this.imgInfo.realHeight = 0
        this.imgInfo.moveX = 0;
        this.imgInfo.moveY = 0;
        this.imgInfo.rotate = 0;
    }

    public refreshImg = (imgSrc?: string, imgAlt?: string) => {
        const src = imgSrc ? imgSrc : this.imgInfo.imgViewEl.src;
        const alt = imgAlt ? imgAlt : this.imgInfo.imgViewEl.alt;
        this.renderImgTitle(alt);
        if (src) {
            let realImg = new Image();
            realImg.src = src;
            this.realImgInterval = setInterval((img) => {
                if (img.width > 0 || img.height > 0) {
                    clearInterval(this.realImgInterval);
                    this.realImgInterval = null;
                    this.setImgViewPosition(calculateImgZoomSize(img, this.imgInfo), 0);
                    this.renderImgView(src, alt);
                    this.renderImgTip();
                    this.imgInfo.imgViewEl.style.setProperty('transform', this.defaultImgStyles.transform);
                    this.imgInfo.imgViewEl.style.setProperty('filter', this.defaultImgStyles.filter);
                    this.imgInfo.imgViewEl.style.setProperty('mix-blend-mode', this.defaultImgStyles.mixBlendMode);
                }
            }, 40, realImg);
        }
    }

    private renderImgView = (src: string, alt: string) => {
        if (!this.imgInfo.imgViewEl) return;
        this.imgInfo.imgViewEl.setAttribute('src', src);
        this.imgInfo.imgViewEl.setAttribute('alt', alt);
    }

    private renderImgTitle = (alt: string) => {
        this.imgInfo.imgTitleEl?.setText(alt);
    }

    public renderImgTip = () => {
        if (this.imgInfo.realWidth > 0 && this.imgInfo.curWidth > 0) {
            if (this.imgInfo.imgTipTimeout) {
                clearTimeout(this.imgInfo.imgTipTimeout);
            }
            if (IMG_GLOBAL_SETTINGS.imgTipToggle) {
                this.imgInfo.imgTipEl.hidden = false; // display 'img-tip'
                this.imgInfo.imgTipEl.setText(parseInt(this.imgInfo.curWidth * 100 / this.imgInfo.realWidth + '') + '%');
                this.imgInfo.imgTipTimeout = setTimeout(() => {
                    this.imgInfo.imgTipEl.hidden = true;
                }, 1000);
            } else {
                this.imgInfo.imgTipEl.hidden = true; // hide 'img-tip'
                this.imgInfo.imgTipTimeout = null;
            }
        }
    }

    private setImgViewPosition = (imgZoomSize: ImgInfoIto, rotate?: number) => {
        if (imgZoomSize) {
            this.imgInfo.imgViewEl.setAttribute('width', imgZoomSize.curWidth + 'px');
            this.imgInfo.imgViewEl.style.setProperty('margin-top', imgZoomSize.top + 'px', 'important');
            this.imgInfo.imgViewEl.style.setProperty('margin-left', imgZoomSize.left + 'px', 'important');
        }
        const rotateDeg = rotate ? rotate : 0;
        this.imgInfo.imgViewEl.style.transform = 'rotate(' + rotateDeg + 'deg)';
        this.imgInfo.rotate = rotateDeg;
    }

    private zoomAndRender = (ratio: number, event?: WheelEvent) => {
        let offsetSize: OffsetSizeIto = { offsetX: 0, offsetY: 0 };
        if (event) {
            offsetSize.offsetX = event.offsetX;
            offsetSize.offsetY = event.offsetY;
        } else {
            offsetSize.offsetX = this.imgInfo.curWidth / 2;
            offsetSize.offsetY = this.imgInfo.curHeight / 2;
        }
        const zoomData: ImgInfoIto = zoom(ratio, this.imgInfo, offsetSize);
        this.renderImgTip();
        this.imgInfo.imgViewEl.setAttribute('width', zoomData.curWidth + 'px');
        this.imgInfo.imgViewEl.style.setProperty('margin-top', zoomData.top + 'px', 'important');
        this.imgInfo.imgViewEl.style.setProperty('margin-left', zoomData.left + 'px', 'important');
    }

    /**
     * full-screen mode
     */
    private showPlayerImg = () => {
        this.imgInfo.fullScreen = true;
        this.imgInfo.imgViewEl.style.setProperty('display', 'none', 'important'); // hide imgViewEl
        this.imgInfo.imgFooterEl.style.setProperty('display', 'none'); // hide 'img-footer'
        // show the img-player
        this.imgInfo.imgPlayerEl.style.setProperty('display', 'block'); // display 'img-player'
        this.imgInfo.imgPlayerEl.addEventListener('click', this.closePlayerImg);

        const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
        const windowHeight = document.documentElement.clientHeight || document.body.clientHeight;
        let newWidth, newHeight;
        let top = 0, left = 0;
        if (IMG_FULL_SCREEN_MODE.STRETCH == IMG_GLOBAL_SETTINGS.imgFullScreenMode) {
            newWidth = windowWidth + 'px';
            newHeight = windowHeight + 'px';
        } else if (IMG_FULL_SCREEN_MODE.FILL == IMG_GLOBAL_SETTINGS.imgFullScreenMode) {
            newWidth = '100%';
            newHeight = '100%';
        } else {
            // fit
            const widthRatio = windowWidth / this.imgInfo.realWidth;
            const heightRatio = windowHeight / this.imgInfo.realHeight;
            if (widthRatio <= heightRatio) {
                newWidth = windowWidth;
                newHeight = widthRatio * this.imgInfo.realHeight;
            } else {
                newHeight = windowHeight;
                newWidth = heightRatio * this.imgInfo.realWidth;
            }
            top = (windowHeight - newHeight) / 2;
            left = (windowWidth - newWidth) / 2;
            newWidth = newWidth + 'px';
            newHeight = newHeight + 'px';
        }
        this.imgInfo.imgPlayerImgViewEl.setAttribute('src', this.imgInfo.imgViewEl.src);
        this.imgInfo.imgPlayerImgViewEl.setAttribute('alt', this.imgInfo.imgViewEl.alt);
        this.imgInfo.imgPlayerImgViewEl.setAttribute('width', newWidth);
        this.imgInfo.imgPlayerImgViewEl.setAttribute('height', newHeight);
        this.imgInfo.imgPlayerImgViewEl.style.setProperty('margin-top', top + 'px');
        //this.imgInfo.imgPlayerImgViewEl.style.setProperty('margin-left', left + 'px');
    }

    private closePlayerImg = () => {
        this.imgInfo.fullScreen = false;
        this.imgInfo.imgPlayerEl.style.setProperty('display', 'none'); // hide 'img-player'
        this.imgInfo.imgPlayerEl.removeEventListener('click', this.closePlayerImg);

        this.imgInfo.imgPlayerImgViewEl.setAttribute('src', '');
        this.imgInfo.imgPlayerImgViewEl.setAttribute('alt', '');

        this.imgInfo.imgViewEl.style.setProperty('display', 'block', 'important');
        this.imgInfo.imgFooterEl.style.setProperty('display', 'block');
    }

    private addOrRemoveEvents = (flag: boolean) => {
        if (flag) {
            // close the popup layer (image-toolkit-view-container) via clicking pressing Esc
            document.addEventListener('keyup', this.triggerKeyup);
            document.addEventListener('keydown', this.triggerKeydown);
            this.imgInfo.oitContainerViewEl.addEventListener('click', this.closeViewContainer);
            // drag the image via mouse
            this.imgInfo.imgViewEl.addEventListener('mousedown', this.mousedownImgView);
            // zoom the image via mouse wheel
            this.imgInfo.imgViewEl.addEventListener('mousewheel', this.mousewheelViewContainer);
        } else {
            document.removeEventListener('keyup', this.triggerKeyup);
            document.removeEventListener('keydown', this.triggerKeydown);
            this.imgInfo.oitContainerViewEl.removeEventListener('click', this.closeViewContainer);
            this.imgInfo.imgViewEl.removeEventListener('mousedown', this.mousedownImgView);
            this.imgInfo.oitContainerViewEl.removeEventListener('mousewheel', this.mousewheelViewContainer);
            if (this.realImgInterval) {
                clearInterval(this.realImgInterval);
                this.realImgInterval = null;
            }
        }
    }

    private addBorderForTargetImg = () => {
        if (IMG_GLOBAL_SETTINGS.imageBorderToggle && this.targetImgEl) {
            const targetImgStyle = this.targetImgEl.style;
            targetImgStyle.setProperty('border-width', IMG_GLOBAL_SETTINGS.imageBorderWidth);
            targetImgStyle.setProperty('border-style', IMG_GLOBAL_SETTINGS.imageBorderStyle);
            targetImgStyle.setProperty('border-color', IMG_GLOBAL_SETTINGS.imageBorderColor);
        }
    }

    private restoreBorderForLastTargetImg = () => {
        const targetImgStyle = this.targetImgEl?.style;
        if (targetImgStyle) {
            targetImgStyle.setProperty('border-width', this.defaultImgStyles.borderWidth);
            targetImgStyle.setProperty('border-style', this.defaultImgStyles.borderStyle);
            targetImgStyle.setProperty('border-color', this.defaultImgStyles.borderColor);
        }
    }

    private clickImgToolbar = (event: MouseEvent): void => {
        const targetElClass = (<HTMLElement>event.target).className;
        switch (targetElClass) {
            case 'toolbar_zoom_im':
                this.zoomAndRender(0.1);
                break;
            case 'toolbar_zoom_out':
                this.zoomAndRender(-0.1);
                break;
            case 'toolbar_full_screen':
                this.showPlayerImg();
                break;
            case 'toolbar_refresh':
                this.refreshImg();
                break;
            case 'toolbar_rotate_left':
                this.imgInfo.rotate -= 90;
                transform(this.imgInfo);
                break;
            case 'toolbar_rotate_right':
                this.imgInfo.rotate += 90;
                transform(this.imgInfo);
                break;
            case 'toolbar_scale_x':
                this.imgInfo.scaleX = !this.imgInfo.scaleX;
                transform(this.imgInfo);
                break;
            case 'toolbar_scale_y':
                this.imgInfo.scaleY = !this.imgInfo.scaleY;
                transform(this.imgInfo);
                break;
            case 'toolbar_invert_color':
                this.imgInfo.invertColor = !this.imgInfo.invertColor;
                invertImgColor(this.imgInfo.imgViewEl, this.imgInfo.invertColor);
                break;
            case 'toolbar_copy':
                copyImage(this.imgInfo.imgViewEl, this.imgInfo.curWidth, this.imgInfo.curHeight);
                break;
            default:
                break;
        }
    }

    private triggerKeyup = (event: KeyboardEvent) => {
        //console.log('keyup', event, event.code);
        event.preventDefault();
        event.stopPropagation();
        switch (event.code) {
            case 'Escape': // Esc
                this.imgInfo.fullScreen ? this.closePlayerImg() : this.closeViewContainer();
                break;
            case 'ArrowUp':
                this.imgStatus.arrowUp = false;
                break;
            case 'ArrowDown':
                this.imgStatus.arrowDown = false;
                break;
            case 'ArrowLeft':
                this.imgStatus.arrowLeft = false;
                break;
            case 'ArrowRight':
                this.imgStatus.arrowRight = false;
                break;
            default:
                break
        }
    }

    private triggerKeydown = (event: KeyboardEvent) => {
        // console.log('keyup', event, event.code);
        event.preventDefault();
        event.stopPropagation();
        if (this.imgStatus.arrowUp && this.imgStatus.arrowLeft) {
            this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
            return;
        } else if (this.imgStatus.arrowUp && this.imgStatus.arrowRight) {
            this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
            return;
        } else if (this.imgStatus.arrowDown && this.imgStatus.arrowLeft) {
            this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
            return;
        } else if (this.imgStatus.arrowDown && this.imgStatus.arrowRight) {
            this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
            return;
        }
        switch (event.code) {
            case 'ArrowUp':
                this.mousemoveImgView(null, { offsetX: 0, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                this.imgStatus.arrowUp = true;
                break;
            case 'ArrowDown':
                this.mousemoveImgView(null, { offsetX: 0, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                this.imgStatus.arrowDown = true;
                break;
            case 'ArrowLeft':
                this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0 });
                this.imgStatus.arrowLeft = true;
                break;
            case 'ArrowRight':
                this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0 });
                this.imgStatus.arrowRight = true;
                break;
            default:
                break
        }
    }

    private mousedownImgView = (event: MouseEvent) => {
        // console.log('mousedownImgView', event);
        event.stopPropagation();
        event.preventDefault();
        this.imgStatus.dragging = true;
        // 鼠标相对于图片的位置
        this.imgInfo.moveX = this.imgInfo.imgViewEl.offsetLeft - event.clientX;
        this.imgInfo.moveY = this.imgInfo.imgViewEl.offsetTop - event.clientY;
        // 鼠标按下时持续触发/移动事件 
        this.imgInfo.oitContainerViewEl.onmousemove = this.mousemoveImgView;
        // 鼠标松开/回弹触发事件
        this.imgInfo.oitContainerViewEl.onmouseup = this.mouseupImgView;
        this.imgInfo.oitContainerViewEl.onmouseleave = this.mouseupImgView;
    }

    private mousemoveImgView = (event: MouseEvent, offsetSize?: OffsetSizeIto) => {
        if (!this.imgStatus.dragging && !offsetSize) return;
        if (event) {
            this.imgInfo.left = event.clientX + this.imgInfo.moveX;
            this.imgInfo.top = event.clientY + this.imgInfo.moveY;
        } else if (offsetSize) {
            this.imgInfo.left += offsetSize.offsetX;
            this.imgInfo.top += offsetSize.offsetY;
        } else {
            return;
        }
        // 修改图片位置
        this.imgInfo.imgViewEl.style.setProperty('margin-top', this.imgInfo.top + 'px', 'important');
        this.imgInfo.imgViewEl.style.setProperty('margin-left', this.imgInfo.left + 'px', 'important');
    }

    private mouseupImgView = (event: MouseEvent) => {
        // console.log('mouseup...');
        this.imgStatus.dragging = false;
        event.preventDefault();
        event.stopPropagation();
        this.imgInfo.imgViewEl.onmousemove = null;
        this.imgInfo.imgViewEl.onmouseup = null;
    }

    private mousewheelViewContainer = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
        // @ts-ignore
        this.zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
    }
}
