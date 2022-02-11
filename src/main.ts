import { Plugin, WorkspaceLeaf } from 'obsidian';
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
		document.off('click', this.imgSelector, this.clickImage);
		document.off('mouseover', this.imgSelector, this.mouseoverImg);
		document.off('mouseout', this.imgSelector, this.mouseoutImg);
	}

	async loadSettings() {
		this.settings = Object.assign({}, IMG_GLOBAL_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private clickImage = (event: MouseEvent) => {
		const targetEl = (<HTMLImageElement>event.target);
		if (!targetEl || 'IMG' !== targetEl.tagName
			// block Memos
			|| 'memos_view' === this.app.workspace?.activeLeaf?.getViewState()?.type)
			return;
		if (!this.settings.viewImageWithALink && 'A' === targetEl.parentElement?.tagName) return;
		this.containerView.renderContainerView(targetEl);
	}

	private isBlockZoomInCursor(targetEl: HTMLImageElement) {
		return 'IMG' !== targetEl.tagName
			|| 'img-view' === targetEl.className
			|| 'img-fullscreen' === targetEl.className
			|| 'gallery-img' === targetEl.className
			|| (!this.settings.viewImageWithALink && 'A' === targetEl.parentElement?.tagName)
			|| targetEl.parentElement?.hasClass('image-embed') // block preview-image-dialog on Memos
			|| targetEl.parentElement?.hasClass('close-btn') // block preview-image-dialog on Memos
			|| targetEl.offsetParent?.hasClass('about-site-dialog') // block preview-image-dialog on Memos
			;
	}

	private mouseoverImg = (event: MouseEvent) => {
		const targetEl = (<HTMLImageElement>event.target);
		if (!targetEl || this.isBlockZoomInCursor(targetEl)) return;
		targetEl.addClass('oit-target-cursor');

		console.log('mouseoverImg......');
		let isExistTargetCursor: boolean = false;
		this.app.workspace.iterateAllLeaves((leave: WorkspaceLeaf) => {
			console.log('leave: ', 'type=' + leave.getViewState().type, leave.view.containerEl);
			const type = leave.getViewState().type;
			if (('markdown' === type || 'image' === type) && leave.view.containerEl.hasClass('oit-target-cursor')) {
				isExistTargetCursor = true;
				return;
			}
		});
		console.log('return.....');

		// block Memos
		const memosLeaves = this.app.workspace.getLeavesOfType('memos_view');
		if (memosLeaves && 0 < memosLeaves.length) {
			for (const memos of memosLeaves) {
				const targetCursorEls: HTMLCollectionOf<Element> = memos.view.containerEl.getElementsByClassName('oit-target-cursor');
				if (targetCursorEls && 0 < targetCursorEls.length) return;
			}
		}

		const defaultCursor = targetEl.getAttribute('data-oit-default-cursor');
		if (null === defaultCursor) {
			targetEl.setAttribute('data-oit-default-cursor', targetEl.style.cursor || '');
		}
		targetEl.style.cursor = 'zoom-in';
	}

	private mouseoutImg = (event: MouseEvent) => {
		const targetEl = (<HTMLImageElement>event.target);
		// console.log('mouseoutImg....', targetEl, targetEl.parentElement);
		if (!targetEl || this.isBlockZoomInCursor(targetEl)) return;
		targetEl.removeClass('oit-target-cursor');
		targetEl.style.cursor = targetEl.getAttribute('data-oit-default-cursor');
	}

	public toggleViewImage = () => {
		const viewImageGlobal = this.settings.viewImageGlobal;
		const viewImageEditor = this.settings.viewImageEditor;
		const viewImageInCPB = this.settings.viewImageInCPB;
		const viewImageWithALink = this.settings.viewImageWithALink;
		let selector = ``;
		if (this.imgSelector) {
			document.off('click', this.imgSelector, this.clickImage);
			document.off('mouseover', this.imgSelector, this.mouseoverImg);
			document.off('mouseout', this.imgSelector, this.mouseoutImg);
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
			if (viewImageWithALink && !viewImageEditor) {
				selector += `,a img`;
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
			document.on('mouseover', this.imgSelector, this.mouseoverImg);
			document.on('mouseout', this.imgSelector, this.mouseoutImg);
		}
	}
}
