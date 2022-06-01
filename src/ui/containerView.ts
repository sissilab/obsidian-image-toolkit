import {CONTAINER_TYPE, IMG_DEFAULT_BACKGROUND_COLOR, IMG_FULL_SCREEN_MODE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ImgCto, ImgInfoCto, ImgInfoIto, ImgStatusCto} from "src/to/imgTo";
import {ImgUtil} from "src/util/imgUtil";
import {IMG_GLOBAL_SETTINGS} from "../conf/settings";
import {OffsetSizeIto} from "../to/commonTo";

export abstract class ContainerView {

    private readonly containerType: keyof typeof CONTAINER_TYPE;

    protected readonly plugin: ImageToolkitPlugin;

    // the clicked original image element
    protected lastClickedImgEl: HTMLImageElement;

    //private realImgInterval: NodeJS.Timeout;

    protected defaultImgStyles2 = {
        transform: 'none',
        filter: 'none',
        mixBlendMode: 'normal',

        borderWidth: '',
        borderStyle: '',
        borderColor: ''
    }

    protected imgGlobalStatus: ImgStatusCto = new ImgStatusCto();

    protected imgInfoCto: ImgInfoCto = new ImgInfoCto();

    protected imgInfo2: ImgInfoIto = {
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

    public getLastClickedImgEl = (): HTMLImageElement => {
        return this.lastClickedImgEl;
    }

    //region ================== Container View & Init ========================
    /**
     * render when clicking an image
     * @param targetEl the clicked image's element
     * @returns
     */
    public renderContainerView = (targetEl: HTMLImageElement): void => {
        if (!this.checkStatus()) return;
        const matchedImg = this.initContainerView(targetEl, this.plugin.app.workspace.containerEl);
        if (!matchedImg) return;
        this.openOitContainerView();
        this.renderGalleryNavbar();
        this.refreshImg(targetEl.src, targetEl.alt, matchedImg);
    }

    public initContainerView = (targetEl: HTMLImageElement, containerEl: HTMLElement): ImgCto => {
        const matchedImg = this.initContainerViewDom(containerEl);
        if (!matchedImg) return null;
        this.restoreBorderForLastClickedImg(matchedImg);
        this.initDefaultData(matchedImg, window.getComputedStyle(targetEl));
        this.addBorderForTargetOriginalImg(targetEl);
        this.addOrRemoveEvents(matchedImg, true); // add events
        return matchedImg;
    }

    abstract initContainerViewDom(containerEl: HTMLElement): ImgCto;

    protected openOitContainerView = () => {
        // if (!this.imgInfo.oitContainerViewEl) {
        //     console.error('obsidian-image-toolkit: oit-main-container-view has not been initialized!');
        //     return;
        // }
        // this.imgStatus.popup = true;
        // // display 'oit-main-container-view' or 'oit-pin-container-view'
        // this.imgInfo.oitContainerViewEl.style.setProperty('display', 'block');

        this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'block');
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

    public initDefaultData = (matchedImg: ImgCto, targetImgStyle: CSSStyleDeclaration) => {
        if (targetImgStyle) {
            matchedImg.defaultImgStyle.transform = 'none';
            matchedImg.defaultImgStyle.filter = targetImgStyle.filter;
            matchedImg.defaultImgStyle.mixBlendMode = targetImgStyle.mixBlendMode;

            matchedImg.defaultImgStyle.borderWidth = targetImgStyle.borderWidth;
            matchedImg.defaultImgStyle.borderStyle = targetImgStyle.borderStyle;
            matchedImg.defaultImgStyle.borderColor = targetImgStyle.borderColor;
        }

        this.imgGlobalStatus.dragging = false;
        this.imgGlobalStatus.arrowUp = false;
        this.imgGlobalStatus.arrowDown = false;
        this.imgGlobalStatus.arrowLeft = false;
        this.imgGlobalStatus.arrowRight = false;

        matchedImg.invertColor = false;
        matchedImg.scaleX = false;
        matchedImg.scaleY = false;
        matchedImg.fullScreen = false;
    }

    protected setLastClickedImg = (targetEl: HTMLImageElement) => {
        if (!targetEl) return;
        // 'data-oit-target' is set for locating current image
        targetEl.setAttribute('data-oit-target', '1');
        this.lastClickedImgEl = targetEl;
    }
    //endregion

    //region ================== (Original) Image Border ========================
    protected addBorderForTargetOriginalImg = (targetEl: HTMLImageElement) => {
        this.setLastClickedImg(targetEl);
        if (!targetEl || !this.plugin.settings.imageBorderToggle) return;
        const lastClickedImgStyle = targetEl?.style;
        if (!lastClickedImgStyle) return;
        lastClickedImgStyle.setProperty('border-width', this.plugin.settings.imageBorderWidth);
        lastClickedImgStyle.setProperty('border-style', this.plugin.settings.imageBorderStyle);
        lastClickedImgStyle.setProperty('border-color', this.plugin.settings.imageBorderColor);
    }

    protected restoreBorderForLastClickedImg = (matchedImg: ImgCto) => {
        if (!this.lastClickedImgEl) return;
        this.lastClickedImgEl.removeAttribute('data-oit-target');
        const lastClickedImgStyle = this.lastClickedImgEl.style;
        if (lastClickedImgStyle) {
            lastClickedImgStyle.setProperty('border-width', matchedImg.defaultImgStyle.borderWidth);
            lastClickedImgStyle.setProperty('border-style', matchedImg.defaultImgStyle.borderStyle);
            lastClickedImgStyle.setProperty('border-color', matchedImg.defaultImgStyle.borderColor);
        }
    }
    //endregion

    //region ================== Image ========================
    protected updateImgViewElAndList = (imgMaxNum: number) => {
        if (!this.imgInfoCto.imgContainerEl) return;
        const imgNum = this.imgInfoCto.imgList.length;
        if (imgMaxNum < imgNum) {
            if (this.imgInfoCto.imgContainerEl) {
                // remove all imgViewEl and imgList
                this.imgInfoCto.imgContainerEl.innerHTML = '';
            }
            // clear imgList
            this.imgInfoCto.imgList.length = 0;
        }
        let imgViewEl: HTMLImageElement;
        const curTime = new Date().getTime();
        for (let i = imgNum; i < imgMaxNum; i++) {
            // <div class="img-container"> <img class='img-view' data-index='0' src='' alt=''> </div>
            imgViewEl = createEl('img');
            imgViewEl.addClass('img-view');
            imgViewEl.dataset.index = i + ''; // set data-index
            this.imgInfoCto.imgContainerEl.appendChild(imgViewEl);
            // cache imgList
            this.imgInfoCto.imgList.push(new ImgCto(i, curTime, imgViewEl));
        }
    }

    protected getMatchedImg = (): ImgCto => {
        let earliestImg: ImgCto;
        for (const img of this.imgInfoCto.imgList) {
            if (!earliestImg || earliestImg.mtime > img.mtime)
                earliestImg = img;
            if (img.popup)
                continue;
            return img;
        }
        if (this.plugin.settings.pinCoverMode) {
            return earliestImg;
        }
        return null;
    }

    public refreshImg = (imgCto: ImgCto, imgSrc?: string, imgAlt?: string) => {
        if (!imgSrc) imgSrc = imgCto.imgViewEl.src;
        if (!imgAlt) imgAlt = imgCto.imgViewEl.alt;
        this.renderImgTitle(imgAlt);
        if (imgSrc) {
            if (imgCto.refreshImgInterval) {
                clearInterval(imgCto.refreshImgInterval);
                imgCto.refreshImgInterval = null;
            }
            let realImg = new Image();
            realImg.src = imgSrc;
            imgCto.refreshImgInterval = setInterval((realImg) => {
                if (realImg.width > 0 || realImg.height > 0) {
                    clearInterval(imgCto.refreshImgInterval);
                    imgCto.refreshImgInterval = null;
                    this.setImgViewPosition(ImgUtil.calculateImgZoomSize(realImg, imgCto), 0);
                    this.renderImgView(imgCto.imgViewEl, imgSrc, imgAlt);
                    //todo this.renderImgTip();
                    imgCto.imgViewEl.style.setProperty('transform', this.defaultImgStyles.transform);
                    imgCto.imgViewEl.style.setProperty('filter', this.defaultImgStyles.filter);
                    imgCto.imgViewEl.style.setProperty('mix-blend-mode', this.defaultImgStyles.mixBlendMode);
                }
            }, 40, realImg);
        }
    }

    protected renderImgTitle = (alt: string): void => {
    }

    protected setImgViewPosition = (imgZoomSize: ImgCto, rotate?: number) => {
        const imgViewEl = imgZoomSize.imgViewEl;
        if (!imgViewEl) return;
        if (imgZoomSize) {
            imgViewEl.setAttribute('width', imgZoomSize.curWidth + 'px');
            imgViewEl.style.setProperty('margin-top', imgZoomSize.top + 'px', 'important');
            imgViewEl.style.setProperty('margin-left', imgZoomSize.left + 'px', 'important');
        }
        const rotateDeg = rotate ? rotate : 0;
        imgViewEl.style.transform = 'rotate(' + rotateDeg + 'deg)';
        imgZoomSize.rotate = rotateDeg;
    }

    protected renderImgView = (imgViewEl: HTMLImageElement, src: string, alt: string) => {
        if (!imgViewEl) return;
        imgViewEl.setAttribute('src', src);
        imgViewEl.setAttribute('alt', alt);
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
        this.imgGlobalStatus.fullScreen = false;
        for (const imgCto of this.imgInfoCto.imgList) {
            if (!imgCto.fullScreen) continue;
            // hide full screen
            if (imgCto.imgPlayerEl) {
                imgCto.imgPlayerEl?.style.setProperty('display', 'none'); // hide 'img-player'
                imgCto.imgPlayerEl.removeEventListener('click', this.closePlayerImg);
            }
            if (imgCto.imgPlayerImgViewEl) {
                imgCto.imgPlayerImgViewEl.setAttribute('src', '');
                imgCto.imgPlayerImgViewEl.setAttribute('alt', '');
            }
            // show the popped up image
            imgCto.imgViewEl?.style.setProperty('display', 'block', 'important');
            // show 'img-footer'
            imgCto.imgFooterEl?.style.setProperty('display', 'block');
        }
    }
    //endregion

    //region ================== events ========================
    protected addOrRemoveEvents = (matchedImg: ImgCto, isAdd: boolean) => {
        if (isAdd) {
            document.addEventListener('keyup', this.triggerKeyup);
            document.addEventListener('keydown', this.triggerKeydown);
            // click event: hide container view
            this.imgInfoCto.oitContainerViewEl.addEventListener('click', this.closeContainerView);
            // drag the image via mouse
            matchedImg.imgViewEl.addEventListener('mousedown', this.mousedownImgView);
            // zoom the image via mouse wheel
            matchedImg.imgViewEl.addEventListener('mousewheel', this.mousewheelViewContainer, {passive: true});
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
                this.imgGlobalStatus.fullScreen ? this.closePlayerImg() : this.closeContainerView();
                break;
            case 'ArrowUp':
                this.imgGlobalStatus.arrowUp = false;
                break;
            case 'ArrowDown':
                this.imgGlobalStatus.arrowDown = false;
                break;
            case 'ArrowLeft':
                this.imgGlobalStatus.arrowLeft = false;
                // switch to the previous image on the gallery navBar
                this.switchImageOnGalleryNavBar(event, false);
                break;
            case 'ArrowRight':
                this.imgGlobalStatus.arrowRight = false;
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
        if (this.imgGlobalStatus.arrowUp && this.imgGlobalStatus.arrowLeft) {
            this.moveImgViewByHotkey(event, 'UP_LEFT');
            return;
        } else if (this.imgGlobalStatus.arrowUp && this.imgGlobalStatus.arrowRight) {
            this.moveImgViewByHotkey(event, 'UP_RIGHT');
            return;
        } else if (this.imgGlobalStatus.arrowDown && this.imgGlobalStatus.arrowLeft) {
            this.moveImgViewByHotkey(event, 'DOWN_LEFT');
            return;
        } else if (this.imgGlobalStatus.arrowDown && this.imgGlobalStatus.arrowRight) {
            this.moveImgViewByHotkey(event, 'DOWN_RIGHT');
            return;
        }
        switch (event.key) {
            case 'ArrowUp':
                this.imgGlobalStatus.arrowUp = true;
                this.moveImgViewByHotkey(event, 'UP');
                break;
            case 'ArrowDown':
                this.imgGlobalStatus.arrowDown = true;
                this.moveImgViewByHotkey(event, 'DOWN');
                break;
            case 'ArrowLeft':
                this.imgGlobalStatus.arrowLeft = true;
                this.moveImgViewByHotkey(event, 'LEFT');
                break;
            case 'ArrowRight':
                this.imgGlobalStatus.arrowRight = true;
                this.moveImgViewByHotkey(event, 'RIGHT');
                break;
            default:
                break
        }
    }

    protected moveImgViewByHotkey = (event: KeyboardEvent, orientation: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT') => {
        if (!orientation || !this.imgGlobalStatus.popup || !this.checkHotkeySettings(event, this.plugin.settings.moveTheImageHotkey))
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

    /**
     * move the image by mouse or keyboard
     * @param event
     * @param offsetSize
     */
    protected mousemoveImgView = (event: MouseEvent, offsetSize?: OffsetSizeIto) => {
        console.log('mousemoveImgView', event, this.imgGlobalStatus.activeImg)
        const activeImg = this.imgGlobalStatus.activeImg;
        if (!this.imgGlobalStatus.dragging && !offsetSize && !activeImg) return;
        if (event) {
            activeImg.left = event.clientX + activeImg.moveX;
            activeImg.top = event.clientY + activeImg.moveY;
        } else if (offsetSize) {
            activeImg.left += offsetSize.offsetX;
            activeImg.top += offsetSize.offsetY;
        } else {
            return;
        }
        // move the image
        activeImg.imgViewEl.style.setProperty('margin-top', activeImg.top + 'px', 'important');
        activeImg.imgViewEl.style.setProperty('margin-left', activeImg.left + 'px', 'important');
    }

    protected mousedownImgView = (event: MouseEvent) => {
        console.log('mousedownImgView', event);
        event.stopPropagation();
        event.preventDefault();
        const targetEl = (<HTMLImageElement>event.target);
        let index: string;
        if (!targetEl || !(index = targetEl.dataset.index)) return;
        const activeImg: ImgCto = this.imgInfoCto.imgList[parseInt(index)];
        if (!activeImg) return;
        this.imgGlobalStatus.dragging = true;
        this.imgGlobalStatus.activeImg = activeImg;

        // 鼠标相对于图片的位置
        activeImg.moveX = activeImg.imgViewEl.offsetLeft - event.clientX;
        activeImg.moveY = activeImg.imgViewEl.offsetTop - event.clientY;
        // 鼠标按下时持续触发/移动事件
        activeImg.imgViewEl.onmousemove = this.mousemoveImgView;
        // 鼠标松开/回弹触发事件
        activeImg.imgViewEl.onmouseup = this.mouseupImgView;
        activeImg.imgViewEl.onmouseleave = this.mouseupImgView;
    }

    protected mouseupImgView = (event: MouseEvent) => {
        console.log('mouseupImgView', event);
        event.preventDefault();
        event.stopPropagation();
        const activeImg = this.imgGlobalStatus.activeImg;
        if (activeImg) {
            activeImg.imgViewEl.onmousemove = null;
            activeImg.imgViewEl.onmouseup = null;
            this.imgGlobalStatus.activeImg = null;
        }
        this.imgGlobalStatus.dragging = false;
    }

    protected mousewheelViewContainer = (event: WheelEvent) => {
        // event.preventDefault();
        event.stopPropagation();
        // @ts-ignore
        this.zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
    }

    protected zoomAndRender = (ratio: number, event?: WheelEvent, actualSize?: boolean) => {
        const activeImg = this.imgGlobalStatus.activeImg;
        let activeImgViewEl: HTMLImageElement;
        if (!activeImg || !(activeImgViewEl = activeImg.imgViewEl)) return;
        let offsetSize: OffsetSizeIto = {offsetX: 0, offsetY: 0};
        if (event) {
            offsetSize.offsetX = event.offsetX;
            offsetSize.offsetY = event.offsetY;
        } else {
            offsetSize.offsetX = activeImg.curWidth / 2;
            offsetSize.offsetY = activeImg.curHeight / 2;
        }
        const zoomData: ImgCto = ImgUtil.zoom(ratio, activeImg, offsetSize, actualSize);
        this.renderImgTip();
        activeImgViewEl.setAttribute('width', zoomData.curWidth + 'px');
        activeImgViewEl.style.setProperty('margin-top', zoomData.top + 'px', 'important');
        activeImgViewEl.style.setProperty('margin-left', zoomData.left + 'px', 'important');
    }
    //endregion

}
