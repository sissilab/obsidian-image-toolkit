import {
    CONTAINER_TYPE,
    IMG_FULL_SCREEN_MODE,
    IMG_TOOLBAR_ICONS
} from 'src/conf/constants';
import {IMG_GLOBAL_SETTINGS} from 'src/conf/settings';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {OffsetSizeIto} from 'src/to/commonTo';
import {ImgInfoIto} from 'src/to/imgTo';
import {ImgUtil} from 'src/util/imgUtil';
import {ContainerView} from './containerView';
import {GalleryNavbarView} from './galleryNavbarView';

export class MainContainerView extends ContainerView {

    private galleryNavbarView: GalleryNavbarView;

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType);
    }

    public initContainerViewDom = (containerEl: HTMLElement): void => {
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
    }

    public closeViewContainer = (event?: MouseEvent): void => {
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

    protected renderGalleryNavbar = () => {
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        if (!this.plugin.settings.galleryNavbarToggle) return;
        if (!this.galleryNavbarView) {
            this.galleryNavbarView = new GalleryNavbarView(this, this.plugin);
        }
        this.galleryNavbarView.renderGalleryImg(this.imgInfo.imgFooterEl);
    }

    protected renderImgTitle = (alt: string): void => {
        this.imgInfo.imgTitleEl?.setText(alt);
    }

    private zoomAndRender = (ratio: number, event?: WheelEvent, actualSize?: boolean) => {
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

    protected switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
        if (!this.checkHotkeySettings(event, this.plugin.settings.switchTheImageHotkey))
            return;
        this.galleryNavbarView.switchImage(next);
    }
}
