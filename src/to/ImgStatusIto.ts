
/**
 * typescript object of interface for defining operating status of the image
 */
export interface ImgStatusIto {
    // true: the popup layer of viewing image is displayed
    popup: boolean;
    // whether the image is being dragged
    dragging: boolean;

    // ARROW_PRESS_STATUS
    arrowUp: boolean;
    arrowDown: boolean;
    arrowLeft: boolean;
    arrowRight: boolean;
}
