import {CONTAINER_TYPE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ContainerView} from "./containerView";
import {ImgCto} from "../to/imgTo";

/**
 * PinContainerView: Pin an image on the top
 * @Support: move an image by mouse; close an image by Esc
 * @Nonsupport: move an image by keyboard; display gallery navbar
 */
export class PinContainerView extends ContainerView {

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType, plugin.settings.pinMaximum);
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
        }
        this.updateImgViewElAndList(this.pinMaximum);
        return this.getMatchedImg();
    }

    /**
     * hide container view
     * @param event not null: click event; null: keyboard event (Esc)
     */
    public closeContainerView = (event?: MouseEvent): void => {
        console.log('closeContainerView', event, this.imgGlobalStatus.activeImg)
        if (event) {
            // PinContainerView doesn't need click event to hide container for now
            return;
        }
        let activeImg: ImgCto;
        if (!this.imgInfoCto.oitContainerViewEl || !(activeImg = this.imgGlobalStatus.activeImg)) return;

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
        }
        this.imgGlobalStatus.popup = globalPopupFlag;
        this.addOrRemoveEvents(activeImg, false);
    }
    //endregion

    public checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
        return false;
    }

}