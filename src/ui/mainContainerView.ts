import { IMG_DEFAULT_BACKGROUND_COLOR, IMG_FULL_SCREEN_MODE, IMG_TOOLBAR_ICONS } from 'src/conf/constants';
import { IMG_GLOBAL_SETTINGS } from 'src/conf/settings';
import { t } from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import { OffsetSizeIto } from 'src/to/commonTo';
import { ImgInfoIto } from 'src/to/imgTo';
import { ImgUtil } from 'src/util/imgUtil';
import { ContainerView } from './containerView';
import { GalleryNavbarView } from './galleryNavbarView';

export class MainContainerView extends ContainerView {

    private galleryNavbarView: GalleryNavbarView;

    constructor(plugin: ImageToolkitPlugin) {
        super(plugin);
    }

    /**
     * render when clicking an image
     * @param targetEl the clicked image's element
     * @returns 
     */
    public renderContainerView = (targetEl: HTMLImageElement): void => {
        if (this.imgStatus.popup) return;
        this.initContainerView(targetEl, this.plugin.app.workspace.containerEl);
        this.openOitContainerView();
        this.renderGalleryNavbar();
        this.refreshImg(targetEl.src, targetEl.alt);
    }

    public initContainerView = (targetEl: HTMLImageElement, containerEl: HTMLElement): void => {
        if (this.imgInfo.oitContainerViewEl) {
            const containerElList: HTMLCollectionOf<Element> = document.getElementsByClassName('oit-main-container-view');
            if (!containerElList || 0 >= containerElList.length) {
                this.removeOitContainerView();
            }
        }
        if (null == this.imgInfo.oitContainerViewEl || !this.imgInfo.oitContainerViewEl) {
            // console.log('initContainerView....', this.imgInfo.containerViewEl);
            // <div class="oit-main-container-view">
            containerEl.appendChild(this.imgInfo.oitContainerViewEl = createDiv()) // oit-main-container-view
            this.imgInfo.oitContainerViewEl.addClass('oit-main-container-view');

            // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
            const imgContainerEl = createDiv();
            imgContainerEl.addClass('img-container');
            imgContainerEl.appendChild(this.imgInfo.imgViewEl = createEl('img')); // img-view
            this.imgInfo.imgViewEl.addClass('img-view');
            this.setImgViewDefaultBackground();
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

            // <div class="img-player"> <img class='img-fullscreen' src=''> </div>
            this.imgInfo.oitContainerViewEl.appendChild(this.imgInfo.imgPlayerEl = createDiv()); // img-player for full screen mode
            this.imgInfo.imgPlayerEl.addClass('img-player');
            this.imgInfo.imgPlayerEl.appendChild(this.imgInfo.imgPlayerImgViewEl = createEl('img'));
            this.imgInfo.imgPlayerImgViewEl.addClass('img-fullscreen');
        }
        this.restoreBorderForLastTargetOriginalImg(targetEl);
        this.initDefaultData(window.getComputedStyle(targetEl));
        this.addBorderForTargetOriginalImg(targetEl);
        this.addOrRemoveEvents(true); // add events
    }

    public openOitContainerView = () => {
        if (!this.imgInfo.oitContainerViewEl) {
            console.error('obsidian-image-toolkit: oit-main-container-view has not been initialized!');
            return;
        }
        this.imgStatus.popup = true;
        this.imgInfo.oitContainerViewEl.style.setProperty('display', 'block'); // display 'oit-main-container-view'
    }

    private closeViewContainer = (event?: MouseEvent): void => {
        if (event) {
            const targetClassName = (<HTMLElement>event.target).className;
            if ('img-container' != targetClassName && 'oit-main-container-view' != targetClassName) return;
        }
        if (this.imgInfo.oitContainerViewEl) {
            this.imgInfo.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-main-container-view'
            this.renderImgTitle('');
            this.renderImgView('', '');
            // remove events
            this.addOrRemoveEvents(false);
            this.imgStatus.popup = false;
        }
        if (this.plugin.settings.galleryNavbarToggle && this.galleryNavbarView) {
            this.galleryNavbarView.closeGalleryNavbar();
        }
    }

