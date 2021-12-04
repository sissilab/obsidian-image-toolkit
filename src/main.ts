import { Plugin } from 'obsidian';
import { ImageToolkitSettingTab, ImageToolkitSettings, DEFAULT_SETTINGS } from './conf/settings'
import { TARGET_IMG_INFO, renderViewContainer, removeViewContainer } from './ui/viewContainer'
import { VIEW_IMG_SELECTOR } from './conf/constants'

let IMAGE_SELECTOR = ``;
let CLICKED_IMG_INFO = { width: 0, height: 0, position: '' };
export default class ImageToolkitPlugin extends Plugin {

	settings: ImageToolkitSettings;

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...');

		await this.loadSettings();

		// plugin settings
		this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

		this.toggleViewImage();

		if ('Blue Topaz' === this.app.vault.getConfig('cssTheme')) {
			document.on('mouseover', 'img', (event: MouseEvent) => {
				const targetEl = (<HTMLImageElement>event.target);
				CLICKED_IMG_INFO.width = targetEl.width;
				CLICKED_IMG_INFO.height = targetEl.height;
				CLICKED_IMG_INFO.position = targetEl.style.position;
				console.log('mouseover..',CLICKED_IMG_INFO);

				
			});
			document.on('mousedown', 'img', (event: MouseEvent) => {
				const targetEl = (<HTMLImageElement>event.target);
				console.log('mousedown...', CLICKED_IMG_INFO);
				
				targetEl.setAttribute('width', CLICKED_IMG_INFO.width+'px');
				targetEl.setAttribute('height', CLICKED_IMG_INFO.height+'px');
				targetEl.style.setProperty('position', CLICKED_IMG_INFO.position);
				targetEl.style.setProperty('margin-top', '200px', 'important');
				
			});
		}

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
		renderViewContainer(target, this.app.workspace.containerEl);
	}

	public toggleViewImage = () => {
		const viewImageGlobal = this.settings.viewImageGlobal;
		const viewImageEditor = this.settings.viewImageEditor;
		const viewImageInCPB = this.settings.viewImageInCPB;
		const viewImageWithALink = this.settings.viewImageWithALink;
		let selector = ``;
		if (IMAGE_SELECTOR) {
			document.off('click', IMAGE_SELECTOR, this.clickImage);
		}
		if (!viewImageGlobal && !viewImageEditor && !viewImageInCPB && !viewImageWithALink) {
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
			//console.log('selector: ', selector);
			IMAGE_SELECTOR = selector;
			document.on('click', IMAGE_SELECTOR, this.clickImage);
		}
	};
}
