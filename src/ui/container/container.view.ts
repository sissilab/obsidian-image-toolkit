import {IMG_DEFAULT_BACKGROUND_COLOR, IMG_FULL_SCREEN_MODE, OIT_CLASS, ViewMode} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ImgCto, ImgInfoCto, ImgStatusCto} from "src/model/imgTo";
import {ImgUtil} from "src/util/imgUtil";
import {OffsetSizeIto} from "../../model/commonTo";
import {MenuView} from "../menuView";
import {Notice} from "obsidian";
import {t} from "../../lang/helpers";

export abstract class ContainerView {

  protected readonly plugin: ImageToolkitPlugin;

  // body
  protected parentContainerEl: Element;
  protected doc: Document;

  // the clicked original image element
  protected lastClickedImgEl: HTMLImageElement;
  protected lastClickedImgDefaultStyle = {
    borderWidth: '',
    borderStyle: '',
    borderColor: ''
  }

  protected imgGlobalStatus: ImgStatusCto = new ImgStatusCto();

  protected imgInfo: ImgInfoCto = new ImgInfoCto();

  // Right click menu
  protected menuView: MenuView;


  protected constructor(plugin: ImageToolkitPlugin) {
    this.plugin = plugin;
  }

  public getViewMode = (): ViewMode => {
    return this.plugin.settings.viewMode;
  }

  public isPinMode = (): boolean => {
    return ViewMode.Pin === this.getViewMode();
  }

  public isNormalMode = (): boolean => {
    return ViewMode.Normal === this.getViewMode();
  }

  protected setMenuView = (menuView: MenuView) => {
    this.menuView = menuView
  }

  public getPlugin = (): ImageToolkitPlugin => {
    return this.plugin;
  }

  public getLastClickedImgEl = (): HTMLImageElement => {
    return this.lastClickedImgEl;
  }

  public getActiveImg = (): ImgCto => {
    return this.imgGlobalStatus.activeImg;
  }

  public getDoc = (): Document => {
    return this.doc;
  }

  /*public setPinMaximum = (val: number) => {
    this.pinMaximum = val;
  }*/

  public getOitContainerViewEl = (): HTMLDivElement => {
    return this.imgInfo.imgContainerEl;
  }

  abstract setActiveImgForMouseEvent(imgCto: ImgCto): void;

  public getParentContainerEl = (targetEl?: HTMLImageElement): Element => {
    if (!targetEl) {
      return this.parentContainerEl;
    }
    if (!this.parentContainerEl) {
      this.parentContainerEl = targetEl.matchParent('body');
      this.doc = this.parentContainerEl.ownerDocument;
    }
    return this.parentContainerEl;
  }

  //region ================== Container View & Init ========================
  /**
   * Render when clicking an image (core step)
   * @param targetEl clicked image's element
   * @returns
   */
  public renderContainer = (targetEl: HTMLImageElement): void => {
    if (!this.checkStatus()) return;
    const matchedImg = this.initContainerView(targetEl, this.getParentContainerEl(targetEl));
    if (!matchedImg) return;
    this.openOitContainerView(matchedImg);
    this.renderGalleryNavbar();
    this.refreshImg(matchedImg, targetEl.src, targetEl.alt);
    matchedImg.mtime = new Date().getTime();
  }

  /**
   * initContainerDom ->
   * @param targetEl
   * @param parentContainerEl  targetEl's body
   */
  public initContainerView = (targetEl: HTMLImageElement, parentContainerEl: Element): ImgCto => {
    const matchedImg = this.initContainerDom(parentContainerEl);
    if (!matchedImg) return null;
    matchedImg.targetOriginalImgEl = targetEl;
    this.restoreBorderForLastClickedImg();
    this.initDefaultData(matchedImg, window.getComputedStyle(targetEl));
    this.addBorderForLastClickedImg(targetEl);
    this.addOrRemoveEvents(matchedImg, true); // add events
    return matchedImg;
  }

  abstract initContainerDom(parentContainerEl: Element): ImgCto;

  abstract openOitContainerView(matchedImg: ImgCto): void;

