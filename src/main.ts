import {addIcon, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, ImageToolkitSettingTab,} from './conf/settings'
import {ICONS, VIEW_IMG_SELECTOR} from './conf/constants'
import {MainContainerView} from './ui/mainContainerView';
import {PinContainerView} from './ui/pinContainerView';
import {ImgSettingIto} from "./to/imgTo";
import {ContainerView} from "./ui/containerView";

export default class ImageToolkitPlugin extends Plugin {

    public settings: ImgSettingIto;
    public containerView: ContainerView;
    public imgSelector: string = ``;

    async onload() {
        console.log('loading ' + this.manifest.id + ' plugin v' + this.manifest.version + ' ...');

        await this.loadSettings();

        // plugin settings
        this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

        // this.registerCommands();

        this.initContainerView(this.settings.pinMode);

        this.toggleViewImage();
    }

    onunload() {
        console.log('unloading obsidian-image-toolkit plugin...');
        this.containerView.removeOitContainerView();
        this.containerView = null;
        document.off('click', this.imgSelector, this.clickImage);
        document.off('mouseover', this.imgSelector, this.mouseoverImg);
        document.off('mouseout', this.imgSelector, this.mouseoutImg);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addIcons();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async registerCommands() {
        /* this.addCommand({
            "id": "oit-move-up-image",
            "name": "move up the image",
            hotkeys: [{ modifiers: ["Ctrl"], key: "ArrowUp" }],
            checkCallback: (checking: boolean) => {
                if (checking) return false;
                this.containerView.moveImgViewByHotkey('UP');
            },
        }); */
    }

    private addIcons = () => {
        for (const icon of ICONS) {
            addIcon(icon.id, icon.svg);
        }
    }

    private initContainerView = (pinMode: boolean) => {
        this.containerView = pinMode ?
            new PinContainerView(this, "PIN") :
            new MainContainerView(this, "MAIN");
    }

    public togglePinMode = (pinMode: boolean) => {
        this.containerView.removeOitContainerView();
        this.initContainerView(pinMode);
    }

    private clickImage = (event: MouseEvent) => {
        const targetEl = (<HTMLImageElement>event.target);
        if (!targetEl || 'IMG' !== targetEl.tagName
            || !this.containerView.checkHotkeySettings(event, this.settings.viewTriggerHotkey))
            return;
        this.containerView.renderContainerView(targetEl);
    }

    private mouseoverImg = (event: MouseEvent) => {
        const targetEl = (<HTMLImageElement>event.target);
        if (!targetEl || 'IMG' !== targetEl.tagName)
            return;
        // console.log('mouseoverImg......');
        const defaultCursor = targetEl.getAttribute('data-oit-default-cursor');
        if (null === defaultCursor) {
            targetEl.setAttribute('data-oit-default-cursor', targetEl.style.cursor || '');
        }
        targetEl.style.cursor = 'zoom-in';
    }

    private mouseoutImg = (event: MouseEvent) => {
        const targetEl = (<HTMLImageElement>event.target);
        // console.log('mouseoutImg....');
        if (!targetEl || 'IMG' !== targetEl.tagName) return;
        targetEl.style.cursor = targetEl.getAttribute('data-oit-default-cursor');
    }

    public toggleViewImage = () => {
        const viewImageEditor = this.settings.viewImageEditor; // .workspace-leaf-content[data-type='markdown'] img,.workspace-leaf-content[data-type='image'] img
        const viewImageInCPB = this.settings.viewImageInCPB; // .community-plugin-readme img
        const viewImageWithALink = this.settings.viewImageWithALink; // false: ... img:not(a img)
        const viewImageOther = this.settings.viewImageOther; // #sr-flashcard-view img

        if (this.imgSelector) {
            document.off('click', this.imgSelector, this.clickImage);
            document.off('mouseover', this.imgSelector, this.mouseoverImg);
            document.off('mouseout', this.imgSelector, this.mouseoutImg);
        }
        if (!viewImageOther && !viewImageEditor && !viewImageInCPB && !viewImageWithALink) {
            return;
        }
        let selector = ``;
        if (viewImageEditor) {
            selector += (viewImageWithALink ? VIEW_IMG_SELECTOR.EDITOR_AREAS : VIEW_IMG_SELECTOR.EDITOR_AREAS_NO_LINK);
        }
        if (viewImageInCPB) {
            selector += (1 < selector.length ? `,` : ``) + (viewImageWithALink ? VIEW_IMG_SELECTOR.CPB : VIEW_IMG_SELECTOR.CPB_NO_LINK);
        }
        if (viewImageOther) {
            selector += (1 < selector.length ? `,` : ``) + (viewImageWithALink ? VIEW_IMG_SELECTOR.OTHER : VIEW_IMG_SELECTOR.OTHER_NO_LINK);
        }

        if (selector) {
            // console.log('selector: ', selector);
            this.imgSelector = selector;
            document.on('click', this.imgSelector, this.clickImage);
            document.on('mouseover', this.imgSelector, this.mouseoverImg);
            document.on('mouseout', this.imgSelector, this.mouseoutImg);
        }
    }
}
