import { MarkdownView } from "obsidian";
import ImageToolkitPlugin from "src/main";
import { GalleryImg, md5Img, parseActiveViewData } from "src/util/markdowParse";
import { ContainerView } from "./containerView";


let galleryNavbarEl: HTMLDivElement = null;
let galleryListEl: HTMLElement = null;

let galleryIsMousingDown: boolean = false;
let galleryMouseDownClientX: number = 0;
let galleryTranslateX: number = 0;


export const renderGalleryImg = (containerView: ContainerView, plugin: ImageToolkitPlugin): HTMLDivElement => {
    // get all of images on the current editor
    const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || 'preview' != activeView.getMode() || 0 < document.getElementsByClassName('modal-container').length) {
        if (galleryNavbarEl) galleryNavbarEl.hidden = true;
        if (galleryListEl) galleryListEl.innerHTML = '';
        return;
    }

    // <div class="gallery-navbar">
    if (!galleryNavbarEl) {
        // imgInfo.imgFooterEl.append(galleryNavbarEl = createDiv());
        galleryNavbarEl = createDiv()
        galleryNavbarEl.addClass('gallery-navbar');

        galleryNavbarEl.onmousedown = mouseDownGallery;
        galleryNavbarEl.onmousemove = mouseMoveGallery;
        // galleryNavbarEl.onmouseup = mouseUpGallery;
        galleryNavbarEl.onmouseup = (event: MouseEvent) => {
            // console.log('mouse Up Gallery>>>', event.target);
            event.preventDefault();
            event.stopPropagation();
            galleryIsMousingDown = false;
            clickGalleryImg(event, containerView);
        }
        galleryNavbarEl.onmouseleave = mouseLeaveGallery;
    }
    if (!galleryListEl) {
        galleryNavbarEl.append(galleryListEl = createEl('ul')); // <ul class="gallery-list">
        galleryListEl.addClass('gallery-list');
    }
    galleryNavbarEl.hidden = false;
    galleryMouseDownClientX = 0;
    galleryTranslateX = 0;
    galleryListEl.style.transform = 'translateX(0px)';
    // remove all childs of gallery-list
    galleryListEl.innerHTML = '';

    // const cm = activeView.sourceMode?.cmEditor;
    // const imgList: Array<GalleryImg> = parseMarkDown(plugin, cm, activeView.file.path);
    const imgList: Array<GalleryImg> = parseActiveViewData(plugin, activeView.data?.split('\n'), activeView.file.path);
    const imgContextHash: string[] = getTargetImgContextHash(containerView.targetImgEl, activeView.containerEl, plugin.imgSelector);
    let liEl: HTMLLIElement, imgEl, liElActive: HTMLLIElement;
    let targetImageIdx = -1;
    let isAddGalleryActive: boolean = false;
    let prevHash: string, nextHash: string;
    for (let i = 0, len = imgList.length; i < len; i++) {
        const img = imgList[i];
        // <li> <img src='' alt=''> </li>
        galleryListEl.append(liEl = createEl('li'));
        liEl.append(imgEl = createEl('img'));
        imgEl.setAttr('alt', img.alt);
        imgEl.setAttr('src', img.src);
        // find the target image (which image is just clicked)
        if (!imgContextHash || isAddGalleryActive) continue;
        if (imgContextHash[1] == img.hash) {
            if (0 > targetImageIdx) {
                targetImageIdx = i;
                liElActive = liEl;
            }
            if (0 == i) {
                prevHash = null;
                nextHash = 1 < len ? imgList[i + 1].hash : null;
            } else if (len - 1 == i) {
                prevHash = imgList[i - 1].hash;
                nextHash = null;
            } else {
                prevHash = imgList[i - 1].hash;
                nextHash = imgList[i + 1].hash;
            }
            if (imgContextHash[0] == prevHash && imgContextHash[2] == nextHash) {
                isAddGalleryActive = true;
                liElActive = liEl;
            }
        }
    }
    if (0 <= targetImageIdx) {
        liElActive?.addClass('gallery-active');

        galleryTranslateX = (document.documentElement.clientWidth || document.body.clientWidth) / 2.5 - targetImageIdx * 52;
        galleryListEl.style.transform = 'translateX(' + galleryTranslateX + 'px)';
    }
}

