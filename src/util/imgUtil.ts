import { IMG_INFO, renderImgTip } from 'src/ui/viewContainer';
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
    let top = (windowHeight - tempHeight) / 2 + 'px';
    let left = (windowWidth - tempWidth) / 2 + 'px';
    // cache image info
    TARGET_IMG_INFO.curWidth = tempWidth;
    TARGET_IMG_INFO.curHeight = tempHeight;
    TARGET_IMG_INFO.realWidth = realImg.width;
    TARGET_IMG_INFO.realHeight = realImg.height;
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
export const zoom = (ratio: number, TARGET_IMG_INFO: IMG_INFO): number => {
    ratio = ratio > 0 ? 1 + ratio : 1 / (1 - ratio);
    let zoomRatio = TARGET_IMG_INFO.curWidth * ratio / TARGET_IMG_INFO.realWidth;
    const newWidth = TARGET_IMG_INFO.realWidth * zoomRatio;
    const newHeight = TARGET_IMG_INFO.curHeight * zoomRatio;
    // cache image info
    TARGET_IMG_INFO.curWidth = newWidth;
    TARGET_IMG_INFO.curHeight = newHeight;
    // render tip
    renderImgTip();
    return newWidth;
}

export const rotate = (degree: number, TARGET_IMG_INFO: IMG_INFO) => {
    TARGET_IMG_INFO.imgViewEl.style.setProperty('transform', 'rotate(' + (TARGET_IMG_INFO.rotate += degree) + 'deg)');
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

export function copyImage(imgSrc: string) {
    let image = new Image();
    image.src = imgSrc;
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        // const imgBase64 = canvas.toDataURL("image/png");
        // console.log('imgBase64', imgBase64);
        canvas.toBlob((blob: any) => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]);
            console.log('copy end!');
        });
    };
}
