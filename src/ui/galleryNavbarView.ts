import { MarkdownView } from "obsidian";
import ImageToolkitPlugin from "src/main";
import { GalleryImg, md5Img, parseActiveViewData } from "src/util/markdowParse";
import { ContainerView } from "./containerView";

export class GalleryNavbarView {
    private readonly plugin: ImageToolkitPlugin;
    private readonly containerView: ContainerView;

    private galleryNavbarEl: HTMLDivElement = null;
    private galleryListEl: HTMLElement = null;

    private galleryIsMousingDown: boolean = false;
    private galleryMouseDownClientX: number = 0;
    private galleryTranslateX: number = 0;

    constructor(containerView: ContainerView, plugin: ImageToolkitPlugin) {
        this.containerView = containerView;
        this.plugin = plugin;
    }

    public renderGalleryImg = async (imgFooterEl: HTMLElement) => {
        debugger
        // get all of images on the current editor
        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView || 'preview' != activeView.getMode() || 0 < document.getElementsByClassName('modal-container').length) {
            // only support preview mode; 
            if (this.galleryNavbarEl) this.galleryNavbarEl.hidden = true;
            if (this.galleryListEl) this.galleryListEl.innerHTML = '';
            return;
        }
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        this.initGalleryNavbar(imgFooterEl);

        // const cm = activeView.sourceMode?.cmEditor;
        // const imgList: Array<GalleryImg> = parseMarkDown(plugin, cm, activeView.file.path);
        const imgList: Array<GalleryImg> = parseActiveViewData(this.plugin, activeView.data?.split('\n'), activeView.file.path);
        const imgContextHash: string[] = this.getTargetImgContextHash(this.containerView.targetImgEl, activeView.containerEl, this.plugin.imgSelector);
        const viewImageWithALink: boolean = this.plugin.settings.viewImageWithALink;
        let liEl: HTMLLIElement, imgEl, liElActive: HTMLLIElement;
        let targetImageIdx = -1;
        let isAddGalleryActive: boolean = false;
        let prevHash: string, nextHash: string;
        for (let i = 0, len = imgList.length; i < len; i++) {
            const img = imgList[i];
            // <li> <img class='gallery-img' src='' alt=''> </li>
            this.galleryListEl.append(liEl = createEl('li'));
            liEl.append(imgEl = createEl('img'));
            imgEl.addClass('gallery-img');
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

            this.galleryTranslateX = (document.documentElement.clientWidth || document.body.clientWidth) / 2.5 - targetImageIdx * 52;
            this.galleryListEl.style.transform = 'translateX(' + this.galleryTranslateX + 'px)';
        }
    }

    private initDefaultData = () => {
        this.galleryMouseDownClientX = 0;
        this.galleryTranslateX = 0;
        this.galleryListEl.style.transform = 'translateX(0px)';
        // remove all childs (li) of gallery-list
        this.galleryListEl.innerHTML = '';
    }

    private initGalleryNavbar = (imgFooterEl: HTMLElement) => {
        // <div class="gallery-navbar">
        if (!this.galleryNavbarEl) {
            // imgInfo.imgFooterEl.append(galleryNavbarEl = createDiv());
            imgFooterEl.append(this.galleryNavbarEl = createDiv());
            this.galleryNavbarEl.addClass('gallery-navbar');
            // add events
            this.galleryNavbarEl.addEventListener('mousedown', this.mouseDownGallery);
            this.galleryNavbarEl.addEventListener('mousemove', this.mouseMoveGallery);
            this.galleryNavbarEl.addEventListener('mouseup', this.mouseUpGallery);
            this.galleryNavbarEl.addEventListener('mouseleave', this.mouseLeaveGallery);
        }
        if (!this.galleryListEl) {
            this.galleryNavbarEl.append(this.galleryListEl = createEl('ul')); // <ul class="gallery-list">
            this.galleryListEl.addClass('gallery-list');
        }
        this.initDefaultData();
        this.galleryNavbarEl.hidden = false; // display 'gallery-navbar'
    }

    public closeGalleryNavbar = () => {
        this.galleryNavbarEl.hidden = true; // hide 'gallery-navbar'
        this.initDefaultData();
    }

    private getTargetImgContextHash = (targetImgEl: HTMLImageElement, containerEl: HTMLElement, imageSelector: string): string[] => {
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

    private clickGalleryImg = (event: MouseEvent) => {
        const targetEl = (<HTMLImageElement>event.target);
        if (!targetEl || 'IMG' !== targetEl.tagName) return;

        this.containerView.initDefaultData(targetEl.style);
        this.containerView.refreshImg(targetEl.src, targetEl.alt ? targetEl.alt : ' ');

        // remove the li's class gallery-active
        if (this.galleryListEl) {
            const liElList: HTMLCollectionOf<HTMLLIElement> = this.galleryListEl.getElementsByTagName('li');
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

    private mouseDownGallery = (event: MouseEvent) => {
        console.log('mouse Down Gallery...');
        event.preventDefault();
        event.stopPropagation();
        this.galleryIsMousingDown = true;
        this.galleryMouseDownClientX = event.clientX;
    }

    private mouseMoveGallery = (event: MouseEvent) => {
        console.log('mouse Move Gallery...');
        event.preventDefault();
        event.stopPropagation();
        if (!this.galleryIsMousingDown) return;
        let moveDistance = event.clientX - this.galleryMouseDownClientX;
        if (4 > Math.abs(moveDistance)) return;
        this.galleryMouseDownClientX = event.clientX;
        this.galleryTranslateX += moveDistance;

        const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
        const imgLiWidth = (this.galleryListEl.childElementCount - 1) * 52;
        // console.log('move...', 'windowWidth=' + windowWidth, 'galleryTranslateX=' + galleryTranslateX, 'li count=' + imgInfo.galleryList.childElementCount);
        if (this.galleryTranslateX + 50 >= windowWidth) this.galleryTranslateX = windowWidth - 50;
        if (0 > this.galleryTranslateX + imgLiWidth) this.galleryTranslateX = -imgLiWidth;

        this.galleryListEl.style.transform = 'translateX(' + this.galleryTranslateX + 'px)';
    }

    private mouseUpGallery = (event: MouseEvent) => {
        console.log('mouse Up Gallery>>>', event.target);
        event.preventDefault();
        event.stopPropagation();
        this.galleryIsMousingDown = false;
        this.clickGalleryImg(event);
    }

    private mouseLeaveGallery = (event: MouseEvent) => {
        console.log('mouse Leave Gallery>>>', event.target);
        event.preventDefault();
        event.stopPropagation();
        this.galleryIsMousingDown = false;
    }
}
