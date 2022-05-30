import ImageToolkitPlugin from "src/main";
import { ImgStatusIto, ImgInfoIto } from "src/to/imgTo";

export abstract class ContainerView {

    protected readonly plugin: ImageToolkitPlugin;

    // the clicked original image element
    protected targetOriginalImgEl: HTMLImageElement;

    protected realImgInterval: NodeJS.Timeout;

    protected defaultImgStyles = {
        transform: 'none',
        filter: 'none',
        mixBlendMode: 'normal',

        borderWidth: '',
        borderStyle: '',
        borderColor: ''
    }

    protected imgStatus: ImgStatusIto = {
        popup: false,

        dragging: false,

        arrowUp: false,
        arrowDown: false,
        arrowLeft: false,
        arrowRight: false
    }

    protected imgInfo: ImgInfoIto = {
        oitContainerViewEl: null,
        imgViewEl: null,
        imgTitleEl: null,
        imgTipEl: null,
        imgTipTimeout: null,
        imgFooterEl: null,
        imgPlayerEl: null,
        imgPlayerImgViewEl: null,

        curWidth: 0,
        curHeight: 0,
        realWidth: 0,
        realHeight: 0,
        left: 0,
        top: 0,
        moveX: 0,
        moveY: 0,
        rotate: 0,

        invertColor: false,
        scaleX: false,
        scaleY: false,

        fullScreen: false
    }

    constructor(plugin: ImageToolkitPlugin) {
        this.plugin = plugin;
    }

    public getPlugin = (): ImageToolkitPlugin => {
        return this.plugin;
    }

    public getTargetOriginalImgEl = (): HTMLImageElement => {
        return this.targetOriginalImgEl;
    }

    abstract renderContainerView(targetEl: HTMLImageElement): void;

    abstract initContainerView(targetEl: HTMLImageElement, containerEl: HTMLElement): void;

    abstract openOitContainerView(): void;

    public initDefaultData = (targetImgStyle: CSSStyleDeclaration) => {
        if (targetImgStyle) {
            this.defaultImgStyles.transform = 'none';
            this.defaultImgStyles.filter = targetImgStyle.filter;
            // @ts-ignore
            this.defaultImgStyles.mixBlendMode = targetImgStyle.mixBlendMode;

            this.defaultImgStyles.borderWidth = targetImgStyle.borderWidth;
            this.defaultImgStyles.borderStyle = targetImgStyle.borderStyle;
            this.defaultImgStyles.borderColor = targetImgStyle.borderColor;
        }

        this.imgStatus.dragging = false;
        this.imgStatus.arrowUp = false;
        this.imgStatus.arrowDown = false;
        this.imgStatus.arrowLeft = false;
        this.imgStatus.arrowRight = false;

        this.imgInfo.invertColor = false;
        this.imgInfo.scaleX = false;
        this.imgInfo.scaleY = false;
        this.imgInfo.fullScreen = false;
    }

    protected setTargetOriginalImg = (targetEl: HTMLImageElement) => {
        if (!targetEl) return;
        targetEl.setAttribute('data-oit-target', '1');
        this.targetOriginalImgEl = targetEl;
    }

    protected addBorderForTargetOriginalImg = (targetEl: HTMLImageElement) => {
        this.setTargetOriginalImg(targetEl);
        if (!targetEl || !this.plugin.settings.imageBorderToggle) return;
        const targetOriginalImgStyle = targetEl?.style;
        if (!targetOriginalImgStyle) return;
        targetOriginalImgStyle.setProperty('border-width', this.plugin.settings.imageBorderWidth);
        targetOriginalImgStyle.setProperty('border-style', this.plugin.settings.imageBorderStyle);
        targetOriginalImgStyle.setProperty('border-color', this.plugin.settings.imageBorderColor);
    }

    protected restoreBorderForLastTargetOriginalImg = (targetEl: HTMLImageElement) => {
        if (!this.targetOriginalImgEl) return;
        this.targetOriginalImgEl.removeAttribute('data-oit-target');
        const targetOriginalImgStyle = this.targetOriginalImgEl.style;
        if (targetOriginalImgStyle) {
            targetOriginalImgStyle.setProperty('border-width', this.defaultImgStyles.borderWidth);
            targetOriginalImgStyle.setProperty('border-style', this.defaultImgStyles.borderStyle);
            targetOriginalImgStyle.setProperty('border-color', this.defaultImgStyles.borderColor);
        }
    }

}
