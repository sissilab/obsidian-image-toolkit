import { on } from 'events';
import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, MarkdownView, MarkdownPreviewView } from 'obsidian';
import { IMG_TOOLBAR_ICONS, CLOSE_ICON } from './conf/constants';
import { ImageToolkitSettingTab, ImageToolkitSettings, DEFAULT_SETTINGS } from './conf/settings'
import { TARGET_IMG_INFO, renderViewContainer, removeViewContainer } from './ui/viewContainer'
import * as CodeMirror from 'codemirror';
import de from './lang/locale/de';
import { debug } from 'console';

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
			// console.log('ImageToolkitPlugin-click', event, eventTargetEl);
			renderViewContainer(eventTargetEl, this.app.workspace.containerEl);
		});

		this.app.workspace.containerEl.onmousedown = (event: MouseEvent) => {
			// event.stopPropagation();
			// event.preventDefault();
			// debugger
		};

		this.registerCodeMirror((cm) => {
			cm.on("beforeChange", (cm: CodeMirror.Editor, targetObj: CodeMirror.EditorChangeCancellable) => {
				// console.log('beforeChange...', cm, targetObj);

			});
			cm.on("change", (cm: CodeMirror.Editor, targetObj: CodeMirror.EditorChangeCancellable) => {
				// console.log('change...', cm, targetObj);

			});
			cm.on("beforeSelectionChange", (cm: CodeMirror.Editor, targetObj: CodeMirror.EditorSelectionChange) => {
				// console.log('beforeSelectionChange...', cm, targetObj);

			});
		});
	}

	onunload() {
		console.log('unloading obsidian-image-toolkit plugin', this.settings);
		removeViewContainer();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		console.log('image-toolkit loadSettings: ', this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
