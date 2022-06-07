import {App, PluginSettingTab, Setting} from 'obsidian';
import {t} from 'src/lang/helpers';
import type ImageToolkitPlugin from "src/main";
import {
    GALLERY_IMG_BORDER_ACTIVE_COLOR,
    GALLERY_NAVBAR_DEFAULT_COLOR,
    GALLERY_NAVBAR_HOVER_COLOR,
    IMG_BORDER_COLOR,
    IMG_BORDER_STYLE,
    IMG_BORDER_WIDTH,
    IMG_DEFAULT_BACKGROUND_COLOR,
    IMG_FULL_SCREEN_MODE,
    MODIFIER_HOTKEYS,
    MOVE_THE_IMAGE,
    SWITCH_THE_IMAGE, TOOLBAR_CONF
} from './constants';
import Pickr from '@simonwep/pickr';
import {ImgSettingIto} from "../to/imgTo";

export const DEFAULT_SETTINGS: ImgSettingIto = {
    viewImageEditor: true,
    viewImageInCPB: true,
    viewImageWithALink: true,
    viewImageOther: true,

    pinMode: false,
    pinMaximum: 5,
    pinCoverMode: true, // cover the earliest image which is being popped up

    imageMoveSpeed: 10,
    imgTipToggle: true,
    imgFullScreenMode: IMG_FULL_SCREEN_MODE.FIT,
    imgViewBackgroundColor: IMG_DEFAULT_BACKGROUND_COLOR,

    imageBorderToggle: false,
    imageBorderWidth: IMG_BORDER_WIDTH.MEDIUM,
    imageBorderStyle: IMG_BORDER_STYLE.SOLID,
    imageBorderColor: IMG_BORDER_COLOR.RED,

    galleryNavbarToggle: false,
    galleryNavbarDefaultColor: GALLERY_NAVBAR_DEFAULT_COLOR,
    galleryNavbarHoverColor: GALLERY_NAVBAR_HOVER_COLOR,
    galleryImgBorderActive: false,
    galleryImgBorderActiveColor: GALLERY_IMG_BORDER_ACTIVE_COLOR,

    // hotkeys conf
    moveTheImageHotkey: MOVE_THE_IMAGE.DEFAULT_HOTKEY,
    switchTheImageHotkey: SWITCH_THE_IMAGE.DEFAULT_HOTKEY,
    doubleClickToolbar: TOOLBAR_CONF[3].class, // FULL_SCREEN
    viewTriggerHotkey: MODIFIER_HOTKEYS.NONE
}

export class ImageToolkitSettingTab extends PluginSettingTab {
    private plugin: ImageToolkitPlugin;

