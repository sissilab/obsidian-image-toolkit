import { Md5 } from 'md5-typescript';
import { IMG_GLOBAL_SETTINGS } from 'src/conf/settings';
import ImageToolkitPlugin from 'src/main';

export class GalleryImg {
    alt: string;
    src: string;
    name?: string;
    convert?: boolean;
    hash?: string;

    constructor();
    constructor(alt: string, src: string);
    constructor(alt?: string, src?: string) {
        this.alt = alt;
        this.src = src;
    }
}

export const parseMarkDown = (plugin: ImageToolkitPlugin, cm: CodeMirror.Editor, filePath: string): Array<GalleryImg> => {
    let line, lineText;
    let isCodeArea: boolean = false;
    let nonCodeAreaTextArr: Array<string>;
    let imgList = new Array<GalleryImg>();
    let img: GalleryImg;
    for (let i = 0, lastLine = cm.lastLine(); i <= lastLine; i++) {
        if (!(line = cm.lineInfo(i))) continue;
        if (!(lineText = line.text)) continue;
        if (lineText.startsWith('```')) { isCodeArea = !isCodeArea; continue; }
        if (isCodeArea) continue;

        if (nonCodeAreaTextArr = getNonCodeAreaText(lineText)) {
            for (const txt of nonCodeAreaTextArr) {
                if (img = parseAndExtractImg(txt, plugin, filePath)) imgList.push(img);
            }
        } else {
            if (img = parseAndExtractImg(lineText, plugin, filePath)) imgList.push(img);
        }
    }
    return imgList;
}

export const parseActiveViewData = (plugin: ImageToolkitPlugin, lines: string[], filePath: string): Array<GalleryImg> => {
    let imgList = new Array<GalleryImg>();
    if (!lines || 0 >= lines.length) return imgList;
    let lineText;
    let isCodeArea: boolean = false;
    let textArr: Array<string>;
    let img: GalleryImg;
    for (let i = 0, len = lines.length; i <= len; i++) {
        if (!(lineText = lines[i])) continue;
        // console.log((i + 1) + ' line: ' + lineText);
        if (lineText.startsWith('```')) { isCodeArea = !isCodeArea; continue; }
        if (isCodeArea) continue;

        if (textArr = getLineText(lineText)) {
            for (const text of textArr) {
                if (img = parseAndExtractImg(text, plugin, filePath)) imgList.push(img);
            }
        }
    }
    // console.log('parseMarkDown >>> imgList', imgList);
    return imgList;
}

const getLineText = (lineText: string): Array<string> => {
    let nonCodeAreaTextArr: Array<string> = getNonCodeAreaText(lineText);
    if (!nonCodeAreaTextArr) {
        nonCodeAreaTextArr = new Array<string>();
        nonCodeAreaTextArr.push(lineText);
    }
    if (IMG_GLOBAL_SETTINGS.galleryNavbarState) return nonCodeAreaTextArr;
    let textArr = new Array<string>();
    for (const txt of nonCodeAreaTextArr) {
        getNoMatchImgLinkText(txt, textArr);
    }
    return textArr;
}

const getNonCodeAreaText = (lineText: string): Array<string> => {
    const idx1 = lineText.indexOf('`');
    if (0 > idx1) return null;
    const idx2 = lineText.lastIndexOf('`');
    if (idx1 === idx2) return null;
    let textArr: Array<string> = new Array<string>();
    if (idx1 > 0) textArr.push(lineText.substring(0, idx1));
    if (lineText.length - 1 > idx2) textArr.push(lineText.substring(idx2 + 1));
    return textArr;
}


const IMAGE_LINK_REGEX1 = /\[\s*?(!\[(.*?)\]\((.*?)\))\s*?\]\(.*?\)/; // 1-link: [ ![alt1|alt2|...|altn|width](src) ](https://...)
const IMAGE_REGEX1 = /!\[(.*?)\]\((.*?)\)/; // 1: ![alt1|alt2|...|altn|width](src)

const IMAGE_LINK_REGEX2 = /\[\s*?(!\[\[(.*?[jpe?g|png|gif|svg|bmp].*?)\]\])\s*?\]\(.*?\)/i; // 2-link: [ ![[src|alt1|alt2|width]] ](https://...)
const IMAGE_REGEX2 = /!\[\[(.*?[jpe?g|png|gif|svg|bmp].*?)\]\]/i; // 2: ![[src|alt1|alt2|width]]

const SRC_LINK_REGEX = /[a-z][a-z0-9+\-.]+:\/.*/i; // match link: http://, file://, app:// 
const SRC_IMG_REGREX = /.*?\.jpe?g|png|gif|svg|bmp/i; // match image ext: .jpg/.jpeg/.png/.gif/.svg/.bmp

