import { Plugin } from 'obsidian';
import { ImageToolkitSettingTab, ImageToolkitSettings, DEFAULT_SETTINGS } from './conf/settings'
import { TARGET_IMG_INFO, renderViewContainer, removeViewContainer } from './ui/viewContainer'
import { VIEW_IMG_SELECTOR } from './conf/constants'

let IMAGE_SELECTOR = ``;
export default class ImageToolkitPlugin extends Plugin {

	settings: ImageToolkitSettings;

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...');

		await this.loadSettings();

		// plugin settings
		this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

		this.toggleViewImage();

		// this.registerDomEvent(document, 'click', this.clickImage);
	}

	onunload() {
		console.log('unloading obsidian-image-toolkit plugin');
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

	public toggleViewImage = () => {
		const viewImageGlobal = this.settings.viewImageGlobal;
		const viewImageEditor = this.settings.viewImageEditor;
		const viewImageInCPB = this.settings.viewImageInCPB;
		let selector = ``;
		if (IMAGE_SELECTOR) {
			document.off('click', IMAGE_SELECTOR, this.clickImage);
		}
		if (viewImageGlobal) {
			selector = `img`;
			let notSelector = ``;
			if (!viewImageEditor) {
				notSelector = VIEW_IMG_SELECTOR.EDITOR_AREAS;
			}
			if (!viewImageInCPB) {
				notSelector += (!viewImageEditor ? `,` : ``) + VIEW_IMG_SELECTOR.CPB;
			}
			if (notSelector) {
				selector += `:not(` + notSelector + `)`;
			}
		} else {
			if (viewImageEditor) {
				selector = VIEW_IMG_SELECTOR.EDITOR_AREAS;
			}
			if (viewImageInCPB) {
				selector += (selector ? `,` : ``) + VIEW_IMG_SELECTOR.CPB;
			}
		}
		if (selector) {
			IMAGE_SELECTOR = selector;
			document.on('click', IMAGE_SELECTOR, this.clickImage);
		}
	};
}
