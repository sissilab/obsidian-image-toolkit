import {CONTAINER_TYPE, IMG_DEFAULT_BACKGROUND_COLOR, IMG_FULL_SCREEN_MODE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ImgStatusIto, ImgInfoIto} from "src/to/imgTo";
import {ImgUtil} from "src/util/imgUtil";
import {IMG_GLOBAL_SETTINGS} from "../conf/settings";
import {OffsetSizeIto} from "../to/commonTo";
import ar from "../lang/locale/ar";

export abstract class ContainerView {

    private readonly containerType: keyof typeof CONTAINER_TYPE;

    protected readonly plugin: ImageToolkitPlugin;

    // the clicked original image element
    protected targetOriginalImgEl: HTMLImageElement;

    private realImgInterval: NodeJS.Timeout;

    protected defaultImgStyles = {
        transform: 'none',
        filter: 'none',
        mixBlendMode: 'normal',

        borderWidth: '',
        borderStyle: '',
        borderColor: ''
    }

    protected imgStatus: ImgStatusIto = {
        popup: false,

        dragging: false,

        arrowUp: false,
        arrowDown: false,
        arrowLeft: false,
        arrowRight: false
    }

    protected imgInfo: ImgInfoIto = {
        oitContainerViewEl: null,
        imgViewEl: null,
        imgTitleEl: null,
        imgTipEl: null,
        imgTipTimeout: null,
        imgFooterEl: null,
        imgPlayerEl: null,
        imgPlayerImgViewEl: null,

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


    protected constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        this.plugin = plugin;
        this.containerType = containerType;
    }

    public getPlugin = (): ImageToolkitPlugin => {
        return this.plugin;
    }

    public getTargetOriginalImgEl = (): HTMLImageElement => {
        return this.targetOriginalImgEl;
    }

    //region ================== Container View & Init ========================
    /**
     * render when clicking an image
     * @param targetEl the clicked image's element
     * @returns
     */
    public renderContainerView = (targetEl: HTMLImageElement): void => {
        if (!this.checkStatus()) return;
        this.initContainerView(targetEl, this.plugin.app.workspace.containerEl);
        this.openOitContainerView();
        this.renderGalleryNavbar();
        this.refreshImg(targetEl.src, targetEl.alt);
    }

    public initContainerView = (targetEl: HTMLImageElement, containerEl: HTMLElement): void => {
        this.initContainerViewDom(containerEl);
        this.restoreBorderForLastTargetOriginalImg();
        this.initDefaultData(window.getComputedStyle(targetEl));
        this.addBorderForTargetOriginalImg(targetEl);
        this.addOrRemoveEvents(true); // add events
    }

    abstract initContainerViewDom(containerEl: HTMLElement): void;

    protected openOitContainerView = () => {
        if (!this.imgInfo.oitContainerViewEl) {
            console.error('obsidian-image-toolkit: oit-main-container-view has not been initialized!');
            return;
        }
        this.imgStatus.popup = true;
        // display 'oit-main-container-view' or 'oit-pin-container-view'
        this.imgInfo.oitContainerViewEl.style.setProperty('display', 'block');
    }

    abstract closeContainerView(event?: MouseEvent): void;

    public removeOitContainerView = () => {
        this.restoreBorderForLastTargetOriginalImg();
        this.removeGalleryNavbar();

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
    }

    protected checkStatus = (): boolean => {
        if (!this.containerType) return false;
        let oitContainerViewClass: string;
        switch (this.containerType) {
            case 'MAIN':
                if (this.plugin.settings.pinMode) {
                    return false;
                }
                oitContainerViewClass = 'oit-main-container-view';
                break;
            case 'PIN':
                if (!this.plugin.settings.pinMode) {
                    return false;
                }
                oitContainerViewClass = 'oit-pin-container-view';
                break;
            default:
                return false;
        }
        if (this.imgInfo.oitContainerViewEl) {
            const containerElList: HTMLCollectionOf<Element> = document.getElementsByClassName(oitContainerViewClass);
            if (!containerElList || 0 >= containerElList.length) {
                this.removeOitContainerView();
            }
        }
        return !this.imgStatus.popup;
    }

