import { addIcon, Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, ImageToolkitSettingTab } from './conf/settings'
import {DEFAULT_VIEW_MODE, ICONS, MOVE_THE_IMAGE, SWITCH_THE_IMAGE, VIEW_IMG_SELECTOR, ViewMode} from './conf/constants'
import { NormalContainerView } from './ui/container/normalContainer.view';
import { PinContainerView } from './ui/container/pinContainer.view';
import { ContainerView } from "./ui/container/container.view";
import { SettingsIto } from "./model/settings.to";
import { ContainerFactory } from "./factory/containerFactory";
import { randomUUID } from "crypto";

export default class ImageToolkitPlugin extends Plugin {

  public settings: SettingsIto;

  private readonly containerFactory = new ContainerFactory();

  public imgSelector: string = ``;

  private static readonly IMG_ORIGIN_CURSOR = 'data-oit-origin-cursor';

  // data-oit-event: 标识new window是否已addEventListener for click
  private static readonly POPOUT_WINDOW_EVENT = 'data-oit-event';

  private readonly registeredDocs = new Set<Document>();

  async onload() {
    console.log('loading %s plugin v%s ...', this.manifest.id, this.manifest.version);

    await this.loadSettings();

    this.addSettingTab(new ImageToolkitSettingTab(this.app, this));

    // this.registerCommands();

    await this.initContainer(this.settings.viewMode);

    this.refreshViewTrigger();

    // addEventListener for opened new windows
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
        if (['markdown', 'image', 'bases', 'canvas'].includes(leaf.getViewState()?.type)) {
          const bodyEl = leaf.view.containerEl.matchParent('body');
          if (bodyEl?.hasClass('is-popout-window')) {
            if (!bodyEl.hasAttribute(ImageToolkitPlugin.POPOUT_WINDOW_EVENT)) {
              console.log('popout leaf:', leaf, leaf.getDisplayText());
              const eventId = randomUUID();
              this.initContainer(this.settings.viewMode, eventId);
              bodyEl.setAttr(ImageToolkitPlugin.POPOUT_WINDOW_EVENT, eventId);
              this.refreshViewTrigger(bodyEl.ownerDocument);
            }
          }
        }
      });
    }));
  }

  onunload() {
    console.log('unloading ' + this.manifest.id + ' plugin...');
    this.getAllContainerViews().forEach(container => {
      container.removeOitContainerView();
    });
    this.containerFactory.clearAll();
    for (const d of this.registeredDocs) {
      d.removeEventListener('click', this.clickImage, true);
      if (this.imgSelector) {
        d.off('click', this.imgSelector, this.clickImage);
        d.off('mouseover', this.imgSelector, this.mouseoverImg);
        d.off('mouseout', this.imgSelector, this.mouseoutImg);
      }
    }
    this.registeredDocs.clear();
  }

  private async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    await this.checkViewMode(this.getViewMode());
    await this.addIcons();
  }

  public async saveSettings() {
    await this.saveData(this.settings);
  }

  private addIcons = async () => {
    for (const icon of ICONS) {
      addIcon(icon.id, icon.svg);
    }
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

  public getViewMode = (): ViewMode => {
    return this.settings.viewMode;
  }
  public setViewMode = (viewMode: ViewMode) => {
    return this.settings.viewMode = viewMode;
  }

  private checkViewMode = async (viewMode: ViewMode) => {
    for (const key in ViewMode) {
      if (key == viewMode) {
        return;
      }
    }
    this.setViewMode(DEFAULT_VIEW_MODE)
    console.log('[oit] Reset view mode: %s', DEFAULT_VIEW_MODE);
    await this.saveSettings();
  }

  public getAllContainerViews = (): ContainerView[] => {
    return this.containerFactory.getAllContainers();
  }

  private initContainer = async (viewMode: ViewMode, popoutWindowEventId?: string) => {
    const container = await this.initContainerByViewMode(viewMode);
    if (!container) {
      console.error('[oit] Cannot init container');
      return;
    }
    if (popoutWindowEventId) {
      // popoutWindowEventId will be recorded into data-oit-event'of body tag
      this.containerFactory.setPopoutContainer(popoutWindowEventId, container);
    } else {
      this.containerFactory.setMainContainer(container);
    }
  }

  private initContainerByViewMode = async (viewMode: ViewMode, fromDefault?: boolean): Promise<ContainerView> => {
    switch (viewMode) {
      case ViewMode.Normal:
        return new NormalContainerView(this);
      case ViewMode.Pin:
        return new PinContainerView(this);
      default:
        if (fromDefault) {
          return null;
        }
        this.setViewMode(viewMode = DEFAULT_VIEW_MODE);
        await this.saveSettings();
        console.log('[oit] Reset view mode to: %s', viewMode);
        return this.initContainerByViewMode(viewMode, true);
    }
  }

  private isImageElement = (imgEl: HTMLImageElement): boolean => {
    return imgEl && 'IMG' === imgEl.tagName;
  }

  private resolveTargetImg = (rawTarget: EventTarget | null): HTMLImageElement => {
    if (!rawTarget || !(rawTarget instanceof Element)) {
      return null;
    }
    if (rawTarget.closest('.oit')) {
      return null;
    }
    if (this.isImageElement(rawTarget as HTMLImageElement)) {
      if (this.imgSelector && rawTarget.matches(this.imgSelector)) {
        return rawTarget as HTMLImageElement;
      }
      return null;
    }
    // Support Obsidian 1.15+ native hover zoom button (.image-embed .embed-actions .clickable-icon)
    if (this.settings.viewImageInEditor) {
      const actionBtn = rawTarget.closest('.image-embed .embed-actions .clickable-icon:not(.edit-block-button)');
      if (actionBtn) {
        const embedEl = actionBtn.closest('.image-embed');
        const imgEl = embedEl ? embedEl.querySelector('img') as HTMLImageElement : null;
        if (imgEl && (!this.imgSelector || imgEl.matches(this.imgSelector))) {
          return imgEl;
        }
      }
    }
    return null;
  }

  private isClickable = (targetEl: HTMLImageElement, event: MouseEvent): ContainerView => {
    let container: ContainerView;
    if (this.isImageElement(targetEl)
      && (container = this.containerFactory.getContainer(targetEl))
      && container.checkHotkeySettings(event, this.settings.viewTriggerHotkey)) {
      return container;
    }
    return null;
  }

  public switchViewMode = async (viewMode: ViewMode) => {
    this.settings.viewMode = viewMode;
    await this.saveSettings();
    this.getAllContainerViews().forEach(container => {
      container.removeOitContainerView();
      this.initContainer(viewMode, container.getParentContainerEl()?.getAttribute('data-oit-event'));
    });
  }

  /**
   * refresh events for main container
   */
  public refreshViewTrigger = (doc?: Document) => {
    const viewImageInEditor = this.settings.viewImageInEditor;
    const viewImageInCPB = this.settings.viewImageInCPB;
    const viewImageWithLink = this.settings.viewImageWithLink;
    const viewImageOther = this.settings.viewImageOther;

    if (!doc) {
      doc = document;
    }
    this.registeredDocs.add(doc);
    for (const d of this.registeredDocs) {
      d.removeEventListener('click', this.clickImage, true);
      if (this.imgSelector) {
        d.off('click', this.imgSelector, this.clickImage);
        d.off('mouseover', this.imgSelector, this.mouseoverImg);
        d.off('mouseout', this.imgSelector, this.mouseoutImg);
      }
    }
    if (!viewImageOther && !viewImageInEditor && !viewImageInCPB && !viewImageWithLink) {
      this.imgSelector = '';
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
      this.imgSelector = selector;
      for (const d of this.registeredDocs) {
        d.addEventListener('click', this.clickImage, true);
        d.off('mouseover', this.imgSelector, this.mouseoverImg);
        d.on('mouseover', this.imgSelector, this.mouseoverImg);
        d.off('mouseout', this.imgSelector, this.mouseoutImg);
        d.on('mouseout', this.imgSelector, this.mouseoutImg);
      }
    }
  }

  private clickImage = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    const targetEl = this.resolveTargetImg(event.target);
    if (!targetEl) {
      return;
    }
    let container: ContainerView = this.isClickable(targetEl, event);
    if (container) {
      // Prevent Obsidian 1.15+ native image selection and native .lightbox from firing
      event.preventDefault();
      if (!targetEl.closest('a')) {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      container.renderContainer(targetEl);
    }
  }

  private mouseoverImg = (event: MouseEvent) => {
    const targetEl = (<HTMLImageElement>event.target);
    if (!this.isClickable(targetEl, event)) {
      return;
    }
    if (null == targetEl.getAttribute(ImageToolkitPlugin.IMG_ORIGIN_CURSOR)) {
      targetEl.setAttribute(ImageToolkitPlugin.IMG_ORIGIN_CURSOR, targetEl.style.cursor || '');
    }
    targetEl.style.cursor = 'zoom-in';
  }

  private mouseoutImg = (event: MouseEvent) => {
    const targetEl = (<HTMLImageElement>event.target);
    if (!this.isClickable(targetEl, event)) {
      return;
    }
    targetEl.style.cursor = targetEl.getAttribute(ImageToolkitPlugin.IMG_ORIGIN_CURSOR);
  }

}
