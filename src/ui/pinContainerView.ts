import {CONTAINER_TYPE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ContainerView} from "./containerView";

/**
 * PinContainerView: Pin an image on the top
 * @Support: move an image by mouse; close an image by Esc
 * @Nonsupport: move an image by keyboard; display gallery navbar
 */
export class PinContainerView extends ContainerView {

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType);
    }

    //region ================== Container View ========================
    public initContainerViewDom = (containerEl: HTMLElement): void => {
        /*
        <div class="oit-pin-container-view">
          <div class="img-container">
            <img class="img-view" data-index='1' src="" alt="">
            <img class="img-view" data-index='2' src="" alt="">
            ...
          </div>
        </div>
         */
        if (null == this.imgInfo.oitContainerViewEl || !this.imgInfo.oitContainerViewEl) { // init at first time
            // <div class="oit-pin-container-view">
            containerEl.appendChild(this.imgInfo.oitContainerViewEl = createDiv('oit-pin-container-view'));
            // <div class="img-container"> <img class="img-view" src="" alt=""> </div>
            const imgContainerEl = createDiv('img-container');
            imgContainerEl.appendChild(this.imgInfo.imgViewEl = createEl('img')); // img-view

            this.imgInfo.imgViewEl.addClass('img-view');
            this.setImgViewDefaultBackground();
            this.imgInfo.oitContainerViewEl.appendChild(imgContainerEl);
        }
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
        if (!this.imgInfo.oitContainerViewEl) return;
        // hide 'oit-pin-container-view'
        this.imgInfo.oitContainerViewEl.style.setProperty('display', 'none');
        this.renderImgView('', '');
        // remove events
        this.addOrRemoveEvents(false);
        this.imgStatus.popup = false;
    }
    //endregion

    public checkHotkeySettings = (event: KeyboardEvent, hotkey: string): boolean => {
        return false;
    }

}