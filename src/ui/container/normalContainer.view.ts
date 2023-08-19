import {OIT_CLASS, TOOLBAR_CONF} from 'src/conf/constants';
import {t} from 'src/lang/helpers';
import ImageToolkitPlugin from 'src/main';
import {ContainerView} from './container.view';
import {GalleryNavbarView} from '../galleryNavbarView';
import {ImgCto} from "../../model/imgTo";

export class NormalContainerView extends ContainerView {

  private galleryNavbarView: GalleryNavbarView;

  constructor(plugin: ImageToolkitPlugin) {
    super(plugin);
  }

  public setActiveImgForMouseEvent(imgCto: ImgCto): void {

  }

  //region ================== Container View ========================
  public initContainerDom = (parentContainerEl: Element): ImgCto => {
    let imgCto: ImgCto;
    if (!this.imgInfo.oitContainerEl) {
      // init `oit-normal` dom at first time
      // <div class="oit oit-normal"> ... <div>
      (this.imgInfo.oitContainerEl = createDiv()).addClass(OIT_CLASS.CONTAINER_ROOT, OIT_CLASS.CONTAINER_NORMAL)
      parentContainerEl.appendChild(this.imgInfo.oitContainerEl);

      // 1. <div class="oit-img-container">...</div>
      this.imgInfo.oitContainerEl.append(this.imgInfo.imgContainerEl = createDiv(OIT_CLASS.IMG_CONTAINER));
      // 1.1. <div class="oit-img-container"> `<img class="oit-img-view" src="" alt="">` </div>
      this.updateImgViewElAndList(this.imgInfo);

      // 2. <div class="oit-img-tip"></div>
      this.imgInfo.oitContainerEl.appendChild(this.imgInfo.imgTipEl = createDiv(OIT_CLASS.IMG_TTP));
      this.imgInfo.imgTipEl.hidden = true;

      // 3. <div class="oit-img-footer"> ... <div>
      this.imgInfo.oitContainerEl.appendChild(this.imgInfo.imgFooterEl = createDiv(OIT_CLASS.IMG_FOOTER));

      // 3.1. <div class="oit-img-title"></div>
      this.imgInfo.imgFooterEl.appendChild(this.imgInfo.imgTitleEl = createDiv(OIT_CLASS.IMG_TITLE));
      // <span class="oit-img-title-name"></span>
      this.imgInfo.imgTitleEl.appendChild(this.imgInfo.imgTitleNameEl = createSpan(OIT_CLASS.IMG_TITLE_NAME));
      // <span class="oit-img-title-index"></span>
      this.imgInfo.imgTitleEl.appendChild(this.imgInfo.imgTitleIndexEl = createSpan(OIT_CLASS.IMG_TITLE_INDEX));

      // 3.2. <ul class="oit-img-toolbar">
      const imgToolbarUlEL = createEl('ul');
      imgToolbarUlEL.addClass(OIT_CLASS.IMG_TOOLBAR);
      this.imgInfo.imgFooterEl.appendChild(imgToolbarUlEL);
      let toolbarLi: HTMLLIElement;
      for (const toolbar of TOOLBAR_CONF) {
        if (!toolbar.enableToolbarIcon) continue;
        imgToolbarUlEL.appendChild(toolbarLi = createEl('li'));
        toolbarLi.addClass(toolbar.class);
        toolbarLi.setAttribute('alt', toolbar.title);
        // @ts-ignore
        toolbarLi.setAttribute('title', t(toolbar.title));
      }
      // add event: for oit-img-toolbar ul
      imgToolbarUlEL.addEventListener('click', this.clickImgToolbar);

      // <div class="img-player"> <img class='img-fullscreen' src=''> </div>
      this.imgInfo.oitContainerEl.appendChild(this.imgInfo.imgPlayerEl = createDiv(OIT_CLASS.IMG_PLAYER)); // img-player for full screen mode
      this.imgInfo.imgPlayerEl.appendChild(this.imgInfo.imgPlayerImgViewEl = createEl('img'));
      this.imgInfo.imgPlayerImgViewEl.addClass(OIT_CLASS.IMG_FULLSCREEN);
    }
    imgCto = this.imgInfo.imgList[0];
    this.imgGlobalStatus.activeImg = imgCto;
    return imgCto;
  }

  public openOitContainerView = (matchedImg: ImgCto): void => {
    if (!this.imgInfo.oitContainerEl) {
      console.error('obsidian-image-toolkit: oit-*-container-view has not been initialized!');
      return;
    }
    matchedImg.popup = true;
    this.imgGlobalStatus.popup = true;
    // display 'oit-normal'
    this.imgInfo.oitContainerEl.style.setProperty('display', 'block');
  }

  public closeContainerView = (event?: MouseEvent, activeImg?: ImgCto): void => {
    if (event) {
      const target = <HTMLElement>event.target;
      if (!target || !(target.hasClass(OIT_CLASS.CONTAINER_ROOT) || target.hasClass(OIT_CLASS.IMG_CONTAINER)))
        return;
    }
    if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
    if (this.imgInfo.oitContainerEl) {
      this.imgInfo.oitContainerEl.style.setProperty('display', 'none'); // hide 'oit-normal'
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
    this.galleryNavbarView.renderGalleryImg(this.imgInfo.imgFooterEl);
  }

  protected removeGalleryNavbar = () => {
    if (!this.galleryNavbarView) return;
    this.galleryNavbarView.remove();
    this.galleryNavbarView = null;
  }
  //endregion

  public renderImgTitle = (name?: string, index?: string): void => {
    if (undefined !== name && null !== name)
      this.imgInfo.imgTitleNameEl?.setText(name);
    if (undefined !== index && null !== index)
      this.imgInfo.imgTitleIndexEl?.setText(' ' + index);
  }

  protected switchImageOnGalleryNavBar = (event: KeyboardEvent, next: boolean) => {
    if (!this.checkHotkeySettings(event, this.plugin.settings.switchTheImageHotkey))
      return;
    this.galleryNavbarView?.switchImage(next);
  }

}
