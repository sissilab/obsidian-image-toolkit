import {CONTAINER_TYPE, IMG_TOOLBAR_ICONS} from 'src/conf/constants';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {OffsetSizeIto} from 'src/to/commonTo';
import {ImgInfoIto} from 'src/to/imgTo';
import {ImgUtil} from 'src/util/imgUtil';
import {ContainerView} from './containerView';
import {GalleryNavbarView} from './galleryNavbarView';

export class MainContainerView extends ContainerView {

    private galleryNavbarView: GalleryNavbarView;

    private pinMaximum: number = 1;

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType);
    }

    //region ================== Container View ========================
    public initContainerViewDom = (containerEl: HTMLElement): void => {
        if (null == this.imgInfo.oitContainerViewEl || !this.imgInfo.oitContainerViewEl) {
            // console.log('initContainerView....', this.imgInfo.containerViewEl);
            // <div class="oit-main-container-view">
            containerEl.appendChild(this.imgInfo.oitContainerViewEl = createDiv('oit-main-container-view'));

            // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
            const imgContainerEl = createDiv('img-container');
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

    public closeContainerView = (event?: MouseEvent): void => {
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
    //endregion

    //region ================== Gallery Navbar ========================
    protected renderGalleryNavbar = () => {
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        if (!this.plugin.settings.galleryNavbarToggle) return;
        if (!this.galleryNavbarView) {
            this.galleryNavbarView = new GalleryNavbarView(this, this.plugin);
        }
        this.galleryNavbarView.renderGalleryImg(this.imgInfo.imgFooterEl);
    }

    protected removeGalleryNavbar = () => {
        if (!this.galleryNavbarView) return;
        this.galleryNavbarView.remove();
        this.galleryNavbarView = null;
    }
    //endregion

    protected renderImgTitle = (alt: string): void => {
        this.imgInfo.imgTitleEl?.setText(alt);
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