    public removeOitContainerView = () => {
        this.imgInfo.oitContainerViewEl?.remove();

        this.imgStatus.dragging = false;
        this.imgStatus.popup = false;

        this.imgInfo.oitContainerViewEl = null;
        this.imgInfo.imgViewEl = null;
        this.imgInfo.imgTitleEl = null;
        this.imgInfo.imgTipEl = null;
        this.imgInfo.imgTipTimeout = null;
        this.imgInfo.imgFooterEl = null;
        this.imgInfo.imgPlayerEl = null;
        this.imgInfo.imgPlayerImgViewEl = null;

        this.imgInfo.curWidth = 0;
        this.imgInfo.curHeight = 0;
        this.imgInfo.realWidth = 0;
        this.imgInfo.realHeight = 0
        this.imgInfo.moveX = 0;
        this.imgInfo.moveY = 0;
        this.imgInfo.rotate = 0;
        this.imgInfo.invertColor = false;
        this.imgInfo.scaleX = false;
        this.imgInfo.scaleY = false;
        this.imgInfo.fullScreen = false;

        this.galleryNavbarView?.removeGalleryNavbar();
        this.galleryNavbarView = null;
    }

    public setImgViewDefaultBackground = () => {
        if (!this.imgInfo.imgViewEl) return;
        const color = this.plugin.settings.imgViewBackgroundColor;
        if (color && IMG_DEFAULT_BACKGROUND_COLOR != color) {
            this.imgInfo.imgViewEl.removeClass('img-default-background');
            this.imgInfo.imgViewEl.style.setProperty('background-color', color);
        } else {
            this.imgInfo.imgViewEl.addClass('img-default-background');
            this.imgInfo.imgViewEl.style.removeProperty('background-color');
        }
    }

    private renderGalleryNavbar = () => {
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        if (!this.plugin.settings.galleryNavbarToggle) return;
        if (!this.galleryNavbarView) {
            this.galleryNavbarView = new GalleryNavbarView(this, this.plugin);
        }
        this.galleryNavbarView.renderGalleryImg(this.imgInfo.imgFooterEl);
    }

    public renderImgTitle = (alt: string): void => {
        this.imgInfo.imgTitleEl?.setText(alt);
    }

