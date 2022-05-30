import {CONTAINER_TYPE} from "src/conf/constants";
import ImageToolkitPlugin from "src/main";
import {ContainerView} from "./containerView";

export class PinContainerView extends ContainerView {

    constructor(plugin: ImageToolkitPlugin, containerType: keyof typeof CONTAINER_TYPE) {
        super(plugin, containerType);
    }

    public initContainerViewDom = (containerEl: HTMLElement): void => {
        if (null == this.imgInfo.oitContainerViewEl || !this.imgInfo.oitContainerViewEl) {
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

    public closeViewContainer = (event?: MouseEvent): void => {

    }
}