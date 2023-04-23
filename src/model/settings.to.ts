import {
  ViewMode
} from "../conf/constants";

/**
 * interface ts object: global settings
 */
export interface SettingsIto {
  viewMode: ViewMode;

  viewImageInEditor: boolean;
  // CPB = Community Plugins Browser
  viewImageInCPB: boolean;
  viewImageWithLink: boolean;
  viewImageOther: boolean;

  // PIN MODE
  pinMode: boolean;
  pinMaximum: number;
  pinCoverMode: boolean; // cover the earliest image which is being popped up

  // VIEW DETAIL
  imageMoveSpeed: number;
  imgTipToggle: boolean;
  imgFullScreenMode: string;
  imgViewBackgroundColor: string;

  imageBorderToggle: boolean;
  imageBorderWidth: string;
  imageBorderStyle: string;
  imageBorderColor: string;

  galleryNavbarToggle: boolean;
  galleryNavbarDefaultColor: string;
  galleryNavbarHoverColor: string;
  galleryImgBorderActive: boolean;
  galleryImgBorderActiveColor: string;

  // hotkeys conf
  moveTheImageHotkey: string;
  switchTheImageHotkey: string;
  doubleClickToolbar: string;
  viewTriggerHotkey: string;
}