  abstract closeContainerView(event?: MouseEvent, activeImg?: ImgCto): void;

  public removeOitContainerView = () => {
    this.restoreBorderForLastClickedImg();
    this.removeGalleryNavbar();

    this.imgInfo.oitContainerEl?.remove();
    this.imgInfo.oitContainerEl = null;
    this.imgInfo.imgContainerEl = null;

    this.imgGlobalStatus.dragging = false;
    this.imgGlobalStatus.popup = false;
    this.imgGlobalStatus.activeImgZIndex = 0;
    this.imgGlobalStatus.fullScreen = false;
    this.imgGlobalStatus.activeImg = null;

    // clear imgList
    this.imgInfo.imgList.length = 0;
  }

  protected checkStatus = (): boolean => {
    const viewMode = this.plugin.getViewMode();
    if (!viewMode) return false;
    // none of popped-up-images
    if (!this.imgGlobalStatus.popup) return true;
    // Pin mode && Cover mode
    if (this.isPinMode() && this.plugin.settings.pinCoverMode) return true;
    // configured max images > current pop-up images
    if (this.getConfiguredPinMaximum() > this.imgInfo.getPopupImgNum()) return true;
    new Notice(t("PIN_MAXIMUM_NOTICE"));
    return false;
  }

  private getConfiguredPinMaximum = (): number => {
    if (this.isPinMode())
      return this.plugin.settings.pinMaximum;
    return 1;
  }

