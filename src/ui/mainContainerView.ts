import {CONTAINER_TYPE, IMG_TOOLBAR_ICONS} from 'src/conf/constants';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {ImgCto} from 'src/to/imgTo';
import {ImgUtil} from 'src/util/imgUtil';
import {ContainerView} from './containerView';
import {GalleryNavbarView} from './galleryNavbarView';

export class MainContainerView extends ContainerView {

    private galleryNavbarView: GalleryNavbarView;

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType, 1);
    }

    public setActiveImgForMouseEvent(imgCto: ImgCto): void {
    }

    //region ================== Container View ========================
    public initContainerViewDom = (containerEl: HTMLElement): ImgCto => {
        let imgCto: ImgCto;
        if (!this.imgInfoCto.oitContainerViewEl) {
            // init at first time
            // create: <div class="oit-main-container-view">
            containerEl.appendChild(this.imgInfoCto.oitContainerViewEl = createDiv('oit-main-container-view'));
            // <div class="oit-main-container-view"> <div class="img-container"/> </div>
            this.imgInfoCto.oitContainerViewEl.append(this.imgInfoCto.imgContainerEl = createDiv('img-container'));

            // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
            this.updateImgViewElAndList(this.pinMaximum);
            imgCto = this.imgInfoCto.imgList[0];

            // <div class="img-tip"></div>
            this.imgInfoCto.oitContainerViewEl.appendChild(imgCto.imgTipEl = createDiv()); // img-tip
            imgCto.imgTipEl.addClass('img-tip');
            imgCto.imgTipEl.hidden = true; // hide 'img-tip'

            // <div class="img-footer"> ... <div>
            this.imgInfoCto.oitContainerViewEl.appendChild(imgCto.imgFooterEl = createDiv()); // img-footer
            imgCto.imgFooterEl.addClass('img-footer');
            // <div class="img-title"></div>
            imgCto.imgFooterEl.appendChild(imgCto.imgTitleEl = createDiv()); // img-title
            imgCto.imgTitleEl.addClass('img-title');
            // <ul class="img-toolbar">
            const imgToolbarUlEL = createEl('ul'); // img-toolbar
            imgToolbarUlEL.addClass('img-toolbar');
            imgCto.imgFooterEl.appendChild(imgToolbarUlEL);
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
            this.imgInfoCto.oitContainerViewEl.appendChild(imgCto.imgPlayerEl = createDiv()); // img-player for full screen mode
            imgCto.imgPlayerEl.addClass('img-player');
            imgCto.imgPlayerEl.appendChild(imgCto.imgPlayerImgViewEl = createEl('img'));
            imgCto.imgPlayerImgViewEl.addClass('img-fullscreen');
        } else {
            imgCto = this.imgInfoCto.imgList[0];
        }
        this.imgGlobalStatus.activeImg = imgCto;
        return imgCto;
    }

    public closeContainerView = (event?: MouseEvent): void => {
        if (event) {
            const targetClassName = (<HTMLElement>event.target).className;
            if ('img-container' != targetClassName && 'oit-main-container-view' != targetClassName) return;
        }
        if (this.imgInfoCto.oitContainerViewEl) {
            this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-main-container-view'
            this.renderImgTitle('');
            this.renderImgView(this.imgGlobalStatus.activeImg.imgViewEl, '', '');
            // remove events
            this.imgGlobalStatus.popup = false;
            this.imgGlobalStatus.activeImg.popup = false;
            this.imgGlobalStatus.activeImg.mtime = 0;
            this.addOrRemoveEvents(this.imgGlobalStatus.activeImg, false);
        }
        if (this.plugin.settings.galleryNavbarToggle && this.galleryNavbarView) {
            this.galleryNavbarView.closeGalleryNavbar();
        }
    }
    //endregion

    //region ================== Gallery Navbar ========================
    protected renderGalleryNavbar = () => {
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        if (!this.plugin.settings.galleryNavbarToggle) return;
        if (!this.galleryNavbarView) {
            this.galleryNavbarView = new GalleryNavbarView(this, this.plugin);
        }
        this.galleryNavbarView.renderGalleryImg(this.imgGlobalStatus.activeImg.imgFooterEl);
    }

    protected removeGalleryNavbar = () => {
        if (!this.galleryNavbarView) return;
        this.galleryNavbarView.remove();
        this.galleryNavbarView = null;
    }
    //endregion

    protected renderImgTitle = (alt: string): void => {
        this.imgGlobalStatus.activeImg.imgTitleEl?.setText(alt);
    }

    private clickImgToolbar = (event: MouseEvent): void => {
        const activeImg = this.imgGlobalStatus.activeImg;
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
                this.refreshImg(activeImg);
                break;
            case 'toolbar_rotate_left':
                activeImg.rotate -= 90;
                ImgUtil.transform(activeImg);
                break;
            case 'toolbar_rotate_right':
                activeImg.rotate += 90;
                ImgUtil.transform(activeImg);
                break;
            case 'toolbar_scale_x':
                activeImg.scaleX = !activeImg.scaleX;
                ImgUtil.transform(activeImg);
                break;
            case 'toolbar_scale_y':
                activeImg.scaleY = !activeImg.scaleY;
                ImgUtil.transform(activeImg);
                break;
            case 'toolbar_invert_color':
                activeImg.invertColor = !activeImg.invertColor;
                ImgUtil.invertImgColor(activeImg.imgViewEl, activeImg.invertColor);
                break;
            case 'toolbar_copy':
                ImgUtil.copyImage(activeImg.imgViewEl, activeImg.curWidth, activeImg.curHeight);
                break;
            default:
                break;
        }
    }

    protected switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
        if (!this.checkHotkeySettings(event, this.plugin.settings.switchTheImageHotkey))
            return;
        this.galleryNavbarView?.switchImage(next);
    }

    public checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
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

}
