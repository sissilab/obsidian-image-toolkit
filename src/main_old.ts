import { timeStamp } from 'console';
import { on } from 'events';
import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownView, MarkdownPreviewView } from 'obsidian';
import { IMG_TOOLBAR_ICONS, CLOSE_ICON } from 'src/conf/constants';

let POPUP_VIEW_CONTAINER = false;
let VIEW_CONTAINER_EL: HTMLDivElement = null;
let IMG_VIEW_EL: HTMLImageElement = null;
const ZOOM_FACTOR = 0.8;
const TARGET_IMG_INFO = { curWidth: 0, curHeight: 0, realWidth: 0, realHeight: 0, moveX: 0, moveY: 0, rotate: 0 };
let DRAGGING = false;


interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const VIEW_IMAGE_VIEW_TYPE = "view-image-view-container";

class viewImageView extends ItemView {

	app: App;
	plugin: ImageToolkitPlugin;
	settings: MyPluginSettings;

	constructor(
		leaf: WorkspaceLeaf,
		plugin: ImageToolkitPlugin,
		app: App,
		settings: MyPluginSettings,
	) {
		super(leaf);
		this.plugin = plugin;
		this.app = app;
		this.settings = settings;
	}

	getViewType(): string {
		return VIEW_IMAGE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "view-image-DisplayText";
	}

	getIcon(): string {
		return "dice";
	}

	load(): void {
		super.load();
		this.draw();
	}

	draw(): void {
		console.log('draw', this.containerEl);
	}
}

export default class ImageToolkitPlugin extends Plugin {
	settings: MyPluginSettings;

	// get view() {
	// 	let leaf = (
	//         this.app.workspace.getLeavesOfType(VIEW_IMAGE_VIEW_TYPE) ?? []
	//     ).shift();
	//     if (leaf && leaf.view && leaf.view instanceof viewImageView)
	//         return leaf.view;
	// }

