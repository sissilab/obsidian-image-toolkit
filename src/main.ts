import { Plugin } from 'obsidian';
import { ImageToolkitSettingTab, ImageToolkitSettings, DEFAULT_SETTINGS } from './conf/settings'
import { TARGET_IMG_INFO, renderViewContainer, removeViewContainer } from './ui/viewContainer'

export default class ImageToolkitPlugin extends Plugin {

	settings: ImageToolkitSettings;

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...');

		await this.loadSettings();

		// plugin settings
		this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

		this.toggleViewImage(this.settings.viewImageToggle);
		this.toggleViewImageInCPB(this.settings.viewImageInCPB);

		// this.registerDomEvent(document, 'click', this.clickImage);
	}

	onunload() {
		console.log('unloading obsidian-image-toolkit plugin', this.settings);
		removeViewContainer();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	public clickImage = (event: MouseEvent) => {
		const target = (<HTMLImageElement>event.target);
		if (TARGET_IMG_INFO.state || 'IMG' !== target.tagName) {
			return;
		}
		if (!this.settings.viewImageWithALink) {
			const targetParentEl = target.parentElement;
			if (targetParentEl && 'A' == targetParentEl.tagName) {
				//console.warn('The image with a link cannot be clicked to view!');
				return;
			}
		}
		renderViewContainer(target, this.app.workspace.containerEl);
	}

	public toggleViewImage = (open: boolean) => {
		if (open) {
			document.on('click',
				`.CodeMirror-code img,.markdown-preview-section img,.view-content > .image-container img`,
				this.clickImage);
		} else {
			document.off('click',
				`.CodeMirror-code img,.markdown-preview-section img,.view-content > .image-container img`,
				this.clickImage);
		}
	}

	public toggleViewImageInCPB = (open: boolean) => {
		if (open) {
			document.on('click',
				`.community-plugin-details img`,
				this.clickImage);
		} else {
			document.off('click',
				`.community-plugin-details img`,
				this.clickImage);
		}
	}
}
