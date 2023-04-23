/**
 * ts class object: image operating status
 */
export class ImgStatusCto {
  // true: the popup layer of viewing image is displayed
  popup: boolean = false;
  // whether the image is being dragged
  dragging: boolean = false;

  // keybord pressing status
  arrowUp: boolean = false;
  arrowDown: boolean = false;
  arrowLeft: boolean = false;
  arrowRight: boolean = false;

  fullScreen: boolean = false;

  // being dragged
  activeImg: ImgCto;
  activeImgZIndex: number = 0;

  clickCount: number = 0;
  clickTimer: NodeJS.Timeout;
}

/**
 * ts interface object: image information
 */
export interface ImgInfoIto {
  oitContainerViewEl: HTMLDivElement; // 'oit-main-container-view', 'oit-pin-container-view'
  imgViewEl: HTMLImageElement;
  imgTitleEl: HTMLDivElement;
  imgTipEl: HTMLDivElement;
  imgTipTimeout?: NodeJS.Timeout;
  imgFooterEl: HTMLElement;
  imgPlayerEl: HTMLDivElement; // 'img-player'
  imgPlayerImgViewEl: HTMLImageElement; // 'img-fullscreen'

  curWidth: number;
  curHeight: number;
  realWidth: number;
  realHeight: number;
  left: number;
  top: number;
  moveX: number;
  moveY: number;
  rotate: number;

  invertColor: boolean;
  scaleX: boolean;
  scaleY: boolean;

  // whether the image is being previewed in full-screen mode
  fullScreen: boolean;
}

/**
 * ts class object: image information
 */
export class ImgInfoCto {
  oitContainerViewEl: HTMLDivElement; // 'oit-main-container-view', 'oit-pin-container-view'
  imgContainerEl: HTMLDivElement; // 'img-container': including <img class='img-view' src='' alt=''>

  imgTitleEl: HTMLDivElement; // 'img-title'
  imgTitleNameEl: HTMLSpanElement; // 'img-title-name'
  imgTitleIndexEl: HTMLSpanElement; // 'img-title-index'

  imgTipEl: HTMLDivElement; // 'img-tip': show the zoom ratio
  imgTipTimeout?: NodeJS.Timeout; // timer: control the display time of 'img-tip'
  imgFooterEl: HTMLElement; // 'img-footer': including 'img-title', 'img-toolbar', 'gallery-navbar'
  imgPlayerEl: HTMLDivElement; // 'img-player': including <img class="img-fullscreen" src='' alt=''>
  imgPlayerImgViewEl: HTMLImageElement; // 'img-fullscreen'

  imgList: Array<ImgCto> = new Array<ImgCto>();

  public getPopupImgNum = (): number => {
    let num: number = 0;
    for (const imgCto of this.imgList) {
      if (imgCto.popup) num++;
    }
    return num;
  }
}

export class ImgCto {
  index: number;
  mtime: number; // modified time
  popup: boolean = false;

  targetOriginalImgEl: HTMLImageElement;

  imgViewEl: HTMLImageElement; // 'img-view'
  refreshImgInterval: NodeJS.Timeout;
  zIndex: number = 0;

  curWidth: number = 0; // image's current width
  curHeight: number = 0;
  realWidth: number = 0; // image's real width
  realHeight: number = 0;
  left: number = 0; // margin-left
  top: number = 0; // margin-top
  moveX: number = 0; // 鼠标相对于图片的位置
  moveY: number = 0;

  rotate: number = 0; // rotateDeg
  invertColor: boolean = false;
  scaleX: boolean = false; // scaleX(-1)
  scaleY: boolean = false; // scaleY(-1)
  fullScreen: boolean = false; // whether the image is being previewed in full-screen mode

  defaultImgStyle = {
    transform: 'none',
    filter: 'none',
    mixBlendMode: 'normal',

    borderWidth: '',
    borderStyle: '',
    borderColor: ''
  }

  constructor();
  constructor(index: number, mtime: number, imgViewEl: HTMLImageElement);
  constructor(index?: number, mtime?: number, imgViewEl?: HTMLImageElement) {
    this.index = index;
    this.mtime = mtime;
    this.imgViewEl = imgViewEl;
  }
}