    private zoomAndRender = (ratio: number, event?: WheelEvent, actualSize?: boolean) => {
        let offsetSize: OffsetSizeIto = { offsetX: 0, offsetY: 0 };
        if (event) {
            offsetSize.offsetX = event.offsetX;
            offsetSize.offsetY = event.offsetY;
        } else {
            offsetSize.offsetX = this.imgInfo.curWidth / 2;
            offsetSize.offsetY = this.imgInfo.curHeight / 2;
        }
        const zoomData: ImgInfoIto = ImgUtil.zoom(ratio, this.imgInfo, offsetSize, actualSize);
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
            this.imgInfo.imgViewEl.addEventListener('mousewheel', this.mousewheelViewContainer, { passive: true });
        } else {
            // flag = false
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

    private clickImgToolbar = (event: MouseEvent): void => {
        const targetElClass = (<HTMLElement>event.target).className;
        switch (targetElClass) {
            case 'toolbar_zoom_to_100':
                this.zoomAndRender(null, null, true);
                break;
            case 'toolbar_zoom_in':
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
                ImgUtil.transform(this.imgInfo);
                break;
            case 'toolbar_rotate_right':
                this.imgInfo.rotate += 90;
                ImgUtil.transform(this.imgInfo);
                break;
            case 'toolbar_scale_x':
                this.imgInfo.scaleX = !this.imgInfo.scaleX;
                ImgUtil.transform(this.imgInfo);
                break;
            case 'toolbar_scale_y':
                this.imgInfo.scaleY = !this.imgInfo.scaleY;
                ImgUtil.transform(this.imgInfo);
                break;
            case 'toolbar_invert_color':
                this.imgInfo.invertColor = !this.imgInfo.invertColor;
                ImgUtil.invertImgColor(this.imgInfo.imgViewEl, this.imgInfo.invertColor);
                break;
            case 'toolbar_copy':
                ImgUtil.copyImage(this.imgInfo.imgViewEl, this.imgInfo.curWidth, this.imgInfo.curHeight);
                break;
            default:
                break;
        }
    }

    private triggerKeyup = (event: KeyboardEvent) => {
        // console.log('keyup', event, event.key);
        event.preventDefault();
        event.stopPropagation();
        switch (event.key) {
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
                // switch to the previous image
                this.switchImageOnGalleryNavBar(event, false);
                break;
            case 'ArrowRight':
                this.imgStatus.arrowRight = false;
                // switch to the next image
                this.switchImageOnGalleryNavBar(event, true);
                break;
            default:
                break
        }
    }

    private triggerKeydown = (event: KeyboardEvent) => {
        // console.log('keydown', event, event.key, this.imgStatus);
        event.preventDefault();
        event.stopPropagation();
        if (this.imgStatus.arrowUp && this.imgStatus.arrowLeft) {
            this.moveImgViewByHotkey(event, 'UP_LEFT');
            return;
        } else if (this.imgStatus.arrowUp && this.imgStatus.arrowRight) {
            this.moveImgViewByHotkey(event, 'UP_RIGHT');
            return;
        } else if (this.imgStatus.arrowDown && this.imgStatus.arrowLeft) {
            this.moveImgViewByHotkey(event, 'DOWN_LEFT');
            return;
        } else if (this.imgStatus.arrowDown && this.imgStatus.arrowRight) {
            this.moveImgViewByHotkey(event, 'DOWN_RIGHT');
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
                this.imgStatus.arrowUp = true;
                this.moveImgViewByHotkey(event, 'UP');
                break;
            case 'ArrowDown':
                this.imgStatus.arrowDown = true;
                this.moveImgViewByHotkey(event, 'DOWN');
                break;
            case 'ArrowLeft':
                this.imgStatus.arrowLeft = true;
                this.moveImgViewByHotkey(event, 'LEFT');
                break;
            case 'ArrowRight':
                this.imgStatus.arrowRight = true;
                this.moveImgViewByHotkey(event, 'RIGHT');
                break;
            default:
                break
        }
    }

    public moveImgViewByHotkey = (event: KeyboardEvent, orientation: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT') => {
        if (!orientation || !this.imgStatus.popup || !this.checkHotkeySettings(event, this.plugin.settings.moveTheImageHotkey))
            return;
        switch (orientation) {
            case 'UP':
                this.mousemoveImgView(null, { offsetX: 0, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            case 'DOWN':
                this.mousemoveImgView(null, { offsetX: 0, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            case 'LEFT':
                this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0 });
                break;
            case 'RIGHT':
                this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0 });
                break;
            case 'UP_LEFT':
                this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            case 'UP_RIGHT':
                this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            case 'DOWN_LEFT':
                this.mousemoveImgView(null, { offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            case 'DOWN_RIGHT':
                this.mousemoveImgView(null, { offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed });
                break;
            default:
                break;
        }
    }

    private switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
        if (!this.checkHotkeySettings(event, this.plugin.settings.switchTheImageHotkey))
            return;
        this.galleryNavbarView.switchImage(next);
    }

    private checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
        switch (hotkey) {
            case "NONE":
                return !event.ctrlKey && !event.altKey && !event.shiftKey;
            case "CTRL":
                return event.ctrlKey && !event.altKey && !event.shiftKey;
            case "ALT":
                return !event.ctrlKey && event.altKey && !event.shiftKey;
            case "SHIFT":
                return !event.ctrlKey && !event.altKey && event.shiftKey;
            case "CTRL_ALT":
                return event.ctrlKey && event.altKey && !event.shiftKey;
            case "CTRL_SHIFT":
                return event.ctrlKey && !event.altKey && event.shiftKey;
            case "SHIFT_ALT":
                return !event.ctrlKey && event.altKey && event.shiftKey;
            case "CTRL_SHIFT_ALT":
                return event.ctrlKey && event.altKey && event.shiftKey;
        }
        return false;
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
        // move the image
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
        // event.preventDefault();
        event.stopPropagation();
        // @ts-ignore
        this.zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
    }

}
