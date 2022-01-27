import { Plugin } from 'obsidian';
import { ImageToolkitSettingTab, IMG_GLOBAL_SETTINGS } from './conf/settings'
import { VIEW_IMG_SELECTOR } from './conf/constants'
import { ContainerView } from './ui/containerView';
import { ImgSettingIto } from './to/ImgSettingIto';

export default class ImageToolkitPlugin extends Plugin {

	public settings: ImgSettingIto;

	private containerView: ContainerView;

	public imgSelector: string = ``;

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...');

		await this.loadSettings();

		// plugin settings
		this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

		this.containerView = new ContainerView(this);

		this.toggleViewImage();
	}

	onunload() {
		console.log('unloading obsidian-image-toolkit plugin...');
		this.containerView.removeOitContainerView();
		this.containerView = null;
	}

	async loadSettings() {
		this.settings = Object.assign({}, IMG_GLOBAL_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	public clickImage = (event: MouseEvent) => {
		const targetEl = (<HTMLImageElement>event.target);
		if ('IMG' !== targetEl.tagName) return;
		this.containerView.renderContainerView(targetEl);
	}

	public toggleViewImage = () => {
		const viewImageGlobal = this.settings.viewImageGlobal;
		const viewImageEditor = this.settings.viewImageEditor;
		const viewImageInCPB = this.settings.viewImageInCPB;
		const viewImageWithALink = this.settings.viewImageWithALink;
		let selector = ``;
		if (this.imgSelector) {
			document.off('click', this.imgSelector, this.clickImage);
		}
		if (!viewImageGlobal || (!viewImageEditor && !viewImageInCPB && !viewImageWithALink)) {
			return;
		}
		if (viewImageGlobal) {
			selector = `img`;
			let notSelector = ``;
			if (!viewImageEditor) {
				// img:not(.CodeMirror-code img,.markdown-preview-section img,.view-content > .image-container img)
				notSelector = VIEW_IMG_SELECTOR.EDITOR_AREAS;
			}
			if (!viewImageInCPB) {
				// img:not(.community-plugin-details img)
				notSelector += (1 < notSelector.length ? `,` : ``) + VIEW_IMG_SELECTOR.CPB;
			}
			if (!viewImageWithALink) {
				// img:not(a img)
				notSelector += (1 < notSelector.length ? `,` : ``) + VIEW_IMG_SELECTOR.LINK;
			}
			if (notSelector) {
				selector += `:not(` + notSelector + `)`;
			}
		} else {
			if (viewImageEditor) {
				selector = VIEW_IMG_SELECTOR.EDITOR_AREAS;
			}
			if (viewImageInCPB) {
				selector += (1 < selector.length ? `,` : ``) + VIEW_IMG_SELECTOR.CPB;
			}
			if (viewImageWithALink) {
				selector += (1 < selector.length ? `,` : ``) + VIEW_IMG_SELECTOR.LINK;
			}
		}
		if (selector) {
			// console.log('selector: ', selector);
			this.imgSelector = selector;
			document.on('click', this.imgSelector, this.clickImage);
		}
	}
}