    public initDefaultData = (targetImgStyle: CSSStyleDeclaration) => {
        if (targetImgStyle) {
            this.defaultImgStyles.transform = 'none';
            this.defaultImgStyles.filter = targetImgStyle.filter;
            this.defaultImgStyles.mixBlendMode = targetImgStyle.mixBlendMode;

            this.defaultImgStyles.borderWidth = targetImgStyle.borderWidth;
            this.defaultImgStyles.borderStyle = targetImgStyle.borderStyle;
            this.defaultImgStyles.borderColor = targetImgStyle.borderColor;
        }

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

    protected setTargetOriginalImg = (targetEl: HTMLImageElement) => {
        if (!targetEl) return;
        // 'data-oit-target' is set for locating current image
        targetEl.setAttribute('data-oit-target', '1');
        this.targetOriginalImgEl = targetEl;
    }
    //endregion

    //region ================== (Original) Image Border ========================
    protected addBorderForTargetOriginalImg = (targetEl: HTMLImageElement) => {
        this.setTargetOriginalImg(targetEl);
        if (!targetEl || !this.plugin.settings.imageBorderToggle) return;
        const targetOriginalImgStyle = targetEl?.style;
        if (!targetOriginalImgStyle) return;
        targetOriginalImgStyle.setProperty('border-width', this.plugin.settings.imageBorderWidth);
        targetOriginalImgStyle.setProperty('border-style', this.plugin.settings.imageBorderStyle);
        targetOriginalImgStyle.setProperty('border-color', this.plugin.settings.imageBorderColor);
    }

    protected restoreBorderForLastTargetOriginalImg = () => {
        if (!this.targetOriginalImgEl) return;
        this.targetOriginalImgEl.removeAttribute('data-oit-target');
        const targetOriginalImgStyle = this.targetOriginalImgEl.style;
        if (targetOriginalImgStyle) {
            targetOriginalImgStyle.setProperty('border-width', this.defaultImgStyles.borderWidth);
            targetOriginalImgStyle.setProperty('border-style', this.defaultImgStyles.borderStyle);
            targetOriginalImgStyle.setProperty('border-color', this.defaultImgStyles.borderColor);
        }
    }
    //endregion

    //region ================== Image ========================
    public refreshImg = (imgSrc?: string, imgAlt?: string) => {
        const src = imgSrc ? imgSrc : this.imgInfo.imgViewEl.src;
        const alt = imgAlt ? imgAlt : this.imgInfo.imgViewEl.alt;
        this.renderImgTitle(alt);
        if (src) {
            if (this.realImgInterval) {
                clearInterval(this.realImgInterval);
                this.realImgInterval = null;
            }
            let realImg = new Image();
            realImg.src = src;
            this.realImgInterval = setInterval((img) => {
                if (img.width > 0 || img.height > 0) {
                    clearInterval(this.realImgInterval);
                    this.realImgInterval = null;
                    this.setImgViewPosition(ImgUtil.calculateImgZoomSize(img, this.imgInfo), 0);
                    this.renderImgView(src, alt);
                    this.renderImgTip();
                    this.imgInfo.imgViewEl.style.setProperty('transform', this.defaultImgStyles.transform);
                    this.imgInfo.imgViewEl.style.setProperty('filter', this.defaultImgStyles.filter);
                    this.imgInfo.imgViewEl.style.setProperty('mix-blend-mode', this.defaultImgStyles.mixBlendMode);
                }
            }, 40, realImg);
        }
    }

    protected renderImgTitle = (alt: string): void => {
    }

    protected setImgViewPosition = (imgZoomSize: ImgInfoIto, rotate?: number) => {
        if (imgZoomSize) {
            this.imgInfo.imgViewEl.setAttribute('width', imgZoomSize.curWidth + 'px');
            this.imgInfo.imgViewEl.style.setProperty('margin-top', imgZoomSize.top + 'px', 'important');
            this.imgInfo.imgViewEl.style.setProperty('margin-left', imgZoomSize.left + 'px', 'important');
        }
        const rotateDeg = rotate ? rotate : 0;
        this.imgInfo.imgViewEl.style.transform = 'rotate(' + rotateDeg + 'deg)';
        this.imgInfo.rotate = rotateDeg;
    }

    protected renderImgView = (src: string, alt: string) => {
        if (!this.imgInfo.imgViewEl) return;
        this.imgInfo.imgViewEl.setAttribute('src', src);
        this.imgInfo.imgViewEl.setAttribute('alt', alt);
    }

    public renderImgTip = () => {
        if (this.imgInfo.realWidth > 0 && this.imgInfo.curWidth > 0 && this.imgInfo.imgTipEl) {
            if (this.imgInfo.imgTipTimeout) {
                clearTimeout(this.imgInfo.imgTipTimeout);
            }
            if (this.plugin.settings.imgTipToggle) {
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
    //endregion

    //region ================== Gallery NavBar ========================
    protected switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
    }

    protected renderGalleryNavbar = () => {
    }

    protected removeGalleryNavbar = () => {
    }
    //endregion

    //region ================== full screen ========================
    /**
     * full-screen mode
     */
    protected showPlayerImg = () => {
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

    /**
     * close full screen
     */
    protected closePlayerImg = () => {
        this.imgInfo.fullScreen = false;
        if (this.imgInfo.imgPlayerEl) {
            this.imgInfo.imgPlayerEl?.style.setProperty('display', 'none'); // hide 'img-player'
            this.imgInfo.imgPlayerEl.removeEventListener('click', this.closePlayerImg);
        }
        if (this.imgInfo.imgPlayerImgViewEl) {
            this.imgInfo.imgPlayerImgViewEl.setAttribute('src', '');
            this.imgInfo.imgPlayerImgViewEl.setAttribute('alt', '');
        }
        this.imgInfo.imgViewEl?.style.setProperty('display', 'block', 'important');
        this.imgInfo.imgFooterEl?.style.setProperty('display', 'block');
    }
    //endregion

    //region ================== events ========================
    protected addOrRemoveEvents = (isAdd: boolean) => {
        if (isAdd) {
            document.addEventListener('keyup', this.triggerKeyup);
            document.addEventListener('keydown', this.triggerKeydown);
            // click event: hide container view
            this.imgInfo.oitContainerViewEl.addEventListener('click', this.closeContainerView);
            // drag the image via mouse
            this.imgInfo.imgViewEl.addEventListener('mousedown', this.mousedownImgView);
            // zoom the image via mouse wheel
            this.imgInfo.imgViewEl.addEventListener('mousewheel', this.mousewheelViewContainer, {passive: true});
        } else {
            document.removeEventListener('keyup', this.triggerKeyup);
            document.removeEventListener('keydown', this.triggerKeydown);
            this.imgInfo.oitContainerViewEl.removeEventListener('click', this.closeContainerView);
            this.imgInfo.imgViewEl.removeEventListener('mousedown', this.mousedownImgView);
            this.imgInfo.oitContainerViewEl.removeEventListener('mousewheel', this.mousewheelViewContainer);
            if (this.realImgInterval) {
                clearInterval(this.realImgInterval);
                this.realImgInterval = null;
            }
        }
    }

    protected triggerKeyup = (event: KeyboardEvent) => {
        // console.log('keyup', event, event.key);
        if ('PIN' !== this.containerType) {
            event.preventDefault();
            event.stopPropagation();
        }
        switch (event.key) {
            case 'Escape':
                // close full screen, hide container view
                this.imgInfo.fullScreen ? this.closePlayerImg() : this.closeContainerView();
                break;
            case 'ArrowUp':
                this.imgStatus.arrowUp = false;
                break;
            case 'ArrowDown':
                this.imgStatus.arrowDown = false;
                break;
            case 'ArrowLeft':
                this.imgStatus.arrowLeft = false;
                // switch to the previous image on the gallery navBar
                this.switchImageOnGalleryNavBar(event, false);
                break;
            case 'ArrowRight':
                this.imgStatus.arrowRight = false;
                // switch to the next image on the gallery navBar
                this.switchImageOnGalleryNavBar(event, true);
                break;
            default:
                break
        }
    }

    /**
     * move the image by keyboard
     * @param event
     */
    protected triggerKeydown = (event: KeyboardEvent) => {
        //console.log('keydown', event, event.key, this.imgStatus);
        if ('PIN' !== this.containerType) {
            event.preventDefault();
            event.stopPropagation();
        }
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

    protected moveImgViewByHotkey = (event: KeyboardEvent, orientation: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT') => {
        if (!orientation || !this.imgStatus.popup || !this.checkHotkeySettings(event, this.plugin.settings.moveTheImageHotkey))
            return;
        switch (orientation) {
            case 'UP':
                this.mousemoveImgView(null, {offsetX: 0, offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed});
                break;
            case 'DOWN':
                this.mousemoveImgView(null, {offsetX: 0, offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed});
                break;
            case 'LEFT':
                this.mousemoveImgView(null, {offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0});
                break;
            case 'RIGHT':
                this.mousemoveImgView(null, {offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed, offsetY: 0});
                break;
            case 'UP_LEFT':
                this.mousemoveImgView(null, {
                    offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed,
                    offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed
                });
                break;
            case 'UP_RIGHT':
                this.mousemoveImgView(null, {
                    offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed,
                    offsetY: -IMG_GLOBAL_SETTINGS.imageMoveSpeed
                });
                break;
            case 'DOWN_LEFT':
                this.mousemoveImgView(null, {
                    offsetX: -IMG_GLOBAL_SETTINGS.imageMoveSpeed,
                    offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed
                });
                break;
            case 'DOWN_RIGHT':
                this.mousemoveImgView(null, {
                    offsetX: IMG_GLOBAL_SETTINGS.imageMoveSpeed,
                    offsetY: IMG_GLOBAL_SETTINGS.imageMoveSpeed
                });
                break;
            default:
                break;
        }
    }

    abstract checkHotkeySettings(event: KeyboardEvent, hotkey: string): boolean;

    protected mousemoveImgView = (event: MouseEvent, offsetSize?: OffsetSizeIto) => {
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

    protected mousedownImgView = (event: MouseEvent) => {
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

    protected mouseupImgView = (event: MouseEvent) => {
        // console.log('mouseup...');
        this.imgStatus.dragging = false;
        event.preventDefault();
        event.stopPropagation();
        this.imgInfo.imgViewEl.onmousemove = null;
        this.imgInfo.imgViewEl.onmouseup = null;
    }

    protected mousewheelViewContainer = (event: WheelEvent) => {
        // event.preventDefault();
        event.stopPropagation();
        // @ts-ignore
        this.zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
    }

    protected zoomAndRender = (ratio: number, event?: WheelEvent, actualSize?: boolean) => {
        let offsetSize: OffsetSizeIto = {offsetX: 0, offsetY: 0};
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
    //endregion

}
