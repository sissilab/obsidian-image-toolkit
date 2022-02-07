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