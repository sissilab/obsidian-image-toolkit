
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
    galleryNavbar: HTMLDivElement;
    galleryList: HTMLElement;

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
