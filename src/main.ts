import {addIcon, MarkdownView, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, ImageToolkitSettingTab} from './conf/settings'
import {DEFAULT_VIEW_MODE, ICONS, VIEW_IMG_SELECTOR, ViewMode} from './conf/constants'
import {NormalContainerView} from './ui/container/normalContainer.view';
import {PinContainerView} from './ui/container/pinContainer.view';
import {ContainerView} from "./ui/container/container.view";
import {SettingsIto} from "./model/settings.to";

export default class ImageToolkitPlugin extends Plugin {

  public settings: SettingsIto;
  public containerView: ContainerView;
  public imgSelector: string = ``;

  async onload() {
    console.log('loading %s plugin v%s ...', this.manifest.id, this.manifest.version);

    await this.loadSettings();

    this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

    // this.registerCommands();

    await this.initContainerView(this.settings.viewMode);

    this.toggleViewImage();

    console.log(this.app.workspace.containerEl)

    this.app.workspace.containerEl.matchParent('.app-container').addClass('oit-root');
    //.appendChild(createDiv('oitoit'));
    this.app.workspace.on('layout-change', () => {
      // console.log('layout-change..');
      const activeViewOfType = this.app.workspace.getActiveViewOfType(MarkdownView);
      console.log('activeViewOfType', activeViewOfType, activeViewOfType?.getDisplayText());
      const containerEl = activeViewOfType?.containerEl;
      if (containerEl) {
        containerEl.on('click',`img`, (e: MouseEvent) => {
          console.log('img click...', e.target)
          const targetEl = (<HTMLImageElement>e.target);
          const appContainerEl = targetEl.matchParent('.app-container');
          console.log(appContainerEl.id)
          const oitoit = appContainerEl.getElementsByClassName('oitoit');
          console.log('oit zai..',oitoit)
        });
      }
      console.log('=======================')
      /*app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
          const viewState = leaf.getViewState();
          if (viewState.type === 'markdown') {
            console.log('leaf:', leaf, leaf.getDisplayText(), leaf.getViewState());
            const appContainer = leaf.view.containerEl.matchParent('.app-container');
            let oit = appContainer.getElementsByClassName('oit');
            if (!oit || 0 === oit.length) {
              console.log('new oit...')
              appContainer.appendChild(createDiv('oit'));
              appContainer.addEventListener('click', (e: MouseEvent) => {
                if (e.target.tagName === 'IMG') {
                  console.log('img click...', e.target)
                }
              });
            } else {
              console.log('yicunzai~~', oit)
            }
          }
        }
      )*/
    });
  }

