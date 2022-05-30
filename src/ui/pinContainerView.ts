import ImageToolkitPlugin from "src/main";

export class PinContainerView {

    private readonly plugin: ImageToolkitPlugin;

    constructor(plugin: ImageToolkitPlugin) {
        this.plugin = plugin;
    }

    public renderContainerView = (targetEl: HTMLImageElement) => {
        this.initContainerView(targetEl, this.plugin.app.workspace.containerEl);
    }

    public initContainerView = (targetEl: HTMLImageElement, containerEl: HTMLElement): void => {
        const pinContainerViewEl: HTMLDivElement = createDiv('oit-pin-container-view');
        const imgEl: HTMLImageElement = createEl('img');
        imgEl.src = 'app://local/D:/ObsidianVault-Dev/0x0_Cellar/0x00_Images/pool/obsidian_note_icon.jpg?1628961459958';
        imgEl.alt = 'TTT';
        pinContainerViewEl.appendChild(imgEl);
    }

}