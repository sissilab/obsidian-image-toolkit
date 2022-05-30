import { Md5 } from "md5-typescript";
import { MarkdownView, TFile } from "obsidian";
import ImageToolkitPlugin from "src/main";
import { GalleryImgCacheCto, GalleryImgCto } from "src/to/GalleryNavbarTo";
import { ImgSettingIto } from "src/to/imgTo";
import { md5Img, parseActiveViewData } from "src/util/markdowParse";
import { MainContainerView } from "./mainContainerView";

export class GalleryNavbarView {
    private readonly plugin: ImageToolkitPlugin;
    private readonly settings: ImgSettingIto;
    private readonly mainContainerView: MainContainerView;

    // whether to display gallery navbar
    private state: boolean = false;

    private galleryNavbarEl: HTMLDivElement = null;
    private galleryListEl: HTMLElement = null;

    private galleryIsMousingDown: boolean = false;
    private galleryMouseDownClientX: number = 0;
    private galleryTranslateX: number = 0;
    private mouseDownTime: number;

    private static GALLERY_IMG_CACHE = new Map();

    private readonly CACHE_LIMIT: number = 10;
    private readonly CLICK_TIME: number = 150;

    constructor(mainContainerView: MainContainerView, plugin: ImageToolkitPlugin) {
        this.mainContainerView = mainContainerView;
        this.plugin = plugin;
        this.settings = plugin.settings;
    }

    public renderGalleryImg = async (imgFooterEl: HTMLElement) => {
        if (this.state) return;
        // get all of images on the current editor
        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView
            || 'markdown' !== activeView.getViewType()
            // modal-container: community plugin, flashcards (Space Repetition)
            || 0 < document.getElementsByClassName('modal-container').length) {
            if (this.galleryNavbarEl) this.galleryNavbarEl.hidden = true;
            if (this.galleryListEl) this.galleryListEl.innerHTML = '';
            return;
        }
        // <div class="gallery-navbar"> <ul class="gallery-list"> <li> <img src='' alt=''> </li> <li...> <ul> </div>
        this.initGalleryNavbar(imgFooterEl);

        const activeFile: TFile = activeView.file;
        let galleryImg: GalleryImgCacheCto = this.getGalleryImgCache(activeFile);
        // let hitCache: boolean = true;
        if (!galleryImg) {
            // hitCache = false;
            galleryImg = parseActiveViewData(this.plugin, activeView.data?.split('\n'), activeFile);
            this.setGalleryImgCache(galleryImg);
        }
        // console.log('oit-gallery-navbar: ' + (hitCache ? 'hit cache' : 'miss cache') + '!', galleryImg);