const getTargetImgContextHash = (targetImgEl: HTMLImageElement, containerEl: HTMLElement, imageSelector: string): string[] => {
    let imgEl: HTMLImageElement;
    let targetImgHash: string = null;
    let targetIdx = -1;
    const imgs: NodeListOf<HTMLImageElement> = containerEl.querySelectorAll(imageSelector);
    // console.log('IMAGE_SELECTOR>>', imageSelector, imgs);
    const len = imgs.length;
    for (let i = 0; i < len; i++) {
        if (imgEl = imgs[i]) {
            if ('1' == imgEl.getAttribute('data-oit-target')) {
                targetIdx = i;
                targetImgHash = md5Img(imgEl.alt, imgEl.src);
                break;
            }
        }
    }
    if (0 > targetIdx) targetImgHash = md5Img(targetImgEl.alt, targetImgEl.src);
    let prevHash: string, nextHash: string;
    if (0 == targetIdx) {
        prevHash = null;
        nextHash = 1 < len ? md5Img(imgs[1].alt, imgs[1].src) : null;
    } else if (len - 1 == targetIdx) {
        prevHash = md5Img(imgs[targetIdx - 1].alt, imgs[targetIdx - 1].src);
        nextHash = null;
    } else {
        prevHash = md5Img(imgs[targetIdx - 1].alt, imgs[targetIdx - 1].src);
        nextHash = md5Img(imgs[targetIdx + 1].alt, imgs[targetIdx + 1].src);
    }
    return [prevHash, targetImgHash, nextHash];
}

const clickGalleryImg = (event: MouseEvent, containerView: ContainerView) => {
    const targetEl = (<HTMLImageElement>event.target);
    if (!targetEl || 'IMG' !== targetEl.tagName) return;

    containerView.initDefaultData(targetEl.style);
    containerView.refreshImg(targetEl.src, targetEl.alt ? targetEl.alt : ' ');

    // remove the li's class gallery-active
    if (galleryListEl) {
        const liElList: HTMLCollectionOf<HTMLLIElement> = galleryListEl.getElementsByTagName('li');
        let liEl: HTMLLIElement;
        for (let i = 0, len = liElList.length; i < len; i++) {
            if ((liEl = liElList[i]) && liEl.hasClass('gallery-active')) {
                liEl.removeClass('gallery-active');
            }
        }
    }

    // add class 'gallery-active' for the current clicked image in the gallery-navbar
    const parentliEl = targetEl.parentElement;
    if (parentliEl && 'LI' === parentliEl.tagName) {
        parentliEl.addClass('gallery-active');
    }
}

const mouseDownGallery = (event: MouseEvent) => {
    // console.log('mouse Down Gallery>>>');
    event.preventDefault();
    event.stopPropagation();
    galleryIsMousingDown = true;
    galleryMouseDownClientX = event.clientX;
}

const mouseMoveGallery = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!galleryIsMousingDown) return;
    let moveDistance = event.clientX - galleryMouseDownClientX;
    if (4 > Math.abs(moveDistance)) return;
    galleryMouseDownClientX = event.clientX;
    galleryTranslateX += moveDistance;

    const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
    const imgLiWidth = (galleryListEl.childElementCount - 1) * 52;
    // console.log('move...', 'windowWidth=' + windowWidth, 'galleryTranslateX=' + galleryTranslateX, 'li count=' + imgInfo.galleryList.childElementCount);
    if (galleryTranslateX + 50 >= windowWidth) galleryTranslateX = windowWidth - 50;
    if (0 > galleryTranslateX + imgLiWidth) galleryTranslateX = -imgLiWidth;

    galleryListEl.style.transform = 'translateX(' + galleryTranslateX + 'px)';
}

const mouseUpGallery = (event: MouseEvent) => {
    // console.log('mouse Up Gallery>>>', event.target);
    event.preventDefault();
    event.stopPropagation();
    galleryIsMousingDown = false;
}

const mouseLeaveGallery = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    galleryIsMousingDown = false;
}
