import {CONTAINER_TYPE, TOOLBAR_CONF, ViewMode} from 'src/conf/constants';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {ContainerView} from './container.view';
import {GalleryNavbarView} from '../galleryNavbarView';
import {ImgCto} from "../../model/imgTo";

export class NormalContainerView extends ContainerView {

  private galleryNavbarView: GalleryNavbarView;

  constructor(plugin: ImageToolkitPlugin, viewMode: ViewMode) {
    super(plugin, viewMode, 1);
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

      // <div class="img-tip"></div>
      this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgTipEl = createDiv()); // img-tip
      this.imgInfoCto.imgTipEl.addClass('img-tip');
      this.imgInfoCto.imgTipEl.hidden = true; // hide 'img-tip'

      // <div class="img-footer"> ... <div>
      this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgFooterEl = createDiv()); // img-footer
      this.imgInfoCto.imgFooterEl.addClass('img-footer');

      // <div class="img-title"></div>
      this.imgInfoCto.imgFooterEl.appendChild(this.imgInfoCto.imgTitleEl = createDiv('img-title')); // img-title
      this.imgInfoCto.imgTitleEl.appendChild(this.imgInfoCto.imgTitleNameEl = createSpan('img-title-name'));
      this.imgInfoCto.imgTitleEl.appendChild(this.imgInfoCto.imgTitleIndexEl = createSpan('img-title-index'));

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
    }
    imgCto = this.imgInfoCto.imgList[0];
    this.imgGlobalStatus.activeImg = imgCto;
    return imgCto;
  }

  public openOitContainerView = (matchedImg: ImgCto): void => {
    if (!this.imgInfoCto.oitContainerViewEl) {
      console.error('obsidian-image-toolkit: oit-*-container-view has not been initialized!');
      return;
    }
    matchedImg.popup = true;
    this.imgGlobalStatus.popup = true;
    // display 'oit-main-container-view'
    this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'block');
  }

  public closeContainerView = (event?: MouseEvent, activeImg?: ImgCto): void => {
    if (event) {
      const targetClassName = (<HTMLElement>event.target).className;
      if ('img-container' != targetClassName && 'oit-main-container-view' != targetClassName) return;
    }
    if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
    if (this.imgInfoCto.oitContainerViewEl) {
      this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-main-container-view'
      this.renderImgTitle('', '');
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

  public renderImgTitle = (name?: string, index?: string): void => {
    if (undefined !== name && null !== name)
      this.imgInfoCto.imgTitleNameEl?.setText(name);
    if (undefined !== index && null !== index)
      this.imgInfoCto.imgTitleIndexEl?.setText(' ' + index);
  }

  protected switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
    if (!this.checkHotkeySettings(event, this.plugin.settings.switchTheImageHotkey))
      return;
    this.galleryNavbarView?.switchImage(next);
  }

}
