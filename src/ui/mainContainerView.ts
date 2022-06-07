import {CONTAINER_TYPE, TOOLBAR_CONF} from 'src/conf/constants';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {ImgCto} from 'src/to/imgTo';
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
            // imgCto = this.imgInfoCto.imgList[0];

            // <div class="img-tip"></div>
            this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgTipEl = createDiv()); // img-tip
            this.imgInfoCto.imgTipEl.addClass('img-tip');
            this.imgInfoCto.imgTipEl.hidden = true; // hide 'img-tip'

            // <div class="img-footer"> ... <div>
            this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgFooterEl = createDiv()); // img-footer
            this.imgInfoCto.imgFooterEl.addClass('img-footer');
            // <div class="img-title"></div>
            this.imgInfoCto.imgFooterEl.appendChild(this.imgInfoCto.imgTitleEl = createDiv()); // img-title
            this.imgInfoCto.imgTitleEl.addClass('img-title');
            // <ul class="img-toolbar">
            const imgToolbarUlEL = createEl('ul'); // img-toolbar
            imgToolbarUlEL.addClass('img-toolbar');
            this.imgInfoCto.imgFooterEl.appendChild(imgToolbarUlEL);
            let toolbarLi: HTMLLIElement;
            for (const toolbar of TOOLBAR_CONF) {
                if (!toolbar.enableToolbarIcon) continue;
                imgToolbarUlEL.appendChild(toolbarLi = createEl('li'));
                toolbarLi.addClass(toolbar.class);
                toolbarLi.setAttribute('alt', toolbar.title);
                // @ts-ignore
                toolbarLi.setAttribute('title', t(toolbar.title));
            }
            // add event: for img-toolbar ul
            imgToolbarUlEL.addEventListener('click', this.clickImgToolbar);

            // <div class="img-player"> <img class='img-fullscreen' src=''> </div>
            this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgPlayerEl = createDiv('img-player')); // img-player for full screen mode
            this.imgInfoCto.imgPlayerEl.appendChild(this.imgInfoCto.imgPlayerImgViewEl = createEl('img'));
            this.imgInfoCto.imgPlayerImgViewEl.addClass('img-fullscreen');
        } else {
            imgCto = this.imgInfoCto.imgList[0];
        }
        this.imgGlobalStatus.activeImg = imgCto;
        return imgCto;
    }

    public closeContainerView = (event?: MouseEvent, activeImg?: ImgCto): void => {
        if (event) {
            const targetClassName = (<HTMLElement>event.target).className;
            if ('img-container' != targetClassName && 'oit-main-container-view' != targetClassName) return;
        }
        if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
        if (this.imgInfoCto.oitContainerViewEl) {
            this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-main-container-view'
            this.renderImgTitle('');
            this.renderImgView(activeImg.imgViewEl, '', '');
            // remove events
            this.imgGlobalStatus.popup = false;
            activeImg.popup = false;
            activeImg.mtime = 0;
            this.addOrRemoveEvents(activeImg, false);
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
        this.galleryNavbarView.renderGalleryImg(this.imgInfoCto.imgFooterEl);
    }

    protected removeGalleryNavbar = () => {
        if (!this.galleryNavbarView) return;
        this.galleryNavbarView.remove();
        this.galleryNavbarView = null;
    }
    //endregion

    protected renderImgTitle = (alt: string): void => {
        this.imgInfoCto.imgTitleEl?.setText(alt);
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
