
/**
 * typescript object of interface for defining operating status of the image
 */
export interface ImgStatusIto {
    // true: the popup layer of viewing image is displayed
    popup: boolean;
    // whether the image is being dragged
    dragging: boolean;

    // keybord pressing status
    arrowUp: boolean;
    arrowDown: boolean;
    arrowLeft: boolean;
    arrowRight: boolean;
}

/**
 * typescript object of interface for defining image's information
 */
export interface ImgInfoIto {
    oitContainerViewEl: HTMLDivElement;
    imgViewEl: HTMLImageElement;
    imgTitleEl: HTMLDivElement;
    imgTipEl: HTMLDivElement;
    imgTipTimeout?: NodeJS.Timeout;
    imgFooterEl: HTMLElement;
    imgPlayerEl: HTMLDivElement;
    imgPlayerImgViewEl: HTMLImageElement;

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
 * typescript object of interface for defining image's settings
 */
export interface ImgSettingIto {
    // viewImageGlobal: boolean; // @Deprecated
    viewImageEditor: boolean;
    viewImageInCPB: boolean;
    viewImageWithALink: boolean;
    viewImageOther: boolean;

    pinMode: boolean;

    imageMoveSpeed: number;
    imgTipToggle: boolean;
    imgFullScreenMode: string;
    imgViewBackgroundColor: string;

    imageBorderToggle: boolean;
    imageBorderWidth: string;
    imageBorderStyle: string;
    imageBorderColor: string;

    galleryNavbarToggle: boolean;
    galleryNavbarDefaultColor: string;
    galleryNavbarHoverColor: string;
    galleryImgBorderActive: boolean;
    galleryImgBorderActiveColor: string;

    // hotkeys conf
    moveTheImageHotkey: string;
    switchTheImageHotkey: string;
}
