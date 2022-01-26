
/**
 * typescript object of interface for defining image's settings
 */
export interface ImgSettingIto {
    viewImageGlobal: boolean;
    viewImageEditor: boolean;
    // @Deprecated
    viewImageToggle: boolean;
    viewImageInCPB: boolean;
    viewImageWithALink: boolean;

    imageMoveSpeed: number;
    imgTipToggle: boolean;
    imgFullScreenMode: string;

    imageBorderToggle: boolean;
    imageBorderWidth: string;
    imageBorderStyle: string;
    imageBorderColor: string;
}