    constructor(app: App, plugin: ImageToolkitPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: t("IMAGE_TOOLKIT_SETTINGS_TITLE")});

        //region >>> VIEW_TRIGGER_SETTINGS
        containerEl.createEl('h3', {text: t("VIEW_TRIGGER_SETTINGS")});

        new Setting(containerEl)
            .setName(t("VIEW_IMAGE_EDITOR_NAME"))
            .setDesc(t("VIEW_IMAGE_EDITOR_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.viewImageEditor)
                .onChange(async (value) => {
                    this.plugin.settings.viewImageEditor = value;
                    this.plugin.toggleViewImage();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t("VIEW_IMAGE_IN_CPB_NAME"))
            .setDesc(t("VIEW_IMAGE_IN_CPB_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.viewImageInCPB)
                .onChange(async (value) => {
                    this.plugin.settings.viewImageInCPB = value;
                    this.plugin.toggleViewImage();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t("VIEW_IMAGE_WITH_A_LINK_NAME"))
            .setDesc(t("VIEW_IMAGE_WITH_A_LINK_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.viewImageWithALink)
                .onChange(async (value) => {
                    this.plugin.settings.viewImageWithALink = value;
                    this.plugin.toggleViewImage();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t("VIEW_IMAGE_OTHER_NAME"))
            .setDesc(t("VIEW_IMAGE_OTHER_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.viewImageOther)
                .onChange(async (value) => {
                    this.plugin.settings.viewImageOther = value;
                    this.plugin.toggleViewImage();
                    await this.plugin.saveSettings();
                }));
        //endregion

        //region >>> PIN_MODE_SETTINGS
        let pinMaximumSetting: Setting, pinCoverSetting: Setting;

        containerEl.createEl('h3', {text: t("PIN_MODE_SETTINGS")});

        new Setting(containerEl)
            .setName(t("PIN_MODE_NAME"))
            .setDesc(t("PIN_MODE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.pinMode)
                .onChange(async (value) => {
                    this.plugin.settings.pinMode = value;
                    this.switchSettingsDisabled(!value, pinMaximumSetting, pinCoverSetting);
                    this.plugin.togglePinMode(value);
                    await this.plugin.saveSettings();
                }));

        let pinMaximumScaleText: HTMLDivElement;
        pinMaximumSetting = new Setting(containerEl)
            .setName(t("PIN_MAXIMUM_NAME"))
            .addSlider(slider => slider
                .setLimits(1, 5, 1)
                .setValue(this.plugin.settings.pinMaximum)
                .onChange(async (value) => {
                    pinMaximumScaleText.innerText = " " + value.toString();
                    this.plugin.settings.pinMaximum = value;
                    this.plugin.containerView?.setPinMaximum(value);
                    this.plugin.saveSettings();
                }));
        pinMaximumSetting.settingEl.createDiv('', (el) => {
            pinMaximumScaleText = el;
            el.style.minWidth = "2.3em";
            el.style.textAlign = "right";
            el.innerText = " " + this.plugin.settings.pinMaximum.toString();
        });

        pinCoverSetting = new Setting(containerEl)
            .setName(t("PIN_COVER_NAME"))
            .setDesc(t("PIN_COVER_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.pinCoverMode)
                .onChange(async (value) => {
                    this.plugin.settings.pinCoverMode = value;
                    await this.plugin.saveSettings();
                }));

        this.switchSettingsDisabled(!this.plugin.settings.pinMode, pinMaximumSetting, pinCoverSetting);
        //endregion

        //region >>> VIEW_DETAILS_SETTINGS
        containerEl.createEl('h3', {text: t("VIEW_DETAILS_SETTINGS")});

        let imgMoveSpeedScaleText: HTMLDivElement;
        new Setting(containerEl)
            .setName(t("IMAGE_MOVE_SPEED_NAME"))
            .setDesc(t("IMAGE_MOVE_SPEED_DESC"))
            .addSlider(slider => slider
                .setLimits(1, 30, 1)
                .setValue(this.plugin.settings.imageMoveSpeed)
                .onChange(async (value) => {
                    imgMoveSpeedScaleText.innerText = " " + value.toString();
                    this.plugin.settings.imageMoveSpeed = value;
                    this.plugin.saveSettings();
                }))
            .settingEl.createDiv('', (el) => {
            imgMoveSpeedScaleText = el;
            el.style.minWidth = "2.3em";
            el.style.textAlign = "right";
            el.innerText = " " + this.plugin.settings.imageMoveSpeed.toString();
        });

        new Setting(containerEl)
            .setName(t("IMAGE_TIP_TOGGLE_NAME"))
            .setDesc(t("IMAGE_TIP_TOGGLE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.imgTipToggle)
                .onChange(async (value) => {
                    this.plugin.settings.imgTipToggle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t("IMG_FULL_SCREEN_MODE_NAME"))
            .addDropdown(async (dropdown) => {
                for (const key in IMG_FULL_SCREEN_MODE) {
                    // @ts-ignore
                    dropdown.addOption(key, t(key));
                }
                dropdown.setValue(this.plugin.settings.imgFullScreenMode);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.imgFullScreenMode = option;
                    await this.plugin.saveSettings();
                });
            });

        this.createPickrSetting(containerEl, 'IMG_VIEW_BACKGROUND_COLOR_NAME', IMG_DEFAULT_BACKGROUND_COLOR);
        //endregion

        //region >>> IMAGE_BORDER_SETTINGS
        containerEl.createEl('h3', {text: t("IMAGE_BORDER_SETTINGS")});

        new Setting(containerEl)
            .setName(t("IMAGE_BORDER_TOGGLE_NAME"))
            .setDesc(t("IMAGE_BORDER_TOGGLE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.imageBorderToggle)
                .onChange(async (value) => {
                    this.plugin.settings.imageBorderToggle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t("IMAGE_BORDER_WIDTH_NAME"))
            .addDropdown(async (dropdown) => {
                for (const key in IMG_BORDER_WIDTH) {
                    // @ts-ignore
                    dropdown.addOption(IMG_BORDER_WIDTH[key], t(key));
                }
                dropdown.setValue(this.plugin.settings.imageBorderWidth);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.imageBorderWidth = option;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(t("IMAGE_BORDER_STYLE_NAME"))
            .addDropdown(async (dropdown) => {
                for (const key in IMG_BORDER_STYLE) {
                    // @ts-ignore
                    dropdown.addOption(IMG_BORDER_STYLE[key], t(key));
                }
                dropdown.setValue(this.plugin.settings.imageBorderStyle);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.imageBorderStyle = option;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(t("IMAGE_BORDER_COLOR_NAME"))
            .addDropdown(async (dropdown) => {
                for (const key in IMG_BORDER_COLOR) {
                    // @ts-ignore
                    dropdown.addOption(IMG_BORDER_COLOR[key], t(key));
                }
                dropdown.setValue(this.plugin.settings.imageBorderColor);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.imageBorderColor = option;
                    await this.plugin.saveSettings();
                });
            });
        //endregion

        //region >>> GALLERY_NAVBAR_SETTINGS
        let galleryNavbarDefaultColorSetting: Setting, galleryNavbarHoverColorSetting: Setting,
            galleryImgBorderToggleSetting: Setting, galleryImgBorderActiveColorSetting: Setting;

        containerEl.createEl('h3', {text: t("GALLERY_NAVBAR_SETTINGS")});

        new Setting(containerEl)
            .setName(t("GALLERY_NAVBAR_TOGGLE_NAME"))
            .setDesc(t("GALLERY_NAVBAR_TOGGLE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.galleryNavbarToggle)
                .onChange(async (value) => {
                    this.plugin.settings.galleryNavbarToggle = value;
                    this.switchSettingsDisabled(!value, galleryNavbarDefaultColorSetting, galleryNavbarHoverColorSetting,
                        galleryImgBorderToggleSetting, galleryImgBorderActiveColorSetting);
                    await this.plugin.saveSettings();
                }));

        galleryNavbarDefaultColorSetting = this.createPickrSetting(containerEl, 'GALLERY_NAVBAR_DEFAULT_COLOR_NAME', GALLERY_NAVBAR_DEFAULT_COLOR);
        galleryNavbarHoverColorSetting = this.createPickrSetting(containerEl, 'GALLERY_NAVBAR_HOVER_COLOR_NAME', GALLERY_NAVBAR_HOVER_COLOR);

        galleryImgBorderToggleSetting = new Setting(containerEl)
            .setName(t("GALLERY_IMG_BORDER_TOGGLE_NAME"))
            .setDesc(t("GALLERY_IMG_BORDER_TOGGLE_DESC"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.galleryImgBorderActive)
                .onChange(async (value) => {
                    this.plugin.settings.galleryImgBorderActive = value;
                    await this.plugin.saveSettings();
                }));
        galleryImgBorderActiveColorSetting = this.createPickrSetting(containerEl, 'GALLERY_IMG_BORDER_ACTIVE_COLOR_NAME', GALLERY_IMG_BORDER_ACTIVE_COLOR);

        this.switchSettingsDisabled(!this.plugin.settings.galleryNavbarToggle, galleryNavbarDefaultColorSetting,
            galleryNavbarHoverColorSetting, galleryImgBorderToggleSetting, galleryImgBorderActiveColorSetting);
        //endregion

        //region >>> HOTKEYS_SETTINGS
        containerEl.createEl('h3', {text: t("HOTKEY_SETTINGS")});
        containerEl.createEl('p', {text: t("HOTKEY_SETTINGS_DESC")});

        if (this.plugin.settings.moveTheImageHotkey === this.plugin.settings.switchTheImageHotkey) {
            this.plugin.settings.moveTheImageHotkey = MOVE_THE_IMAGE.DEFAULT_HOTKEY;
        }
        const moveTheImageSetting = new Setting(containerEl)
            .setName(t("MOVE_THE_IMAGE_NAME"))
            .setDesc(t("MOVE_THE_IMAGE_DESC"))
            .addDropdown(async (dropdown) => {
                dropdown.addOptions(this.getDropdownOptions());
                dropdown.setValue(this.plugin.settings.moveTheImageHotkey);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.moveTheImageHotkey = option;
                    this.checkDropdownOptions(MOVE_THE_IMAGE.CODE, switchTheImageSetting);
                    await this.plugin.saveSettings();
                });
            }).then((setting) => {
                setting.controlEl.appendChild(createDiv('setting-editor-extra-setting-button hotkeys-settings-plus', (el) => {
                    el.innerHTML = "+";
                }));
                setting.controlEl.appendChild(createDiv('setting-editor-extra-setting-button', (el) => {
                    el.innerHTML = MOVE_THE_IMAGE.SVG;
                }));
            });

        if (this.plugin.settings.switchTheImageHotkey === this.plugin.settings.moveTheImageHotkey) {
            this.plugin.settings.switchTheImageHotkey = SWITCH_THE_IMAGE.DEFAULT_HOTKEY;
        }
        const switchTheImageSetting = new Setting(containerEl)
            .setName(t("SWITCH_THE_IMAGE_NAME"))
            .setDesc(t("SWITCH_THE_IMAGE_DESC"))
            .addDropdown(async (dropdown) => {
                dropdown.addOptions(this.getDropdownOptions());
                dropdown.setValue(this.plugin.settings.switchTheImageHotkey);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.switchTheImageHotkey = option;
                    this.checkDropdownOptions(SWITCH_THE_IMAGE.CODE, moveTheImageSetting);
                    await this.plugin.saveSettings();
                });
            }).then((setting) => {
                setting.controlEl.appendChild(createDiv('setting-editor-extra-setting-button hotkeys-settings-plus', (el) => {
                    el.innerHTML = "+";
                }));
                setting.controlEl.appendChild(createDiv('setting-editor-extra-setting-button', (el) => {
                    el.innerHTML = SWITCH_THE_IMAGE.SVG;
                }));
            });

        if (switchTheImageSetting) {
            this.checkDropdownOptions(MOVE_THE_IMAGE.CODE, switchTheImageSetting);
        }
        if (moveTheImageSetting) {
            this.checkDropdownOptions(SWITCH_THE_IMAGE.CODE, moveTheImageSetting);
        }

        new Setting(containerEl)
            .setName(t("DOUBLE_CLICK_TOOLBAR_NAME"))
            .addDropdown(async (dropdown) => {
                for (const conf of TOOLBAR_CONF) {
                    if (!conf.enableHotKey) continue;
                    // @ts-ignore
                    dropdown.addOption(conf.class, t(conf.title));
                }
                dropdown.setValue(this.plugin.settings.doubleClickToolbar);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.doubleClickToolbar = option;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(t("VIEW_TRIGGER_HOTKEY_NAME"))
            .setDesc(t("VIEW_TRIGGER_HOTKEY_DESC"))
            .addDropdown(async (dropdown) => {
                dropdown.addOptions(this.getDropdownOptions());
                dropdown.setValue(this.plugin.settings.viewTriggerHotkey);
                dropdown.onChange(async (option) => {
                    this.plugin.settings.viewTriggerHotkey = option;
                    await this.plugin.saveSettings();
                });
            });
        //endregion

    }

    switchSettingsDisabled(disabled: boolean, ...settings: Setting[]) {
        for (const setting of settings) {
            setting?.setDisabled(disabled)
        }
    }

    createPickrSetting(containerEl: HTMLElement, name: string, defaultColor: string): Setting {
        let pickrDefault: string;
        if ('GALLERY_NAVBAR_DEFAULT_COLOR_NAME' === name) {
            pickrDefault = this.plugin.settings.galleryNavbarDefaultColor;
        } else if ('GALLERY_NAVBAR_HOVER_COLOR_NAME' === name) {
            pickrDefault = this.plugin.settings.galleryNavbarHoverColor;
        } else if ('GALLERY_IMG_BORDER_ACTIVE_COLOR_NAME' === name) {
            pickrDefault = this.plugin.settings.galleryImgBorderActiveColor;
        } else if ('IMG_VIEW_BACKGROUND_COLOR_NAME' === name) {
            pickrDefault = this.plugin.settings.imgViewBackgroundColor;
        } else {
            pickrDefault = defaultColor;
        }

        let pickr: Pickr;
        return new Setting(containerEl)
            // @ts-ignore
            .setName(t(name))
            .then((setting) => {
                pickr = Pickr.create({
                    el: setting.controlEl.createDiv({cls: "picker"}),
                    theme: 'nano',
                    position: "left-middle",
                    lockOpacity: false, // If true, the user won't be able to adjust any opacity.
                    default: pickrDefault, // Default color
                    swatches: [], // Optional color swatches
                    components: {
                        preview: true,
                        hue: true,
                        opacity: true,
                        interaction: {
                            hex: true,
                            rgba: true,
                            hsla: false,
                            input: true,
                            cancel: true,
                            save: true,
                        },
                    }
                })
                    .on('show', (color: Pickr.HSVaColor, instance: Pickr) => { // Pickr got opened
                        if (!this.plugin.settings.galleryNavbarToggle) pickr?.hide();
                        const {result} = (pickr.getRoot() as any).interaction;
                        requestAnimationFrame(() =>
                            requestAnimationFrame(() => result.select())
                        );
                    })
                    .on('save', (color: Pickr.HSVaColor, instance: Pickr) => { // User clicked the save / clear button
                        if (!color) return;
                        instance.hide();
                        const savedColor = color.toHEXA().toString();
                        instance.addSwatch(savedColor);
                        this.setAndSavePickrSetting(name, savedColor);
                    })
                    .on('cancel', (instance: Pickr) => { // User clicked the cancel button
                        instance.hide();
                    })
            })
            .addExtraButton((btn) => {
                btn.setIcon("reset")
                    .onClick(() => {
                        pickr.setColor(defaultColor);
                        this.setAndSavePickrSetting(name, defaultColor);
                    })
                    .setTooltip('restore default color');
            });
    }

    setAndSavePickrSetting(name: string, savedColor: string): void {
        if ('GALLERY_NAVBAR_DEFAULT_COLOR_NAME' === name) {
            this.plugin.settings.galleryNavbarDefaultColor = savedColor;
        } else if ('GALLERY_NAVBAR_HOVER_COLOR_NAME' === name) {
            this.plugin.settings.galleryNavbarHoverColor = savedColor;
        } else if ('GALLERY_IMG_BORDER_ACTIVE_COLOR_NAME' === name) {
            this.plugin.settings.galleryImgBorderActiveColor = savedColor;
        } else if ('IMG_VIEW_BACKGROUND_COLOR_NAME' === name) {
            this.plugin.settings.imgViewBackgroundColor = savedColor;
            this.plugin.containerView?.setImgViewDefaultBackgroundForImgList();
        }
        this.plugin.saveSettings();
    }

    getDropdownOptions(): Record<string, string> {
        let options: Record<string, string> = {};
        for (const key in MODIFIER_HOTKEYS) {
            //@ts-ignore
            options[key] = t(key);
        }
        return options;
    }

    checkDropdownOptions(code: string, setting: Setting): void {
        if (!setting || !setting.controlEl) return;
        const optionElList: HTMLCollectionOf<HTMLOptionElement> = setting.controlEl.getElementsByClassName('dropdown')[0].getElementsByTagName('option');
        for (let i = 0, size = optionElList.length; i < size; i++) {
            if (code === MOVE_THE_IMAGE.CODE) {
                optionElList[i].disabled = optionElList[i].value === this.plugin.settings.moveTheImageHotkey;
            } else if (code === SWITCH_THE_IMAGE.CODE) {
                optionElList[i].disabled = optionElList[i].value === this.plugin.settings.switchTheImageHotkey;
            }
        }
    }

}