  public initDefaultData = (matchedImg: ImgCto, targetImgStyle: CSSStyleDeclaration) => {
    if (targetImgStyle) {
      matchedImg.defaultImgStyle.transform = 'none';
      matchedImg.defaultImgStyle.filter = targetImgStyle.filter;
      matchedImg.defaultImgStyle.mixBlendMode = targetImgStyle.mixBlendMode;

      matchedImg.defaultImgStyle.borderWidth = targetImgStyle.borderWidth;
      matchedImg.defaultImgStyle.borderStyle = targetImgStyle.borderStyle;
      matchedImg.defaultImgStyle.borderColor = targetImgStyle.borderColor;

      this.lastClickedImgDefaultStyle.borderWidth = targetImgStyle.borderWidth;
      this.lastClickedImgDefaultStyle.borderStyle = targetImgStyle.borderStyle;
      this.lastClickedImgDefaultStyle.borderColor = targetImgStyle.borderColor;
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

    if (!this.imgGlobalStatus.popup) {
      this.resetClickTimer();
    }
  }

  /**
   * set 'data-oit-target' and lastClickedImgEl
   * @param targetEl
   */
  protected setLastClickedImg = (targetEl: HTMLImageElement) => {
    if (!targetEl) return;
    // 'data-oit-target' is set for locating current image
    targetEl.setAttribute('data-oit-target', '1');
    this.lastClickedImgEl = targetEl;
  }
  //endregion

  //region ================== (Original) Image Border ========================
  protected addBorderForLastClickedImg = (targetEl: HTMLImageElement) => {
    this.setLastClickedImg(targetEl);
    if (!targetEl || !this.plugin.settings.imageBorderToggle) return;
    const lastClickedImgStyle = targetEl?.style;
    if (!lastClickedImgStyle) return;
    lastClickedImgStyle.setProperty('border-width', this.plugin.settings.imageBorderWidth);
    lastClickedImgStyle.setProperty('border-style', this.plugin.settings.imageBorderStyle);
    lastClickedImgStyle.setProperty('border-color', this.plugin.settings.imageBorderColor);
  }

  /**
   * remove 'data-oit-target'
   * restore default border style
   */
  protected restoreBorderForLastClickedImg = () => {
    if (!this.lastClickedImgEl) return;
    this.lastClickedImgEl.removeAttribute('data-oit-target');
    const lastClickedImgStyle = this.lastClickedImgEl.style;
    if (lastClickedImgStyle) {
      lastClickedImgStyle.setProperty('border-width', this.lastClickedImgDefaultStyle.borderWidth);
      lastClickedImgStyle.setProperty('border-style', this.lastClickedImgDefaultStyle.borderStyle);
      lastClickedImgStyle.setProperty('border-color', this.lastClickedImgDefaultStyle.borderColor);
    }
  }
  //endregion

  //region ================== Image ========================
  protected updateImgViewElAndList = (imgInfo: ImgInfoCto) => {
    if (!imgInfo?.imgContainerEl) return;
    const pinMaximum: number = this.getConfiguredPinMaximum();
    const imgNum = this.imgInfo.imgList.length;
    if (pinMaximum < imgNum) {
      // remove all imgViewEl and imgList
      imgInfo.imgContainerEl.innerHTML = '';
      // clear imgList
      imgInfo.imgList.length = 0;
    }
    // let isUpdate: boolean = false;
    const curTime = new Date().getTime();
    for (let i = imgNum; i < pinMaximum; i++) {
      // <div class="oit-img-container"> `<img class='oit-img-view' data-index='0' src='' alt=''>` </div>
      let imgViewEl = createEl('img');
      imgViewEl.addClass(OIT_CLASS.IMG_VIEW);
      imgViewEl.hidden = true; // hide 'oit-img-view' for now
      imgViewEl.dataset.index = i + ''; // set data-index
      this.setImgViewDefaultBackground(imgViewEl);
      imgInfo.imgContainerEl.appendChild(imgViewEl);
      // cache imgList
      imgInfo.imgList.push(new ImgCto(i, curTime, imgViewEl));
      // isUpdate = true;
    }
  }

  protected getMatchedImg = (): ImgCto => {
    let earliestImg: ImgCto;
    for (const img of this.imgInfo.imgList) {
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

  /**
   * it may from: renderContainerView(), switch GalleryNavbarView, click toolbar_refresh
   * @param imgCto
   * @param imgSrc
   * @param imgAlt
   * @param imgTitleIndex
   */
  public refreshImg = (imgCto: ImgCto, imgSrc?: string, imgAlt?: string, imgTitleIndex?: string) => {
    if (!imgSrc) imgSrc = imgCto.imgViewEl.src;
    if (!imgAlt) imgAlt = imgCto.imgViewEl.alt;
    this.renderImgTitle(imgAlt, imgTitleIndex);
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
          this.setImgViewPosition(ImgUtil.calculateImgZoomSize(realImg, imgCto,
            this.parentContainerEl?.clientWidth, this.parentContainerEl?.clientHeight), 0);
          this.renderImgView(imgCto.imgViewEl, imgSrc, imgAlt);
          this.renderImgTip(imgCto);
          imgCto.imgViewEl.style.setProperty('transform', imgCto.defaultImgStyle.transform);
          imgCto.imgViewEl.style.setProperty('filter', imgCto.defaultImgStyle.filter);
          imgCto.imgViewEl.style.setProperty('mix-blend-mode', imgCto.defaultImgStyle.mixBlendMode);
        }
      }, 40, realImg);
    }
  }

  public renderImgTitle = (name?: string, index?: string): void => {
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
    imgViewEl.hidden = !src && !alt;
  }

  public renderImgTip = (activeImg?: ImgCto) => {
    if (!activeImg)
      activeImg = this.imgGlobalStatus.activeImg;
    if (activeImg && this.imgInfo.imgTipEl && activeImg.realWidth > 0 && activeImg.curWidth > 0) {
      if (this.imgInfo.imgTipTimeout) {
        clearTimeout(this.imgInfo.imgTipTimeout);
      }
      if (this.plugin.settings.imgTipToggle) {
        this.imgInfo.imgTipEl.hidden = false; // display 'oit-img-tip'
        const ratio = activeImg.curWidth * 100 / activeImg.realWidth;
        const isSingleDigit: boolean = 10 > ratio;
        const width = isSingleDigit ? 20 : 40;
        const left = activeImg.left + activeImg.curWidth / 2 - width / 2;
        const top = activeImg.top + activeImg.curHeight / 2 - 10;

        this.imgInfo.imgTipEl.style.setProperty("width", width + 'px');
        this.imgInfo.imgTipEl.style.setProperty("font-size", isSingleDigit || 100 >= activeImg.curWidth ? 'xx-small' : 'x-small');
        this.imgInfo.imgTipEl.style.setProperty("left", left + 'px');
        this.imgInfo.imgTipEl.style.setProperty("top", top + 'px');
        this.imgInfo.imgTipEl.style.setProperty("z-index", activeImg.zIndex + '');
        this.imgInfo.imgTipEl.setText(parseInt(ratio + '') + '%');

        this.imgInfo.imgTipTimeout = setTimeout(() => {
          this.imgInfo.imgTipEl.hidden = true;
        }, 1000);
      } else {
        this.imgInfo.imgTipEl.hidden = true; // hide 'oit-img-tip'
        this.imgInfo.imgTipTimeout = null;
      }
    }
  }

  public setImgViewDefaultBackgroundForImgList = () => {
    for (const imgCto of this.imgInfo.imgList) {
      this.setImgViewDefaultBackground(imgCto.imgViewEl);
    }
  }

  public setImgViewDefaultBackground = (imgViewEl: HTMLImageElement) => {
    if (!imgViewEl) return;
    if (this.plugin.settings.imgViewBackgroundColor && IMG_DEFAULT_BACKGROUND_COLOR != this.plugin.settings.imgViewBackgroundColor) {
      imgViewEl.removeClass('img-default-background');
      imgViewEl.style.setProperty('background-color', this.plugin.settings.imgViewBackgroundColor);
    } else {
      imgViewEl.addClass('img-default-background');
      imgViewEl.style.removeProperty('background-color');
    }
  }

  protected setActiveImgZIndex = (activeImg: ImgCto) => {
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
  protected showPlayerImg = (activeImg: ImgCto) => {
    if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
    this.imgGlobalStatus.fullScreen = true;
    activeImg.fullScreen = true;
    // activeImg.imgViewEl.style.setProperty('display', 'none', 'important'); // hide imgViewEl
    // this.imgInfoCto.imgFooterEl?.style.setProperty('display', 'none'); // hide 'oit-img-footer'

    // show the img-player
    this.imgInfo.imgPlayerEl.style.setProperty('display', 'block');
    this.imgInfo.imgPlayerEl.style.setProperty('z-index', (this.imgGlobalStatus.activeImgZIndex + 10) + '');
    this.imgInfo.imgPlayerEl.addEventListener('click', this.closePlayerImg);

    const windowWidth = this.doc.documentElement.clientWidth || this.doc.body.clientWidth;
    const windowHeight = this.doc.documentElement.clientHeight || this.doc.body.clientHeight;
    let newWidth, newHeight;
    let top = 0, left = 0;
    if (IMG_FULL_SCREEN_MODE.STRETCH == this.plugin.settings.imgFullScreenMode) {
      newWidth = windowWidth + 'px';
      newHeight = windowHeight + 'px';
    } else if (IMG_FULL_SCREEN_MODE.FILL == this.plugin.settings.imgFullScreenMode) {
      newWidth = '100%';
      newHeight = '100%';
    } else {
      // fit
      const widthRatio = windowWidth / activeImg.realWidth;
      const heightRatio = windowHeight / activeImg.realHeight;
      if (widthRatio <= heightRatio) {
        newWidth = windowWidth;
        newHeight = widthRatio * activeImg.realHeight;
      } else {
        newHeight = windowHeight;
        newWidth = heightRatio * activeImg.realWidth;
      }
      top = (windowHeight - newHeight) / 2;
      left = (windowWidth - newWidth) / 2;
      newWidth = newWidth + 'px';
      newHeight = newHeight + 'px';
    }
    const imgPlayerImgViewEl = this.imgInfo.imgPlayerImgViewEl;
    if (imgPlayerImgViewEl) {
      imgPlayerImgViewEl.setAttribute('src', activeImg.imgViewEl.src);
      imgPlayerImgViewEl.setAttribute('alt', activeImg.imgViewEl.alt);
      imgPlayerImgViewEl.setAttribute('width', newWidth);
      imgPlayerImgViewEl.setAttribute('height', newHeight);
      imgPlayerImgViewEl.style.setProperty('margin-top', top + 'px');
      //this.imgInfo.imgPlayerImgViewEl.style.setProperty('margin-left', left + 'px');
      this.setImgViewDefaultBackground(imgPlayerImgViewEl);
    }
  }

  /**
   * close full screen
   */
  protected closePlayerImg = () => {
    for (const imgCto of this.imgInfo.imgList) {
      if (!imgCto.fullScreen) continue;
      // show the popped up image
      // imgCto.imgViewEl?.style.setProperty('display', 'block', 'important');
      // this.imgInfoCto.imgFooterEl?.style.setProperty('display', 'block');
    }
    // hide full screen
    if (this.imgInfo.imgPlayerEl) {
      this.imgInfo.imgPlayerEl.style.setProperty('display', 'none'); // hide 'img-player'
      this.imgInfo.imgPlayerEl.removeEventListener('click', this.closePlayerImg);
    }
    if (this.imgInfo.imgPlayerImgViewEl) {
      this.imgInfo.imgPlayerImgViewEl.setAttribute('src', '');
      this.imgInfo.imgPlayerImgViewEl.setAttribute('alt', '');
    }
    this.imgGlobalStatus.fullScreen = false;
  }
  //endregion

  //region ================== events ========================
  protected addOrRemoveEvents = (matchedImg: ImgCto, isAdd: boolean) => {
    if (isAdd) {
      if (!this.imgGlobalStatus.popup) {
        this.doc.addEventListener('keydown', this.triggerKeydown);
        this.doc.addEventListener('keyup', this.triggerKeyup);
      }
      if (this.isNormalMode()) {
        // click event: hide container view
        this.imgInfo.oitContainerEl.addEventListener('click', this.closeContainerView);
      }
      matchedImg.imgViewEl.addEventListener('mouseenter', this.mouseenterImgView);
      matchedImg.imgViewEl.addEventListener('mouseleave', this.mouseleaveImgView);
      // drag the image via mouse
      matchedImg.imgViewEl.addEventListener('mousedown', this.mousedownImgView);
      matchedImg.imgViewEl.addEventListener('mouseup', this.mouseupImgView);
      // zoom the image via mouse wheel
      matchedImg.imgViewEl.addEventListener('mousewheel', this.mousewheelViewContainer, {passive: true});
    } else {
      if (!this.imgGlobalStatus.popup) {
        this.doc.removeEventListener('keydown', this.triggerKeydown);
        this.doc.removeEventListener('keyup', this.triggerKeyup);

        if (this.imgGlobalStatus.clickTimer) {
          clearTimeout(this.imgGlobalStatus.clickTimer);
          this.imgGlobalStatus.clickTimer = null;
          this.imgGlobalStatus.clickCount = 0;
        }
      }
      if (!this.isPinMode()) {
        this.imgInfo.oitContainerEl.removeEventListener('click', this.closeContainerView);
      }
      matchedImg.imgViewEl.removeEventListener('mouseenter', this.mouseenterImgView);
      matchedImg.imgViewEl.removeEventListener('mouseleave', this.mouseleaveImgView);
      matchedImg.imgViewEl.removeEventListener('mousedown', this.mousedownImgView);
      matchedImg.imgViewEl.removeEventListener('mouseup', this.mouseupImgView);
      matchedImg.imgViewEl.removeEventListener('mousewheel', this.mousewheelViewContainer);
      if (matchedImg.refreshImgInterval) {
        clearInterval(matchedImg.refreshImgInterval);
        matchedImg.refreshImgInterval = null;
      }
    }
  }

  protected triggerKeyup = (event: KeyboardEvent) => {
    // console.log('keyup', event, event.key);
    const key = event.key;
    if (!key) return;
    if (!('Escape' === key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    switch (key) {
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
    if (this.isPinMode()) return;
    event.preventDefault();
    event.stopPropagation();
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
        this.mousemoveImgView(null, {offsetX: 0, offsetY: -this.plugin.settings.imageMoveSpeed});
        break;
      case 'DOWN':
        this.mousemoveImgView(null, {offsetX: 0, offsetY: this.plugin.settings.imageMoveSpeed});
        break;
      case 'LEFT':
        this.mousemoveImgView(null, {offsetX: -this.plugin.settings.imageMoveSpeed, offsetY: 0});
        break;
      case 'RIGHT':
        this.mousemoveImgView(null, {offsetX: this.plugin.settings.imageMoveSpeed, offsetY: 0});
        break;
      case 'UP_LEFT':
        this.mousemoveImgView(null, {
          offsetX: -this.plugin.settings.imageMoveSpeed,
          offsetY: -this.plugin.settings.imageMoveSpeed
        });
        break;
      case 'UP_RIGHT':
        this.mousemoveImgView(null, {
          offsetX: this.plugin.settings.imageMoveSpeed,
          offsetY: -this.plugin.settings.imageMoveSpeed
        });
        break;
      case 'DOWN_LEFT':
        this.mousemoveImgView(null, {
          offsetX: -this.plugin.settings.imageMoveSpeed,
          offsetY: this.plugin.settings.imageMoveSpeed
        });
        break;
      case 'DOWN_RIGHT':
        this.mousemoveImgView(null, {
          offsetX: this.plugin.settings.imageMoveSpeed,
          offsetY: this.plugin.settings.imageMoveSpeed
        });
        break;
      default:
        break;
    }
  }

  public checkHotkeySettings = (event: KeyboardEvent | MouseEvent, hotkey: string): boolean => {
    // console.log("[oit] checkHotkeySettings: ", event.ctrlKey, event.altKey, event.shiftKey)
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

  protected mouseenterImgView = (event: MouseEvent) => {
    this.resetClickTimer();
    event.stopPropagation();
    event.preventDefault();
    this.getAndUpdateActiveImg(event);
    // console.log('mouseenterImgView', event, this.imgGlobalStatus.activeImg);
  }

  protected mousedownImgView = (event: MouseEvent) => {
    // console.log('mousedownImgView', event, this.imgGlobalStatus.activeImg, event.button);
    event.stopPropagation();
    event.preventDefault();
    const activeImg = this.getAndUpdateActiveImg(event);
    if (!activeImg) return;
    if (0 == event.button) { // left click
      this.setClickTimer(activeImg);
      this.setActiveImgZIndex(activeImg);
      this.imgGlobalStatus.dragging = true;
      // 鼠标相对于图片的位置
      activeImg.moveX = activeImg.imgViewEl.offsetLeft - event.clientX;
      activeImg.moveY = activeImg.imgViewEl.offsetTop - event.clientY;
      // 鼠标按下时持续触发/移动事件
      activeImg.imgViewEl.onmousemove = this.mousemoveImgView;
    }
  }

  /**
   * move the image by mouse or keyboard
   * @param event
   * @param offsetSize
   */
  protected mousemoveImgView = (event: MouseEvent, offsetSize?: OffsetSizeIto) => {
    // console.log('mousemoveImgView', event, this.imgGlobalStatus.activeImg);
    const activeImg = this.imgGlobalStatus.activeImg;
    if (!activeImg) return;
    if (event) {
      if (!this.imgGlobalStatus.dragging) return;
      // drag via mouse cursor (Both Mode)
      activeImg.left = event.clientX + activeImg.moveX;
      activeImg.top = event.clientY + activeImg.moveY;
    } else if (offsetSize) {
      // move by arrow keys (Normal Mode)
      activeImg.left += offsetSize.offsetX;
      activeImg.top += offsetSize.offsetY;
    } else {
      return;
    }
    // move the image
    activeImg.imgViewEl.style.setProperty('margin-left', activeImg.left + 'px', 'important');
    activeImg.imgViewEl.style.setProperty('margin-top', activeImg.top + 'px', 'important');
  }

  protected mouseupImgView = (event: MouseEvent) => {
    // console.log('mouseupImgView', event, this.imgGlobalStatus.activeImg);
    this.imgGlobalStatus.dragging = false;
    event.preventDefault();
    event.stopPropagation();
    const activeImg = this.imgGlobalStatus.activeImg;
    if (activeImg) {
      activeImg.imgViewEl.onmousemove = null;
      if (2 == event.button) { // right click
        this.menuView?.show(event, activeImg);
      }
    }
  }

  protected mouseleaveImgView = (event: MouseEvent) => {
    // console.log('mouseleaveImgView', event, this.imgGlobalStatus.activeImg, '>>> set null');
    this.imgGlobalStatus.dragging = false;
    this.resetClickTimer();
    event.preventDefault();
    event.stopPropagation();
    const activeImg = this.imgGlobalStatus.activeImg;
    if (activeImg) {
      activeImg.imgViewEl.onmousemove = null;
      this.setActiveImgForMouseEvent(null); // for pin mode
    }
  }

  private setClickTimer = (activeImg?: ImgCto) => {
    ++this.imgGlobalStatus.clickCount;
    clearTimeout(this.imgGlobalStatus.clickTimer);
    this.imgGlobalStatus.clickTimer = setTimeout(() => {
      const clickCount = this.imgGlobalStatus.clickCount;
      this.resetClickTimer();
      if (2 === clickCount) { // double click
        if (!activeImg) activeImg = this.imgGlobalStatus.activeImg;
        // console.log('mousedownImgView: double click...', activeImg.index);
        this.clickImgToolbar(null, this.plugin.settings.doubleClickToolbar, activeImg);
      }
    }, 200);
  }

  private resetClickTimer = () => {
    this.imgGlobalStatus.clickTimer = null;
    this.imgGlobalStatus.clickCount = 0;
  }

  private getAndUpdateActiveImg = (event: MouseEvent | KeyboardEvent): ImgCto => {
    const targetEl = (<HTMLImageElement>event.target);
    let index: string;
    if (!targetEl || !(index = targetEl.dataset.index)) return;
    const activeImg: ImgCto = this.imgInfo.imgList[parseInt(index)];
    if (activeImg && (!this.imgGlobalStatus.activeImg || activeImg.index !== this.imgGlobalStatus.activeImg.index)) {
      this.setActiveImgForMouseEvent(activeImg); // update activeImg
    }
    // console.log('getAndUpdateActiveImg: ', activeImg)
    return activeImg;
  }

  protected mousewheelViewContainer = (event: WheelEvent) => {
    // event.preventDefault();
    event.stopPropagation();
    // @ts-ignore
    this.zoomAndRender(0 < event.wheelDelta ? 0.1 : -0.1, event);
  }

  protected zoomAndRender = (ratio: number, event?: WheelEvent, actualSize?: boolean, activeImg?: ImgCto) => {
    if (!activeImg) {
      activeImg = this.imgGlobalStatus.activeImg;
    }
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
    this.renderImgTip(activeImg);
    activeImgViewEl.setAttribute('width', zoomData.curWidth + 'px');
    activeImgViewEl.style.setProperty('margin-top', zoomData.top + 'px', 'important');
    activeImgViewEl.style.setProperty('margin-left', zoomData.left + 'px', 'important');
  }

  public clickImgToolbar = (event: MouseEvent, targetElClass?: string, activeImg?: ImgCto): void => {
    if (!targetElClass && !activeImg) {
      if (!event) return;
      // comes from clicking toolbar
      targetElClass = (<HTMLElement>event.target).className;
      activeImg = this.imgGlobalStatus.activeImg;
    }
    switch (targetElClass) {
      case 'toolbar_zoom_to_100':
        this.zoomAndRender(null, null, true, activeImg);
        break;
      case 'toolbar_zoom_in':
        this.zoomAndRender(0.1);
        break;
      case 'toolbar_zoom_out':
        this.zoomAndRender(-0.1);
        break;
      case 'toolbar_full_screen':
        this.showPlayerImg(activeImg);
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
      case 'toolbar_close':
        this.closeContainerView(event, activeImg);
        break
      default:
        break;
    }
  }
  //endregion

}
