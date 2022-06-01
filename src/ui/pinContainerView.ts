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

    private pinMaximum: number = 5;

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType);
        //this.pinMaximum = this.plugin.settings.pinMaximum;
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
            // <div class="oit-pin-container-view">
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
        if (event) {
            // PinContainerView doesn't need click event to hide container for now
            return;
        }
        if (!this.imgInfoCto.oitContainerViewEl) return;

        // todo 鼠标在哪个图片上，就关闭哪个图片
        // for (const imgCto of this.imgInfoCto.imgList) {
        //     this.renderImgView(imgCto.imgViewEl, '', '');
        // }

        // this.imgInfoCto.oitContainerViewEl.style.setProperty('display', 'none'); // hide 'oit-pin-container-view'

        // remove events
        // this.addOrRemoveEvents(false);
        // this.imgStatus.popup = false;
    }
    //endregion

    public checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
        return false;
    }

}