  onunload() {
    console.log('unloading ' + this.manifest.id + ' plugin...');
    this.containerView.removeOitContainerView();
    this.containerView = null;
    document.off('click', this.imgSelector, this.clickImage);
    document.off('mouseover', this.imgSelector, this.mouseoverImg);
    document.off('mouseout', this.imgSelector, this.mouseoutImg);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    await this.checkViewMode(this.settings.viewMode);
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

  private checkViewMode = async (viewMode: ViewMode) => {
    for (const key in ViewMode) {
      if (key == viewMode) {
        return;
      }
    }
    this.settings.viewMode = DEFAULT_VIEW_MODE;
    console.log('[%s] Reset view mode: %s', this.manifest.id, this.settings.viewMode);
    await this.saveSettings();
  }

  private addIcons = () => {
    for (const icon of ICONS) {
      addIcon(icon.id, icon.svg);
    }
  }

  private initContainerView = async (viewMode: ViewMode) => {
    switch (viewMode) {
      case ViewMode.Normal:
        this.containerView = new NormalContainerView(this, viewMode);
        break;
      case ViewMode.Pin:
        this.containerView = new PinContainerView(this, viewMode);
        break;
      default:
        this.settings.viewMode = ViewMode.Normal;
        console.log('[%s] Reset view mode: %s', this.manifest.id, ViewMode.Normal);
        await this.saveSettings();
        this.containerView = new NormalContainerView(this, viewMode);
        break;
    }
  }

  private switchViewMode = async (viewMode: ViewMode) => {
    this.containerView.removeOitContainerView();
    await this.initContainerView(viewMode);
  }

  public togglePinMode = (pinMode: boolean) => {
    this.containerView.removeOitContainerView();
    this.initContainerView(ViewMode.Pin);
  }

  public switchViewTrigger = () => {
    const viewImageInEditor = this.settings.viewImageInEditor; // .workspace-leaf-content[data-type='markdown'] img,.workspace-leaf-content[data-type='image'] img
    const viewImageInCPB = this.settings.viewImageInCPB; // .community-plugin-readme img
    const viewImageWithLink = this.settings.viewImageWithLink; // false: ... img:not(a img)
    const viewImageOther = this.settings.viewImageOther; // #sr-flashcard-view img

    if (this.imgSelector) {
      document.off('click', this.imgSelector, this.clickImage);
      document.off('mouseover', this.imgSelector, this.mouseoverImg);
      document.off('mouseout', this.imgSelector, this.mouseoutImg);
    }
    if (!viewImageOther && !viewImageInEditor && !viewImageInCPB && !viewImageWithLink) {
      return;
    }
    let selector = ``;
    if (viewImageInEditor) {
      selector += (viewImageWithLink ? VIEW_IMG_SELECTOR.EDITOR_AREAS : VIEW_IMG_SELECTOR.EDITOR_AREAS_NO_LINK);
    }
    if (viewImageInCPB) {
      selector += (1 < selector.length ? `,` : ``) + (viewImageWithLink ? VIEW_IMG_SELECTOR.CPB : VIEW_IMG_SELECTOR.CPB_NO_LINK);
    }
    if (viewImageOther) {
      selector += (1 < selector.length ? `,` : ``) + (viewImageWithLink ? VIEW_IMG_SELECTOR.OTHER : VIEW_IMG_SELECTOR.OTHER_NO_LINK);
    }

    if (selector) {
      // console.log('selector: ', selector);
      this.imgSelector = selector;
      document.on('click', this.imgSelector, this.clickImage);
      document.on('mouseover', this.imgSelector, this.mouseoverImg);
      document.on('mouseout', this.imgSelector, this.mouseoutImg);
    }
  }

  private clickImage = (event: MouseEvent) => {
    const targetEl = (<HTMLImageElement>event.target);
    // console.log('clickImage:', targetEl)
    //new Notice('clickImage');
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
    const viewImageInEditor = this.settings.viewImageInEditor; // .workspace-leaf-content[data-type='markdown'] img,.workspace-leaf-content[data-type='image'] img
    const viewImageInCPB = this.settings.viewImageInCPB; // .community-plugin-readme img
    const viewImageWithLink = this.settings.viewImageWithLink; // false: ... img:not(a img)
    const viewImageOther = this.settings.viewImageOther; // #sr-flashcard-view img

    if (this.imgSelector) {
      document.off('click', this.imgSelector, this.clickImage);
      document.off('mouseover', this.imgSelector, this.mouseoverImg);
      document.off('mouseout', this.imgSelector, this.mouseoutImg);
    }
    if (!viewImageOther && !viewImageInEditor && !viewImageInCPB && !viewImageWithLink) {
      return;
    }
    let selector = ``;
    if (viewImageInEditor) {
      selector += (viewImageWithLink ? VIEW_IMG_SELECTOR.EDITOR_AREAS : VIEW_IMG_SELECTOR.EDITOR_AREAS_NO_LINK);
    }
    if (viewImageInCPB) {
      selector += (1 < selector.length ? `,` : ``) + (viewImageWithLink ? VIEW_IMG_SELECTOR.CPB : VIEW_IMG_SELECTOR.CPB_NO_LINK);
    }
    if (viewImageOther) {
      selector += (1 < selector.length ? `,` : ``) + (viewImageWithLink ? VIEW_IMG_SELECTOR.OTHER : VIEW_IMG_SELECTOR.OTHER_NO_LINK);
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
