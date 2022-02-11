
/**
 * typescript object of interface for defining image's settings
 */
export interface ImgSettingIto {
    // viewImageGlobal: boolean; // @Deprecated
    viewImageEditor: boolean;
    viewImageInCPB: boolean;
    viewImageWithALink: boolean;
    viewImageOther: boolean;

    imageMoveSpeed: number;
    imgTipToggle: boolean;
    imgFullScreenMode: string;

    imageBorderToggle: boolean;
    imageBorderWidth: string;
    imageBorderStyle: string;
    imageBorderColor: string;

    galleryNavbarToggle: boolean;
}
