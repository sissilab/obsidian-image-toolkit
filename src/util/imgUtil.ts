import { Notice } from 'obsidian';
import { t } from 'src/lang/helpers';
import da from 'src/lang/locale/da';
import { ImgInfoIto } from 'src/to/ImgInfoIto';
import { OffsetSizeIto } from 'src/to/OffsetSizeIto';
import { IMG_DEFAULT_BACKGROUND_COLOR, ZOOM_FACTOR } from '../conf/constants'


export const calculateImgZoomSize = (realImg: HTMLImageElement, imgInfo: ImgInfoIto): ImgInfoIto => {
    const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const windowHeight = (document.documentElement.clientHeight || document.body.clientHeight) - 100;
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
 * @param targetImgInfo 
 * @param offsetSize
 * @param actualSize
 * @returns 
 */
export const zoom = (ratio: number, targetImgInfo: ImgInfoIto, offsetSize?: OffsetSizeIto, actualSize?: boolean): ImgInfoIto => {
    let zoomRatio: number;
    if (!actualSize) {
        const zoomInFlag = ratio > 0;
        ratio = zoomInFlag ? 1 + ratio : 1 / (1 - ratio);
        zoomRatio = targetImgInfo.curWidth * ratio / targetImgInfo.realWidth;
    }

    // Snap to 100% zoom when we pass over it
    const curRatio = targetImgInfo.curWidth / targetImgInfo.realWidth;
    if (actualSize || (curRatio < 1 && zoomRatio > 1) || (curRatio > 1 && zoomRatio < 1)) {
        // set zoom ratio to 100%
        zoomRatio = 1;
        // reduce snap offset ratio accordingly
        ratio = 1 / curRatio;
    }

    const newWidth = targetImgInfo.realWidth * zoomRatio;
    const newHeight = targetImgInfo.realHeight * zoomRatio;
    const left = targetImgInfo.left + offsetSize.offsetX * (1 - ratio);
    const top = targetImgInfo.top + offsetSize.offsetY * (1 - ratio);
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
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        try {
            canvas.toBlob(async (blob: any) => {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                    .then(() => {
                        new Notice(t("COPY_IMAGE_SUCCESS"));
                    }, () => {
                        new Notice(t("COPY_IMAGE_ERROR"));
                    });
            });
        } catch (error) {
            new Notice(t("COPY_IMAGE_ERROR"));
            console.error(error);
        }
    };
    image.onerror = () => {
        new Notice(t("COPY_IMAGE_ERROR"));
    }
}
