import { App, PluginSettingTab, Setting } from 'obsidian';
import { t } from 'src/lang/helpers';
import type ImageToolkitPlugin from "src/main";


export interface ImageToolkitSettings {
    viewImageToggle: boolean
}

export const DEFAULT_SETTINGS: ImageToolkitSettings = {
    viewImageToggle: true
}

export class ImageToolkitSettingTab extends PluginSettingTab {
    plugin: ImageToolkitPlugin;

    constructor(app: App, plugin: ImageToolkitPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: t("IMAGE_TOOLKIT_SETTINGS_TITLE") });

        new Setting(containerEl)
            .setName(t("VIEW_IMAGE_TOGGLE_NAME"))
            .setDesc(t("VIEW_IMAGE_TOGGLE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.viewImageToggle)
                .onChange(async (value) => {
                    this.plugin.settings.viewImageToggle = value;
                    await this.plugin.saveSettings();
                }));

    }
}