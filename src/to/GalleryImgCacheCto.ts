import { FileCto } from "./FileCto";
import { GalleryImgCto } from "./GalleryImgCto";

export class GalleryImgCacheCto {
    file: FileCto;
    galleryImgList: Array<GalleryImgCto>;
    mtime: number;

    constructor();
    constructor(file: FileCto, galleryImgList: Array<GalleryImgCto>, mtime: number);
    constructor(file?: FileCto, galleryImgList?: Array<GalleryImgCto>, mtime?: number) {
        this.file = file;
        this.galleryImgList = galleryImgList;
        this.mtime = mtime;
    }
}