const IMG_TAG_LINK_SRC_REGEX = /<a.*?(<img.*?src=[\'"](.*?)[\'"].*?\/?>).*?\/a>/i; // 3-a-img-src: <a> <img ... src=''/> </a>
const IMG_TAG_SRC_REGEX = /<img.*?src=[\'"](.*?)[\'"].*?\/?>/i; // 3-img-src: <img ... src='' />
const IMG_TAG_ALT_REGEX = /<img.*?alt=[\'"](.*?)[\'"].*?\/?>/i; // 3-img-alt: <img ... alt='' />
const FULL_PATH_REGEX = /^[a-z]\:.*?[jpe?g|png|gif|svg|bmp]/i;

const extractImg = (lineText: string): GalleryImg => {
    let match;
    let matchFlag: boolean = false;
    let alt: string, src: string, width: string, name: string;
    let convert: boolean = false;
    if (match = lineText.match(IMAGE_REGEX1)) {  // 1: ![alt1|alt2|...|altn|width](src)
        if (!(src = match[2])) return null;
        if (SRC_LINK_REGEX.test(src)) { // 1.2: match link: http://, file://, app://local/
            if (src.startsWith('file://')) {
                src = src.replace(/^file:\/+/, 'app://local/');
            }
            matchFlag = true;
        } else if (SRC_IMG_REGREX.test(src)) { // 1.3: match image ext: .jpg/.jpeg/.png/.gif/.svg/.bmp
            const srcArr = src.split('/');
            if (srcArr && 0 < srcArr.length) {
                name = srcArr[srcArr.length - 1];
            }
            convert = true;
            matchFlag = true;
        }
        const altArr = (alt = match[1])?.split('\|'); // match[1] = alt1|alt2|...|altn|width
        if (altArr && 1 < altArr.length) {
            if (/\d+/.test(width = altArr[altArr.length - 1])) {
                alt = alt.substring(0, alt.length - width.length - 1);
            }
        }
        // console.log('IMAGE_REGEX1: ', match, 'alt=' + alt, 'src=' + src);
    } else if (match = lineText.match(IMAGE_REGEX2)) { // 2: ![[src|alt1|alt2|width]]
        const contentArr = match[1]?.split('|');
        if (contentArr && 0 < contentArr.length && (src = contentArr[0])) {
            const srcArr = src.split('/');
            if (srcArr && 0 < srcArr.length) {
                name = srcArr[srcArr.length - 1];
            }
            if (1 == contentArr.length) {
                alt = src;
            } else {
                alt = '';
                for (let i = 1; i < contentArr.length; i++) {
                    if (i == contentArr.length - 1 && /\d+/.test(width = contentArr[i])) break;
                    if (alt) alt += '|';
                    alt += contentArr[i];
                }
            }
            convert = true;
            matchFlag = true;
            // console.log('IMAGE_REGEX2: ', match, 'alt=' + alt, 'src=' + src);
        }
    } else if (match = lineText.match(IMG_TAG_SRC_REGEX)) { // 3: match img tag
        if (src = match[1]) {
            if (src.startsWith('file://')) {
                src = src.replace(/^file:\/+/, 'app://local/');
            } else if (FULL_PATH_REGEX.test(src)) {
                src = 'app://local/' + src;
            }
            alt = (match = lineText.match(IMG_TAG_ALT_REGEX)) ? match[1] : '';
            matchFlag = true;
        }
    }
    return matchFlag ? { alt, src, name, convert } : null;
}

const parseAndExtractImg = (lineText: string, plugin: ImageToolkitPlugin, filePath: string) => {
    let img: GalleryImg = extractImg(lineText);
    if (img) {
        if (img.convert) {
            const imageFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(img.src), filePath);
            img.src = imageFile ? plugin.app.vault.getResourcePath(imageFile) : '';
        }
        const hash = md5Img(img.alt, img.src);
        return { alt: img.alt, src: img.src, hash };
    }
    return null;
}

export const md5Img = (alt: string, src: string) => {
    return Md5.init((alt ? alt : '') + '_' + src);
}

const getNoMatchImgLinkText = (lineText: string, textArr: Array<string>) => {
    const match = matchImgLink(lineText);
    if (!match) {
        textArr.push(lineText);
        return;
    }
    if (0 < match.index) {
        textArr.push(lineText.substring(0, match.index));
    }
    const matchLen = match.index + 1 + match[0].length;
    if (lineText.length - 5 <= matchLen) return;
    getNoMatchImgLinkText(lineText.substring(matchLen - 1), textArr);
}

const matchImgLink = (lineText: string): RegExpMatchArray => {
    let match: RegExpMatchArray;
    // 1-link: [ ![alt1|alt2|...|altn|width](src) ](https://...)
    if (match = lineText.match(IMAGE_LINK_REGEX1)) return match;
    // 2-link: [ ![[src|alt1|alt2|width]] ](https://...)
    if (match = lineText.match(IMAGE_LINK_REGEX2)) return match;
    // 3-a-img-src: <a> <img ... src=''/> </a>
    if (match = lineText.match(IMG_TAG_LINK_SRC_REGEX)) return match;
    return null;
}
