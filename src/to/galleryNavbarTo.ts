import { FileCto } from "./commonTo";

export class GalleryImgCto {
    alt: string;
    src: string;
    name?: string;
    convert?: boolean;
    hash?: string;
    link?: boolean;
    match?: RegExpMatchArray;

    constructor();
    constructor(alt: string, src: string);
    constructor(alt?: string, src?: string) {
        this.alt = alt;
        this.src = src;
    }
}

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