        const imgList: Array<GalleryImgCto> = galleryImg.galleryImgList;
        const imgContextHash: string[] = this.getTargetImgContextHash(this.mainContainerView.getTargetOriginalImgEl(), activeView.containerEl, this.plugin.imgSelector);
        let liEl: HTMLLIElement, imgEl, liElActive: HTMLLIElement;
        let targetImageIdx = -1;
        let isAddGalleryActive: boolean = false;
        let prevHash: string, nextHash: string;
        const viewImageWithALink: boolean = this.plugin.settings.viewImageWithALink;
        for (let i = 0, len = imgList.length; i < len; i++) {
            const img = imgList[i];
            if (!viewImageWithALink && img.link) continue;
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
            if (liElActive) {
                liElActive.addClass('gallery-active');
                if (this.settings.galleryImgBorderActive) {
                    liElActive.addClass('img-border-active');
                    liElActive.style.setProperty('border-color', this.settings.galleryImgBorderActiveColor);
                }
            }

            this.galleryTranslateX = (document.documentElement.clientWidth || document.body.clientWidth) / 2.5 - targetImageIdx * 52;
            this.galleryListEl.style.transform = 'translateX(' + this.galleryTranslateX + 'px)';
        }
    }

    private initDefaultData = () => {
        this.galleryMouseDownClientX = 0;
        this.galleryTranslateX = 0;
        if (this.galleryListEl) {
            this.galleryListEl.style.transform = 'translateX(0px)';
            // remove all childs (li) of gallery-list
            this.galleryListEl.innerHTML = '';
        }
    }

    private initGalleryNavbar = (imgFooterEl: HTMLElement) => {
        // <div class="gallery-navbar">
        if (!this.galleryNavbarEl) {
            // imgInfo.imgFooterEl.append(galleryNavbarEl = createDiv());
            imgFooterEl.append(this.galleryNavbarEl = createDiv());
            this.galleryNavbarEl.addClass('gallery-navbar');
            this.galleryNavbarEl.onmouseover = () => {
                this.galleryNavbarEl.style.setProperty('background-color', this.settings.galleryNavbarHoverColor);
            }
            this.galleryNavbarEl.onmouseout = () => {
                this.galleryNavbarEl.style.setProperty('background-color', this.settings.galleryNavbarDefaultColor);
            }
            // add events
            this.galleryNavbarEl.addEventListener('mousedown', this.mouseDownGallery);
            this.galleryNavbarEl.addEventListener('mousemove', this.mouseMoveGallery);
            this.galleryNavbarEl.addEventListener('mouseup', this.mouseUpGallery);
            this.galleryNavbarEl.addEventListener('mouseleave', this.mouseLeaveGallery);
        }
        this.galleryNavbarEl.style.setProperty('background-color', this.settings.galleryNavbarDefaultColor);
        if (!this.galleryListEl) {
            this.galleryNavbarEl.append(this.galleryListEl = createEl('ul')); // <ul class="gallery-list">
            this.galleryListEl.addClass('gallery-list');
        }
        this.initDefaultData();
        this.galleryNavbarEl.hidden = false; // display 'gallery-navbar'
        this.state = true;
    }

    public closeGalleryNavbar = () => {
        if (!this.state) return;
        this.galleryNavbarEl.hidden = true; // hide 'gallery-navbar'
        this.state = false;
        this.initDefaultData();
    }

    public removeGalleryNavbar = () => {
        this.state = false;

        this.galleryNavbarEl?.remove();
        this.galleryListEl?.remove();

        this.galleryNavbarEl = null;
        this.galleryListEl = null;

        this.galleryIsMousingDown = false;
        this.galleryMouseDownClientX = 0;
        this.galleryTranslateX = 0;
        this.mouseDownTime = null;

        GalleryNavbarView.GALLERY_IMG_CACHE = new Map();

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

    private activateImage = (liEl: HTMLLIElement | HTMLElement, imgEL?: HTMLImageElement) => {
        if (!liEl || 'LI' !== liEl.tagName) return;
        if (!imgEL) {
            const imgELList: HTMLCollectionOf<HTMLImageElement> = liEl.getElementsByTagName('img');
            if (imgELList && 0 < imgELList.length) {
                imgEL = imgELList[0];
            }
        }
        if (imgEL) {
            this.mainContainerView.initDefaultData(imgEL.style);
            this.mainContainerView.refreshImg(imgEL.src, imgEL.alt ? imgEL.alt : ' ');
        }

        liEl.addClass('gallery-active');
        if (this.settings.galleryImgBorderActive) {
            liEl.addClass('img-border-active');
            liEl.style.setProperty('border-color', this.settings.galleryImgBorderActiveColor);
        }
    }

    private deactivateImage = (liEl: HTMLLIElement) => {
        if (!liEl) return;
        liEl.removeClass('gallery-active');
        if (liEl.hasClass('img-border-active')) {
            liEl.removeClass('img-border-active');
            liEl.style.removeProperty('border-color');
        }
    }

    private clickGalleryImg = (event: MouseEvent) => {
        const targetEl = (<HTMLImageElement>event.target);
        if (!targetEl || 'IMG' !== targetEl.tagName) return;

        if (this.galleryListEl) {
            const liElList: HTMLCollectionOf<Element> = this.galleryListEl.getElementsByClassName('gallery-active');
            for (let i = 0, len = liElList.length; i < len; i++) {
                this.deactivateImage(<HTMLLIElement>liElList[i]);
            }
        }

        this.activateImage(targetEl.parentElement, targetEl);
    }

    /**
     * switch the image on the gallery navbar
     * @param next true: switch to the next image; false: switch to the previous image
     */
    public switchImage = (next: boolean) => {
        if (!this.state || !this.galleryListEl) return;
        const liElList: HTMLCollectionOf<HTMLLIElement> = this.galleryListEl.getElementsByTagName('li');
        if (!liElList || 0 >= liElList.length) return;
        let liEl: HTMLLIElement;
        let toSwitchIdx: number = -1;
        for (let i = 0, len = liElList.length; i < len; i++) {
            if (!(liEl = liElList[i])) continue;
            if (liEl.hasClass('gallery-active')) {
                toSwitchIdx = next ? (len <= (i + 1) ? 0 : i + 1) : (0 == i ? len - 1 : i - 1);
                this.deactivateImage(liEl);
                break;
            }
        }
        if (0 >= toSwitchIdx) {
            toSwitchIdx = 0;
        }
        this.activateImage(liElList[toSwitchIdx]);
    }

    private mouseDownGallery = (event: MouseEvent) => {
        // console.log('mouse Down Gallery...');
        event.preventDefault();
        event.stopPropagation();
        this.mouseDownTime = new Date().getTime();
        this.galleryIsMousingDown = true;
        this.galleryMouseDownClientX = event.clientX;
    }

    private mouseMoveGallery = (event: MouseEvent) => {
        // console.log('mouse Move Gallery...');
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
        // console.log('mouse Up Gallery>>>', event.target);
        event.preventDefault();
        event.stopPropagation();
        this.galleryIsMousingDown = false;
        if (!this.mouseDownTime || this.CLICK_TIME > new Date().getTime() - this.mouseDownTime) {
            this.clickGalleryImg(event);
        }
        this.mouseDownTime = null;
    }

    private mouseLeaveGallery = (event: MouseEvent) => {
        // console.log('mouse Leave Gallery>>>', event.target);
        event.preventDefault();
        event.stopPropagation();
        this.galleryIsMousingDown = false;
        this.mouseDownTime = null;
    }

    private getGalleryImgCache = (file: TFile): GalleryImgCacheCto => {
        if (!file) return null;
        const md5File = this.md5File(file.path, file.stat.ctime);
        if (!md5File) return null;
        const galleryImgCache: GalleryImgCacheCto = GalleryNavbarView.GALLERY_IMG_CACHE.get(md5File);
        if (galleryImgCache && file.stat.mtime !== galleryImgCache.file.mtime) {
            GalleryNavbarView.GALLERY_IMG_CACHE.delete(md5File);
            return null;
        }
        return galleryImgCache;
    }

    private setGalleryImgCache = (galleryImg: GalleryImgCacheCto) => {
        const md5File = this.md5File(galleryImg.file.path, galleryImg.file.ctime);
        if (!md5File) return;
        this.trimGalleryImgCache();
        GalleryNavbarView.GALLERY_IMG_CACHE.set(md5File, galleryImg);
    }

    private trimGalleryImgCache = () => {
        if (GalleryNavbarView.GALLERY_IMG_CACHE.size < this.CACHE_LIMIT) return;
        let earliestMtime: number, earliestKey: string;
        GalleryNavbarView.GALLERY_IMG_CACHE.forEach((value: GalleryImgCacheCto, key: string) => {
            if (!earliestMtime) {
                earliestMtime = value.mtime;
                earliestKey = key;
            } else {
                if (earliestMtime > value.mtime) {
                    earliestMtime = value.mtime;
                    earliestKey = key;
                }
            }
        });
        if (earliestKey) {
            GalleryNavbarView.GALLERY_IMG_CACHE.delete(earliestKey);
        }
    }

    private md5File = (path: string, ctime: number) => {
        if (!path || !ctime) return;
        return Md5.init(path + '_' + ctime);
    }
}
