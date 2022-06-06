import {CONTAINER_TYPE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ContainerView} from "./containerView";
import {ImgCto} from "../to/imgTo";
import {MenuView} from "./menuView";

/**
 * PinContainerView: Pin an image on the top
 * @Support: move an image by mouse; close an image by Esc
 * @Nonsupport: move an image by keyboard; display gallery navbar
 */
export class PinContainerView extends ContainerView {

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType, plugin.settings.pinMaximum);
        this.setMenuView(new MenuView(this));
    }

    public setActiveImgForMouseEvent(imgCto: ImgCto): void {
        this.imgGlobalStatus.activeImg = imgCto;
    }

    //region ================== Container View ========================
    public initContainerViewDom = (containerEl: HTMLElement): ImgCto => {
        /*
        <div class="oit-pin-container-view">
          <div class="img-container">
            <img class="img-view" data-index='0' src="" alt="">
            <img class="img-view" data-index='1' src="" alt="">
            ...
          </div>
        </div>
         */
        if (!this.imgInfoCto.oitContainerViewEl) { // init at first time
            // create: <div class="oit-pin-container-view">
            containerEl.appendChild(this.imgInfoCto.oitContainerViewEl = createDiv('oit-pin-container-view'));
            // <div class="oit-pin-container-view"> <div class="img-container"/> </div>
            this.imgInfoCto.oitContainerViewEl.append(this.imgInfoCto.imgContainerEl = createDiv('img-container'));

            // <div class="img-tip"></div>
            this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgTipEl = createDiv('img-tip')); // img-tip
            this.imgInfoCto.imgTipEl.hidden = true; // hide 'img-tip'

            // <div class="img-player"> <img class='img-fullscreen' src=''> </div>
            this.imgInfoCto.oitContainerViewEl.appendChild(this.imgInfoCto.imgPlayerEl = createDiv('img-player')); // img-player for full screen mode
            this.imgInfoCto.imgPlayerEl.appendChild(this.imgInfoCto.imgPlayerImgViewEl = createEl('img'));
            this.imgInfoCto.imgPlayerImgViewEl.addClass('img-fullscreen');
        }
        // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
        this.updateImgViewElAndList(this.pinMaximum);
        const matchedImg = this.getMatchedImg();
        if (matchedImg) {
            matchedImg.zIndex = (++this.imgGlobalStatus.activeImgZIndex);
            matchedImg.imgViewEl.style.setProperty('z-index', matchedImg.zIndex + '')
        }
        return matchedImg;
    }

    /**
     * hide container view
     * @param event not null: click event; null: keyboard event (Esc)
     * @param activeImg
     */
    public closeContainerView = (event?: MouseEvent, activeImg?: ImgCto): void => {
        if (event && !activeImg) {
            // PinContainerView doesn't need click event to hide container for now
            return;
        }
        if (!this.imgInfoCto.oitContainerViewEl) return;
        if (!activeImg && !(activeImg = this.imgGlobalStatus.activeImg)) return;
        // console.log('closeContainerView', event, activeImg)
        this.renderImgView(activeImg.imgViewEl, '', '');
        activeImg.popup = false;
        activeImg.mtime = 0;

        let globalPopupFlag: boolean = false;
        for (const imgCto of this.imgInfoCto.imgList) {
            if (imgCto.popup) {
                globalPopupFlag = true;
                break;
            }
        }
        if (!globalPopupFlag) {
            this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-pin-container-view'
            this.imgGlobalStatus.activeImgZIndex = 0;
            this.imgInfoCto.imgList.forEach(value => {
                value.zIndex = 0;
            });
        }
        this.imgGlobalStatus.popup = globalPopupFlag;
        this.addOrRemoveEvents(activeImg, false);
    }
    //endregion

    public checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
        return false;
    }

    protected setActiveImgZIndex = (activeImg: ImgCto) => {
        let isUpdate: boolean = false;
        for (const imgCto of this.imgInfoCto.imgList) {
            if (activeImg.index !== imgCto.index && activeImg.zIndex <= imgCto.zIndex) {
                isUpdate = true;
                break;
            }
        }
        if (isUpdate) {
            activeImg.zIndex = (++this.imgGlobalStatus.activeImgZIndex);
            activeImg.imgViewEl?.style.setProperty("z-index", activeImg.zIndex + '');
        }
    }

}