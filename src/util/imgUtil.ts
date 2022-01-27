import { Notice } from 'obsidian';
import { t } from 'src/lang/helpers';
import { ImgInfoIto } from 'src/to/ImgInfoIto';
import { OffsetSizeIto } from 'src/to/OffsetSizeIto';
import { ZOOM_FACTOR } from '../conf/constants'


export const calculateImgZoomSize = (realImg: HTMLImageElement, imgInfo: ImgInfoIto): ImgInfoIto => {
    const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const windowHeight = document.documentElement.clientHeight || document.body.clientHeight;
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
    tempHeight = tempWidth * realImg.height / realImg.width;
    // cache image info: curWidth, curHeight, realWidth, realHeight, left, top
    imgInfo.left = (windowWidth - tempWidth) / 2;
    imgInfo.top = (windowHeight - tempHeight) / 2;
    imgInfo.curWidth = tempWidth;
    imgInfo.curHeight = tempHeight;
    imgInfo.realWidth = realImg.width;
    imgInfo.realHeight = realImg.height;

    /* console.log('calculateImgZoomSize', 'realImg: ' + realImg.width + ',' + realImg.height,
        'tempSize: ' + tempWidth + ',' + tempHeight,
        'windowZoomSize: ' + windowZoomWidth + ',' + windowZoomHeight,
        'windowSize: ' + windowWidth + ',' + windowHeight); */
    return imgInfo;
}

/**
 * zoom an image 
 * @param ratio 
 * @param imgInfo 
 * @returns 
 */
export const zoom = (ratio: number, targetImgInfo: ImgInfoIto, offsetSize?: OffsetSizeIto): ImgInfoIto => {
    const zoomInFlag = ratio > 0;
    ratio = zoomInFlag ? 1 + ratio : 1 / (1 - ratio);
    const curWidth = targetImgInfo.curWidth;
    // const curHeight = TARGET_IMG_INFO.curHeight;
    let zoomRatio = curWidth * ratio / targetImgInfo.realWidth;
    const newWidth = targetImgInfo.realWidth * zoomRatio;
    const newHeight = targetImgInfo.realHeight * zoomRatio;
    const left = targetImgInfo.left + (offsetSize.offsetX - offsetSize.offsetX * ratio);
    const top = targetImgInfo.top + (offsetSize.offsetY - offsetSize.offsetY * ratio);
    // cache image info: curWidth, curHeight, left, top
    targetImgInfo.curWidth = newWidth;
    targetImgInfo.curHeight = newHeight;
    targetImgInfo.left = left;
    targetImgInfo.top = top;
    // return { newWidth, left, top };
    return targetImgInfo;
}

export const transform = (targetImgInfo: ImgInfoIto) => {
    let transform = 'rotate(' + targetImgInfo.rotate + 'deg)';
    if (targetImgInfo.scaleX) {
        transform += ' scaleX(-1)'
    }
    if (targetImgInfo.scaleY) {
        transform += ' scaleY(-1)'
    }
    targetImgInfo.imgViewEl.style.setProperty('transform', transform);
}

export const rotate = (degree: number, targetImgInfo: ImgInfoIto) => {
    targetImgInfo.imgViewEl.style.setProperty('transform', 'rotate(' + (targetImgInfo.rotate += degree) + 'deg)');
}

export const invertImgColor = (imgEle: HTMLImageElement, open: boolean) => {
    if (open) {
        imgEle.style.setProperty('filter', 'invert(1) hue-rotate(180deg)');
        imgEle.style.setProperty('mix-blend-mode', 'screen');
    } else {
        imgEle.style.setProperty('filter', 'none');
        imgEle.style.setProperty('mix-blend-mode', 'normal');
    }
    // open ? imgEle.addClass('image-toolkit-img-invert') : imgEle.removeClass('image-toolkit-img-invert');
}

export function copyText(text: string) {
    // console.log('text:', text);

    navigator.clipboard.writeText(text)
        .then(() => {
            //console.log('copyText:', copyText);
        })
        .catch(err => {
            console.error('copy text error', err);
        });
}

export function copyImage(imgEle: HTMLImageElement, width: number, height: number) {
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imgEle.src;
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
    image.onerror = () => {
        new Notice(t("COPY_IMAGE_ERROR"));
    }
}
