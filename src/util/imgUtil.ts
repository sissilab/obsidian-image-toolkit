import { Notice } from 'obsidian';
import { t } from 'src/lang/helpers';
import { IMG_INFO, OFFSET_SIZE } from 'src/ui/viewContainer';
import { ZOOM_FACTOR } from '../conf/constants'


/**
 * calculate zoom size of the target image  
 * @param imgSrc 
 * @returns 
 */
export function calculateImgZoomSize(realImg: HTMLImageElement, TARGET_IMG_INFO: IMG_INFO): object {
    // if (!imgSrc) {
    //     return;
    // }
    // 当前窗口宽高（可视宽高）
    const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const windowHeight = document.documentElement.clientHeight || document.body.clientHeight;
    // 当前窗口缩放后的宽高
    const windowZoomWidth = windowWidth * ZOOM_FACTOR;
    const windowZoomHeight = windowHeight * ZOOM_FACTOR;

    let tempWidth = realImg.width, tempHeight = realImg.height;
    if (realImg.height > windowZoomHeight) {
        tempHeight = windowZoomHeight;
        if ((tempWidth = tempHeight / realImg.height * realImg.width) > windowZoomWidth) {
            tempWidth = windowZoomWidth;
        }
    } else if (realImg.width > windowZoomWidth) {
        tempWidth = windowZoomWidth;
        tempHeight = tempWidth / realImg.width * realImg.height;
    }
    let width = tempWidth + 'px';
    let height = tempHeight + 'px';
    // cache image info: curWidth, curHeight, realWidth, realHeight, left, top
    TARGET_IMG_INFO.left = (windowWidth - tempWidth) / 2;
    TARGET_IMG_INFO.top = (windowHeight - tempHeight) / 2;
    TARGET_IMG_INFO.curWidth = tempWidth;
    TARGET_IMG_INFO.curHeight = tempHeight;
    TARGET_IMG_INFO.realWidth = realImg.width;
    TARGET_IMG_INFO.realHeight = realImg.height;
    const left = TARGET_IMG_INFO.left + 'px';
    const top = TARGET_IMG_INFO.top + 'px';

    /* console.log('calculateImgZoomSize', 'realImg: ' + realImg.width + ',' + realImg.height,
        'tempSize: ' + tempWidth + ',' + tempHeight,
        'windowZoomSize: ' + windowZoomWidth + ',' + windowZoomHeight,
        'windowSize: ' + windowWidth + ',' + windowHeight); */
    return { width, height, top, left };
}


/**
 * zoom an image 
 * @param ratio 
 * @param imgInfo 
 * @returns 
 */
export const zoom = (ratio: number, TARGET_IMG_INFO: IMG_INFO, offsetSize?: OFFSET_SIZE): any => {
    const zoomInFlag = ratio > 0;
    ratio = zoomInFlag ? 1 + ratio : 1 / (1 - ratio);
    const curWidth = TARGET_IMG_INFO.curWidth;
    const curHeight = TARGET_IMG_INFO.curHeight;
    let zoomRatio = curWidth * ratio / TARGET_IMG_INFO.realWidth;
    const newWidth = TARGET_IMG_INFO.realWidth * zoomRatio;
    const newHeight = curHeight * zoomRatio;
    const left = TARGET_IMG_INFO.left + (offsetSize.offsetX - offsetSize.offsetX * ratio);
    const top = TARGET_IMG_INFO.top + (offsetSize.offsetY - offsetSize.offsetY * ratio);
    // cache image info: curWidth, curHeight, left, top
    TARGET_IMG_INFO.curWidth = newWidth;
    TARGET_IMG_INFO.curHeight = newHeight;
    TARGET_IMG_INFO.left = left;
    TARGET_IMG_INFO.top = top;
    return { newWidth, left, top };
}

export const rotate = (degree: number, TARGET_IMG_INFO: IMG_INFO) => {
    TARGET_IMG_INFO.imgViewEl.style.setProperty('transform', 'rotate(' + (TARGET_IMG_INFO.rotate += degree) + 'deg)');
}

export const invertImgColor = (imgEle: HTMLImageElement, open: boolean) => {
    open ? imgEle.addClass('image-toolkit-img-invert') : imgEle.removeClass('image-toolkit-img-invert');
}

export function copyText(text: string) {
    console.log('text:', text);

    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('copyText:', copyText);
        })
        .catch(err => {
            console.error('copy text error', err);
        });
}

export function copyImage(imgEle: HTMLImageElement, width: number, height: number) {
    let image = new Image();
    image.src = imgEle.src;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((blob: any) => {
            // @ts-ignore
            const item = new ClipboardItem({ "image/png": blob });
            // @ts-ignore
            navigator.clipboard.write([item]);
            new Notice(t("COPY_IMAGE_SUCCESS"));
        });
    };
}
