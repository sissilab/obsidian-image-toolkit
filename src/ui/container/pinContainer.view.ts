import {OIT_CLASS} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ContainerView} from "./container.view";
import {ImgCto} from "../../model/imgTo";
import {MenuView} from "../menuView";

/**
 * PinContainerView: Pin an image on the top
 * @Support: move an image by mouse; close an image by Esc
 * @Nonsupport: move an image by keyboard; display gallery navbar
 */
export class PinContainerView extends ContainerView {

  constructor(plugin: ImageToolkitPlugin/*, viewMode: ViewMode*/) {
    super(plugin/*, viewMode, plugin.settings.pinMaximum*/);
    this.setMenuView(new MenuView(this));
  }

  public setActiveImgForMouseEvent(imgCto: ImgCto): void {
    this.imgGlobalStatus.activeImg = imgCto;
  }

  //region ================== Container View ========================
  public initContainerDom = (parentContainerEl: Element): ImgCto => {
    /*
    <div class="oit-pin-container-view">
      <div class="oit-img-container">
        <img class="oit-img-view" data-index='0' src="" alt="">
        <img class="oit-img-view" data-index='1' src="" alt="">
        ...
      </div>
    </div>
     */
    if (!this.imgInfo.oitContainerEl) { // init at first time
      // create: <div class="oit oit-pin">
      (this.imgInfo.oitContainerEl = createDiv()).addClass(OIT_CLASS.CONTAINER_ROOT, OIT_CLASS.CONTAINER_PIN)
      parentContainerEl.appendChild(this.imgInfo.oitContainerEl);
      // <div class="oit oit-pin"> <div class="oit-img-container"/> </div>
      this.imgInfo.oitContainerEl.append(this.imgInfo.imgContainerEl = createDiv(OIT_CLASS.IMG_CONTAINER));

      // <div class="oit-img-tip"></div>
      this.imgInfo.oitContainerEl.appendChild(this.imgInfo.imgTipEl = createDiv(OIT_CLASS.IMG_TTP)); // oit-img-tip
      this.imgInfo.imgTipEl.hidden = true; // hide 'oit-img-tip'

      // <div class="img-player"> <img class='img-fullscreen' src=''> </div>
      this.imgInfo.oitContainerEl.appendChild(this.imgInfo.imgPlayerEl = createDiv(OIT_CLASS.IMG_PLAYER)); // img-player for full screen mode
      this.imgInfo.imgPlayerEl.appendChild(this.imgInfo.imgPlayerImgViewEl = createEl('img'));
      this.imgInfo.imgPlayerImgViewEl.addClass(OIT_CLASS.IMG_FULLSCREEN);
    }
    // <div class="oit-img-container"> <img class="oit-img-view" src="" alt=""> </div>
    this.updateImgViewElAndList(this.imgInfo);
    return this.getMatchedImg();
  }

  public openOitContainerView = (matchedImg: ImgCto): void => {
    if (!this.imgInfo.oitContainerEl) {
      console.error('obsidian-image-toolkit: oit-*-container-view has not been initialized!');
      return;
    }
    matchedImg.popup = true;
    if (!this.imgGlobalStatus.popup) {
      this.imgGlobalStatus.popup = true;
      this.imgGlobalStatus.activeImgZIndex = 0;
      this.imgInfo.imgList.forEach(value => {
        value.zIndex = 0;
      });
    } else {
      matchedImg.zIndex = (++this.imgGlobalStatus.activeImgZIndex);
    }
    matchedImg.imgViewEl.style.setProperty('z-index', matchedImg.zIndex + '');
    // display 'oit-pin-container-view'
    this.imgInfo.oitContainerEl.style.setProperty('display', 'block');
  }

  /**
   * hide container view
   * @param event not null: click event; null: keyboard event (Esc)
   * @param activeImg
   */
  public closeContainerView = (event?: MouseEvent, activeImg?: ImgCto): void => {
    if (event && !activeImg) {
      // PinContainerView doesn't need click event to hide container for now
      return;
    }
    if (!this.imgInfo.oitContainerEl) return;
    if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
    // console.log('closeContainerView', event, activeImg)
    this.renderImgView(activeImg.imgViewEl, '', '');
    activeImg.popup = false;
    activeImg.mtime = 0;

    let globalPopupFlag: boolean = false;
    for (const imgCto of this.imgInfo.imgList) {
      if (imgCto.popup) {
        globalPopupFlag = true;
        break;
      }
    }
    if (!globalPopupFlag) {
      this.imgInfo.oitContainerEl.style.setProperty('display', 'none'); // hide 'oit-pin-container-view'
      this.imgGlobalStatus.activeImgZIndex = 0;
      this.imgInfo.imgList.forEach(value => {
        value.zIndex = 0;
      });
    }
    this.imgGlobalStatus.popup = globalPopupFlag;
    this.addOrRemoveEvents(activeImg, false);
  }
  //endregion

  protected setActiveImgZIndex = (activeImg: ImgCto) => {
    let isUpdate: boolean = false;
    for (const imgCto of this.imgInfo.imgList) {
      if (activeImg.index !== imgCto.index && activeImg.zIndex <= imgCto.zIndex) {
        isUpdate = true;
        break;
      }
    }
    if (isUpdate) {
      activeImg.zIndex = (++this.imgGlobalStatus.activeImgZIndex);
      activeImg.imgViewEl?.style.setProperty("z-index", activeImg.zIndex + '');
    }
  }

}