	async onload() {
		console.log('loading obsidian-image-toolkit plugin...', this.settings);

		await this.loadSettings();

		// 左侧上方功能区
		/* this.addRibbonIcon('dice', 'Image Toolkit Plugin', () => {
			new Notice('This is a notice!');
		}); */

		// 底部状态栏区
		// this.addStatusBarItem().setText('Image Toolkit Status Bar Text');

		// 命令区
		/* this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new SampleModal(this.app).open();
					}
					return true;
				}
				return false;
			}
		}); */

		// 插件设置弹框区
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// this.registerView(VIEW_IMAGE_VIEW_TYPE, (leaf: WorkspaceLeaf) =>
		// 	new viewImageView(
		// 		leaf,
		// 		this,
		// 		this.app,
		// 		this.settings,
		// 	));

		// 右侧上部功能区
		// this.app.workspace.getRightLeaf(false).setViewState({ 
		// 	type: VIEW_IMAGE_VIEW_TYPE 
		// });

		// this.app.workspace.onLayoutReady(() => {
		// 	console.log('onLayoutReady');
		// });

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			const evtTargetEl = (<HTMLImageElement>evt.target);

			if ('IMG' == evtTargetEl.tagName && !POPUP_VIEW_CONTAINER) {
				console.log('ImageToolkitPlugin-click', evt, evtTargetEl);
				this.initViewContainer(evtTargetEl);
				this.displayViewContainer(true);
				let imgZoomSize = this.calculateImgZoomSize(evtTargetEl.src);
				IMG_VIEW_EL.setAttribute('width', imgZoomSize.width);
				IMG_VIEW_EL.style.setProperty('margin-top', imgZoomSize.top, 'important');
				IMG_VIEW_EL.style.setProperty('margin-left', imgZoomSize.left, 'important');
				TARGET_IMG_INFO.rotate = 0;
				IMG_VIEW_EL.style.transform = 'rotate(0deg)';
			}

			// const activeMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			// const activeFile = this.app.workspace.getActiveFile();
			// console.log('activeMarkdownView', activeMarkdownView, activeMarkdownView.containerEl.getElementsByTagName('img'));
			// console.log('activeFile', activeFile);

		});

		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// if (this.app.workspace.layoutReady) {
		// 	this.addviewImageView();
		// } else {
		// 	// this.registerEvent(this.app.workspace.on('layout-ready', this.addviewImageView.bind(this)));
		// }


	}

	onunload() {
		console.log('unloading obsidian-image-toolkit plugin', this.settings);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// addviewImageView() {
	//     if (this.app.workspace.getLeavesOfType(VIEW_IMAGE_VIEW_TYPE).length) {
	//         return;
	//     }
	//     this.app.workspace.getRightLeaf(false).setViewState({
	//         type: VIEW_IMAGE_VIEW_TYPE,
	//     });
	// }

	/**
	 * initialize html element: popup container for viewing image
	 * @param evtTargetEl 
	 */
	initViewContainer(evtTargetEl: HTMLImageElement) {
		let imgTitleDiv = null;
		if (null == VIEW_CONTAINER_EL) {
			// <div class="image-toolkit-view-container">
			VIEW_CONTAINER_EL = createDiv();
			VIEW_CONTAINER_EL.setAttribute('class', 'image-toolkit-view-container');
			this.app.workspace.containerEl.appendChild(VIEW_CONTAINER_EL);
			// <div class="img-container"> <img class="img-view" src="" alt=""> </div>
			const imgContainerDiv = createDiv();
			imgContainerDiv.setAttribute('class', 'img-container');
			IMG_VIEW_EL = createEl('img');
			IMG_VIEW_EL.setAttribute('class', 'img-view');
			IMG_VIEW_EL.setAttribute('src', '');
			IMG_VIEW_EL.setAttribute('alt', '');
			imgContainerDiv.appendChild(IMG_VIEW_EL);
			VIEW_CONTAINER_EL.appendChild(imgContainerDiv);
			// <div class="img-close"></div>
			const imgCloseDiv = createDiv();
			imgCloseDiv.innerHTML = CLOSE_ICON.svg;
			imgCloseDiv.setAttribute('class', 'img-close');
			VIEW_CONTAINER_EL.appendChild(imgCloseDiv);
			// <div class="img-footer"> ... <div>
			const imgFooterDiv = createDiv();
			imgFooterDiv.setAttribute('class', 'img-footer');
			VIEW_CONTAINER_EL.appendChild(imgFooterDiv);
			// <div class="img-title"></div>
			imgTitleDiv = createDiv();
			imgTitleDiv.setAttribute('class', 'img-title');
			imgFooterDiv.appendChild(imgTitleDiv);
			// <ul class="img-toolbar">
			const imgToolbarUl = createEl('ul');
			imgToolbarUl.setAttribute('class', 'img-toolbar');
			imgFooterDiv.appendChild(imgToolbarUl);
			for (const toolbar of IMG_TOOLBAR_ICONS) {
				const toolbarLi = createEl('li');
				toolbarLi.innerHTML = toolbar.svg;
				imgToolbarUl.appendChild(toolbarLi);
				switch (toolbar.key) {
					case 'zoom_in':
						toolbarLi.addEventListener('click', () => {
							this.zoom(0.1);
						});
						break;
					case 'zoom_out':
						toolbarLi.addEventListener('click', () => {
							this.zoom(-0.1);
						});
						break;
					case 'restore':
						toolbarLi.addEventListener('click', () => {
							this.restore();
						});
						break
					case 'rorate_left':
						toolbarLi.addEventListener('click', () => {
							this.rotate(-90);
						});
						break
					case 'rorate_right':
						toolbarLi.addEventListener('click', () => {
							this.rotate(90);
						});
						break
					default:
						break;
				}
			}
			// img-close: regisiter click event -> close the popup layer
			imgCloseDiv.addEventListener('click', () => {
				this.displayViewContainer(false);
			});
			document.addEventListener('keyup', this.keyup);
			// img-view: regisiter mouse event -> drag the image
			IMG_VIEW_EL.addEventListener('mousedown', this.mousedownImgView);
			// 鼠标滚轮事件
			VIEW_CONTAINER_EL.addEventListener('mousewheel', this.mousewheelViewContainer);

			console.log('init view-container success!');
		}
		IMG_VIEW_EL.setAttribute('src', evtTargetEl.src || '');
		IMG_VIEW_EL.setAttribute('alt', evtTargetEl.alt || '');
		if (!imgTitleDiv) {
			imgTitleDiv = VIEW_CONTAINER_EL.getElementsByClassName('img-title')[0];
		}
		imgTitleDiv.setText(evtTargetEl.alt);
	}

	/**
	 * whether display the popup container or not
	 * @param flag true: display; false: hide
	 */
	displayViewContainer(flag: boolean) {
		if (flag) {
			VIEW_CONTAINER_EL.style.setProperty('display', 'block');
			POPUP_VIEW_CONTAINER = true;
		} else {
			VIEW_CONTAINER_EL.style.setProperty('display', 'none');
			document.removeEventListener('keyup', this.keyup);
			POPUP_VIEW_CONTAINER = false;
		}
	}

	/**
	 * calculate zoom size of the target image  
	 * @param imgSrc 
	 * @returns 
	 */
	calculateImgZoomSize(imgSrc: string) {
		if (!imgSrc) {
			return;
		}
		// 当前窗口宽高
		const windowWidth = document.documentElement.clientWidth || document.body.clientWidth;
		const windowHeight = document.documentElement.clientHeight || document.body.clientHeight;
		// 当前窗口缩放后的宽高
		const windowZoomWidth = windowWidth * ZOOM_FACTOR;
		const windowZoomHeight = windowHeight * ZOOM_FACTOR;
		// 获取原图宽高
		let realImg = new Image();
		realImg.src = imgSrc;
		let tempWidth = realImg.width, tempHeight = realImg.height;
		if (realImg.height > windowZoomHeight) {
			tempHeight = windowZoomHeight;
			if ((tempWidth = tempHeight / realImg.height * realImg.width) > windowZoomWidth) {
				tempWidth = windowZoomWidth;
			}
		} else if (realImg.width > windowZoomWidth) {
			tempWidth = windowZoomWidth;
			tempHeight = tempWidth / realImg.width * realImg.height;
		}
		let width = tempWidth + 'px';
		let height = tempHeight + 'px';
		let top = (windowHeight - tempHeight) / 2 + 'px';
		let left = (windowWidth - tempWidth) / 2 + 'px';
		// cache image info
		TARGET_IMG_INFO.curWidth = tempWidth;
		TARGET_IMG_INFO.curHeight = tempHeight;
		TARGET_IMG_INFO.realWidth = realImg.width;
		TARGET_IMG_INFO.realHeight = realImg.height;
		// console.log('calculateImgZoomSize', 'realImg: ' + realImg.width + ',' + realImg.height,
		// 	'tempSize: ' + tempWidth + ',' + tempHeight,
		// 	'windowZoomSize: ' + windowZoomWidth + ',' + windowZoomHeight,
		// 	'windowSize: ' + windowWidth + ',' + windowHeight);
		return { width, height, top, left };
	}

	private zoom = (ratio: number) => {
		ratio = ratio > 0 ? 1 + ratio : 1 / (1 - ratio);
		let zoomRatio = TARGET_IMG_INFO.curWidth * ratio / TARGET_IMG_INFO.realWidth;
		const newWidth = TARGET_IMG_INFO.realWidth * zoomRatio;
		const newHeight = TARGET_IMG_INFO.curHeight * zoomRatio;
		// cache image info
		TARGET_IMG_INFO.curWidth = newWidth;
		TARGET_IMG_INFO.curHeight = newHeight;
		IMG_VIEW_EL.setAttribute('width', newWidth + 'px');
	}

	private restore = () => {
		let imgZoomSize = this.calculateImgZoomSize(IMG_VIEW_EL.src);
		IMG_VIEW_EL.setAttribute('width', imgZoomSize.width);
		IMG_VIEW_EL.style.setProperty('margin-top', imgZoomSize.top, 'important');
		IMG_VIEW_EL.style.setProperty('margin-left', imgZoomSize.left, 'important');
		TARGET_IMG_INFO.rotate = 0;
		IMG_VIEW_EL.style.transform = 'rotate(0deg)';
	}

	private rotate = (degree: number) => {
		IMG_VIEW_EL.style.setProperty('transform', 'rotate(' + (TARGET_IMG_INFO.rotate += degree) + 'deg)');
	}

	private mousedownImgView = (event: MouseEvent) => {
		DRAGGING = true;
		event.preventDefault();
		event.stopPropagation();		
		// 鼠标相对于图片的位置
		TARGET_IMG_INFO.moveX = IMG_VIEW_EL.offsetLeft - event.clientX;
		TARGET_IMG_INFO.moveY = IMG_VIEW_EL.offsetTop - event.clientY;

		// 鼠标按下时持续触发/移动事件 
		IMG_VIEW_EL.addEventListener('mousemove', this.mousemoveImgView);

		// 鼠标松开/回弹触发事件
		IMG_VIEW_EL.addEventListener('mouseup', this.mouseupImgView);
	}

	private mousemoveImgView = (event: MouseEvent) => {
		if (!DRAGGING) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();		
		// 修改图片位置
		IMG_VIEW_EL.style.setProperty('margin-top', (event.clientY + TARGET_IMG_INFO.moveY) + 'px', 'important');
		IMG_VIEW_EL.style.setProperty('margin-left', (event.clientX + TARGET_IMG_INFO.moveX) + 'px', 'important');
	}

	private mouseupImgView = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		DRAGGING = false;
		IMG_VIEW_EL.addEventListener('mousemove', this.mousemoveImgView, false);
		IMG_VIEW_EL.addEventListener('mouseup', this.mouseupImgView, false);
	}

	private mousewheelViewContainer = (event: WheelEvent) => {
		// console.log('mousewheel', event, event.wheelDelta);
		event.preventDefault();
		event.stopPropagation(); this.zoom(0 < event.wheelDelta ? 0.1 : -0.1);
	}

	private keyup = (event: KeyboardEvent) => {
		console.log('keyup', event, event.code);
		event.stopPropagation();
		switch (event.code) {
			case 'Escape': // Esc
				this.displayViewContainer(false);
				break;
			default:
				break
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ImageToolkitPlugin;

	constructor(app: App, plugin: ImageToolkitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for image toolkit.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
