import {App, PluginSettingTab, sanitizeHTMLToDom, setIcon, Setting} from 'obsidian';
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
  SWITCH_THE_IMAGE,
  TOOLBAR_CONF,
  ViewMode
} from './constants';
import {SettingsIto} from "../model/settings.to";


export const DEFAULT_SETTINGS: SettingsIto = {
  viewMode: ViewMode.Normal,

  viewImageInEditor: true,
  viewImageInCPB: true,
  viewImageWithLink: true,
  viewImageOther: true,

  // pinMode: false,
  pinMaximum: 3,
  pinCoverMode: true, // cover the earliest image which is being popped up

  imageMoveSpeed: 10,
  imgTipToggle: true,
  imgFullScreenMode: IMG_FULL_SCREEN_MODE.FIT,
  imgViewBackgroundColor: IMG_DEFAULT_BACKGROUND_COLOR,

  imageBorderToggle: false,
  imageBorderWidth: IMG_BORDER_WIDTH.MEDIUM,
  imageBorderStyle: IMG_BORDER_STYLE.SOLID,
  imageBorderColor: IMG_BORDER_COLOR.RED,

  galleryNavbarToggle: true,
  galleryNavbarDefaultColor: GALLERY_NAVBAR_DEFAULT_COLOR,
  galleryNavbarHoverColor: GALLERY_NAVBAR_HOVER_COLOR,
  galleryImgBorderActive: true,
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

    // Common Settings:
    this.displayCommonSettings(containerEl);

    // View Trigger Settings:
    this.displayViewTriggerSettings(containerEl);

    // Pin Mode Settings:
    this.displayPinModeSettings(containerEl);

    //region >>> VIEW_DETAILS_SETTINGS
    new Setting(containerEl).setName(t("VIEW_DETAILS_SETTINGS")).setHeading();

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

    const toHex6 = (c: string) => (typeof c === 'string' && /^#[0-9a-fA-F]{8}$/.test(c) ? c.slice(0, 7) : c);
    new Setting(containerEl)
        .setName(t("IMG_VIEW_BACKGROUND_COLOR_NAME"))
        .addColorPicker(picker => {
           picker
               .setValue(toHex6(this.plugin.settings.imgViewBackgroundColor || DEFAULT_SETTINGS.imgViewBackgroundColor))

               .onChange(async(value) => {
                   this.plugin.settings.imgViewBackgroundColor = value;
                   this.plugin.getAllContainerViews().forEach(container => container.setImgViewDefaultBackgroundForImgList());
                   await this.plugin.saveSettings();
               });
        })
        .addExtraButton(button => {
            button.setIcon('rotate-ccw')
                .setTooltip(t('RESET'))
                .onClick(async () => {
                   this.plugin.settings.imgViewBackgroundColor = DEFAULT_SETTINGS.imgViewBackgroundColor;
                   this.plugin.getAllContainerViews().forEach(container => container.setImgViewDefaultBackgroundForImgList());
                   await this.plugin.saveSettings();
                   this.display();
                });
        });
    //endregion

    //region >>> IMAGE_BORDER_SETTINGS
    new Setting(containerEl).setName(t("IMAGE_BORDER_SETTINGS")).setHeading();

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
    //let galleryNavbarDefaultColorSetting: Setting, galleryNavbarHoverColorSetting: Setting,
    // galleryImgBorderToggleSetting: Setting, galleryImgBorderActiveColorSetting: Setting;

    new Setting(containerEl).setName(t("GALLERY_NAVBAR_SETTINGS")).setHeading();

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

      const galleryNavbarDefaultColorSetting = new Setting(containerEl)
          .setName(t("GALLERY_NAVBAR_DEFAULT_COLOR_NAME"))
          .addColorPicker(picker => {
              picker
                  .setValue(toHex6(this.plugin.settings.galleryNavbarDefaultColor || DEFAULT_SETTINGS.galleryNavbarDefaultColor))
                  .onChange(async (value) => {
                      this.plugin.settings.galleryNavbarDefaultColor = value;
                      await this.plugin.saveSettings();
                  });
          })
          .addExtraButton(button => {
              button.setIcon('rotate-ccw')
                  .setTooltip(t('RESET'))
                  .onClick(async () => {
                      this.plugin.settings.galleryNavbarDefaultColor = DEFAULT_SETTINGS.galleryNavbarDefaultColor;
                      await this.plugin.saveSettings();
                      this.display();
                  });
          });

    const galleryNavbarHoverColorSetting = new Setting(containerEl)
        .setName(t("GALLERY_NAVBAR_HOVER_COLOR_NAME"))
        .addColorPicker(picker => {
           picker
               .setValue(toHex6(this.plugin.settings.galleryNavbarHoverColor || DEFAULT_SETTINGS.galleryNavbarHoverColor))
               .onChange(async (value) => {
                  this.plugin.settings.galleryNavbarHoverColor = value;
                  await this.plugin.saveSettings();
               });
        })
        .addExtraButton(button => {
            button.setIcon('rotate-ccw')
                .setTooltip(t('RESET'))
                .onClick(async () => {
                    this.plugin.settings.galleryNavbarHoverColor = DEFAULT_SETTINGS.galleryNavbarHoverColor;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

    const galleryImgBorderToggleSetting = new Setting(containerEl)
      .setName(t("GALLERY_IMG_BORDER_TOGGLE_NAME"))
      .setDesc(t("GALLERY_IMG_BORDER_TOGGLE_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.galleryImgBorderActive)
        .onChange(async (value) => {
          this.plugin.settings.galleryImgBorderActive = value;
          await this.plugin.saveSettings();
        }));

    const galleryImgBorderActiveColorSetting = new Setting(containerEl)
        .setName(t("GALLERY_IMG_BORDER_ACTIVE_COLOR_NAME"))
        .addColorPicker(picker => {
           picker.setValue(toHex6(this.plugin.settings.galleryImgBorderActiveColor || DEFAULT_SETTINGS.galleryImgBorderActiveColor))
               .onChange(async (value) => {
                   this.plugin.settings.galleryImgBorderActiveColor = value;
                   await this.plugin.saveSettings();
               });
        })
        .addExtraButton(button => {
            button.setIcon('rotate-ccw')
                .setTooltip(t('RESET'))
                .onClick(async () => {
                    this.plugin.settings.galleryImgBorderActiveColor = DEFAULT_SETTINGS.galleryImgBorderActiveColor;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

    this.switchSettingsDisabled(!this.plugin.settings.galleryNavbarToggle, galleryNavbarDefaultColorSetting,
      galleryNavbarHoverColorSetting, galleryImgBorderToggleSetting, galleryImgBorderActiveColorSetting);
    //endregion

    //region >>> HOTKEYS_SETTINGS
    new Setting(containerEl).setName(t("HOTKEY_SETTINGS")).setDesc(t("HOTKEY_SETTINGS_DESC")).setHeading();

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
          setting.addExtraButton(button => {
             button.setIcon('plus').setDisabled(true)
          });
        setting.controlEl.appendChild(sanitizeHTMLToDom(MOVE_THE_IMAGE.SVG));
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
          setting.addExtraButton(button => {
              button.setIcon('plus').setDisabled(true);
          });
          setting.controlEl.appendChild(sanitizeHTMLToDom(SWITCH_THE_IMAGE.SVG));

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

  private displayCommonSettings(containerEl: HTMLElement) {

    new Setting(containerEl)
      .setName(t("VIEW_MODE_NAME"))
      .addDropdown(async (dropdown) => {
        for (const key in ViewMode) {
          // @ts-ignore
          dropdown.addOption(key, t('VIEW_MODE_' + key.toUpperCase()));
        }
        dropdown.setValue(this.plugin.settings.viewMode);
        dropdown.onChange(async (option: ViewMode) => {
          await this.plugin.switchViewMode(option);
        });
      });
  }

  private displayViewTriggerSettings(containerEl: HTMLElement) {
    new Setting(containerEl).setName(t("VIEW_TRIGGER_SETTINGS")).setHeading();

    new Setting(containerEl)
      .setName(t("VIEW_IMAGE_IN_EDITOR_NAME"))
      .setDesc(t("VIEW_IMAGE_IN_EDITOR_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.viewImageInEditor)
        .onChange(async (value) => {
          this.plugin.settings.viewImageInEditor = value;
          this.plugin.refreshViewTrigger();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("VIEW_IMAGE_IN_CPB_NAME"))
      .setDesc(t("VIEW_IMAGE_IN_CPB_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.viewImageInCPB)
        .onChange(async (value) => {
          this.plugin.settings.viewImageInCPB = value;
          this.plugin.refreshViewTrigger();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("VIEW_IMAGE_WITH_A_LINK_NAME"))
      .setDesc(t("VIEW_IMAGE_WITH_A_LINK_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.viewImageWithLink)
        .onChange(async (value) => {
          this.plugin.settings.viewImageWithLink = value;
          this.plugin.refreshViewTrigger();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("VIEW_IMAGE_OTHER_NAME"))
      .setDesc(t("VIEW_IMAGE_OTHER_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.viewImageOther)
        .onChange(async (value) => {
          this.plugin.settings.viewImageOther = value;
          this.plugin.refreshViewTrigger();
          await this.plugin.saveSettings();
        }));
  }

  private displayPinModeSettings(containerEl: HTMLElement) {
    //region >>> PIN_MODE_SETTINGS
    let pinMaximumSetting: Setting,
      pinCoverSetting: Setting;

    new Setting(containerEl).setName(t("PIN_MODE_SETTINGS")).setHeading();

    /*new Setting(containerEl)
      .setName(t("PIN_MODE_NAME"))
      .setDesc(t("PIN_MODE_DESC"))
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.pinMode)
        .onChange(async (value) => {
          this.plugin.settings.pinMode = value;
          this.switchSettingsDisabled(!value, pinMaximumSetting, pinCoverSetting);
          //this.plugin.togglePinMode(value);
          await this.plugin.saveSettings();
        }));*/

    let pinMaximumScaleText: HTMLDivElement;
    pinMaximumSetting = new Setting(containerEl)
      .setName(t("PIN_MAXIMUM_NAME"))
      .addSlider(slider => slider
        .setLimits(1, 5, 1)
        .setValue(this.plugin.settings.pinMaximum)
        .onChange(async (value) => {
          pinMaximumScaleText.innerText = " " + value.toString();
          this.plugin.settings.pinMaximum = value;
          // this.plugin.containerView?.setPinMaximum(value);
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

    //this.switchSettingsDisabled(!this.plugin.settings.pinMode, pinMaximumSetting, pinCoverSetting);
    //endregion
  }


  switchSettingsDisabled(disabled: boolean, ...settings: Setting[]) {
    for (const setting of settings) {
      setting?.setDisabled(disabled)
    }
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
