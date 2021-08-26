import { Plugin } from 'obsidian';
import { ImageToolkitSettingTab, ImageToolkitSettings, DEFAULT_SETTINGS } from './conf/settings'
import { TARGET_IMG_INFO, renderViewContainer, removeViewContainer } from './ui/viewContainer'

export default class ImageToolkitPlugin extends Plugin {

	settings: ImageToolkitSettings;

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...');

		await this.loadSettings();

		// 插件设置弹框区
		this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

		this.registerDomEvent(document, 'click', (event: MouseEvent) => {
			const eventTargetEl = (<HTMLImageElement>event.target);
			if (!this.settings.viewImageToggle || TARGET_IMG_INFO.state || 'IMG' !== eventTargetEl.tagName) {
				return;
			}
			renderViewContainer(eventTargetEl, this.app.workspace.containerEl);
		});
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
}
