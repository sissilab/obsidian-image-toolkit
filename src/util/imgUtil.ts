import {Notice, requestUrl} from 'obsidian';
import {t} from 'src/lang/helpers';
import {IMG_VIEW_MIN, ZOOM_FACTOR} from '../conf/constants'
import {ImgCto, ImgInfoIto} from "../model/imgTo";
import {OffsetSizeIto} from "../model/commonTo";

/**
 * Image utility class
 */
export class ImgUtil {

  public static calculateImgZoomSize = (realImg: HTMLImageElement, imgCto: ImgCto, windowWidth: number, windowHeight: number): ImgCto => {
    if (!windowWidth) {
      windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
    }
    if (!windowHeight) {
      windowHeight = (document.documentElement.clientHeight || document.body.clientHeight) - 100;
    }
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
    imgCto.left = (windowWidth - tempWidth) / 2;
    imgCto.top = (windowHeight - tempHeight) / 2;
    imgCto.curWidth = tempWidth;
    imgCto.curHeight = tempHeight;
    imgCto.realWidth = realImg.width;
    imgCto.realHeight = realImg.height;

    /* console.log('calculateImgZoomSize', 'realImg: ' + realImg.width + ',' + realImg.height,
        'tempSize: ' + tempWidth + ',' + tempHeight,
        'windowZoomSize: ' + windowZoomWidth + ',' + windowZoomHeight,
        'windowSize: ' + windowWidth + ',' + windowHeight); */
    return imgCto;
  }

  /**
   * zoom an image
   * @param ratio
   * @param targetImgInfo
   * @param offsetSize
   * @param actualSize
   * @returns
   */
  public static zoom = (ratio: number, targetImgInfo: ImgCto, offsetSize?: OffsetSizeIto, actualSize?: boolean): ImgCto => {
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

    let newWidth = targetImgInfo.realWidth * zoomRatio;
    let newHeight = targetImgInfo.realHeight * zoomRatio;
    if (IMG_VIEW_MIN >= newWidth || IMG_VIEW_MIN >= newHeight) {
      // set minimum width or height
      if (IMG_VIEW_MIN >= newWidth) {
        newWidth = IMG_VIEW_MIN;
        newHeight = (newWidth * targetImgInfo.realHeight) / targetImgInfo.realWidth;
      } else {
        newHeight = IMG_VIEW_MIN;
        newWidth = (newHeight * targetImgInfo.realWidth) / targetImgInfo.realHeight;
      }
      ratio = 1;
    }
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

  public static transform = (targetImgInfo: ImgCto) => {
    let transform = 'rotate(' + targetImgInfo.rotate + 'deg)';
    if (targetImgInfo.scaleX) {
      transform += ' scaleX(-1)'
    }
    if (targetImgInfo.scaleY) {
      transform += ' scaleY(-1)'
    }
    targetImgInfo.imgViewEl.style.setProperty('transform', transform);
  }

  public static rotate = (degree: number, targetImgInfo: ImgInfoIto) => {
    targetImgInfo.imgViewEl.style.setProperty('transform', 'rotate(' + (targetImgInfo.rotate += degree) + 'deg)');
  }

  public static invertImgColor = (imgEle: HTMLImageElement, open: boolean) => {
    if (open) {
      imgEle.style.setProperty('filter', 'invert(1) hue-rotate(180deg)');
      imgEle.style.setProperty('mix-blend-mode', 'screen');
    } else {
      imgEle.style.setProperty('filter', 'none');
      imgEle.style.setProperty('mix-blend-mode', 'normal');
    }
    // open ? imgEle.addClass('image-toolkit-img-invert') : imgEle.removeClass('image-toolkit-img-invert');
  }

  public static copyText(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        //console.log('copyText:', copyText);
      })
      .catch(err => {
        console.error('copy text error', err);
      });
  }

  public static async copyImage(imgEle: HTMLImageElement, width: number, height: number) {
    try {
      const src = imgEle?.src;
      if (!src) {
        new Notice(t("COPY_IMAGE_ERROR"));
        return;
      }
      let srcBlob: Blob = null;
      if (/^https?:\/\//i.test(src) && typeof requestUrl === 'function') {
        const resp = await requestUrl({ url: src });
        const mime = (resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || 'image/png';
        srcBlob = new Blob([resp.arrayBuffer], { type: mime });
      } else if (/^app:\/\//i.test(src)) {
        try {
          const res = await fetch(src);
          if (res.ok) {
            srcBlob = await res.blob();
          }
        } catch (_e) {
          // Fallback to Node fs on desktop if fetch fails
        }
        if (!srcBlob) {
          const fs = require('fs');
          const urlMod = require('url');
          const cleanUrl = src.split('?')[0].replace(/^app:\/\/[^/]+\//i, 'file:///');
          const filePath = urlMod.fileURLToPath(cleanUrl);
          const buf = await fs.promises.readFile(filePath);
          const isSvg = /\.svg$/i.test(filePath);
          srcBlob = new Blob([buf], { type: isSvg ? 'image/svg+xml' : 'application/octet-stream' });
        }
      } else {
        const res = await fetch(src);
        srcBlob = await res.blob();
      }
      const objectUrl = URL.createObjectURL(srcBlob);
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth || image.width || width || 300;
          canvas.height = image.naturalHeight || image.height || height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(async (pngBlob: Blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!pngBlob) {
              new Notice(t("COPY_IMAGE_ERROR"));
              return;
            }
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
              new Notice(t("COPY_IMAGE_SUCCESS"));
            } catch (err) {
              console.error(err);
              new Notice(t("COPY_IMAGE_ERROR"));
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          console.error(error);
          new Notice(t("COPY_IMAGE_ERROR"));
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        new Notice(t("COPY_IMAGE_ERROR"));
      };
      image.src = objectUrl;
    } catch (error) {
      console.error(error);
      new Notice(t("COPY_IMAGE_ERROR"));
    }
  }

}
