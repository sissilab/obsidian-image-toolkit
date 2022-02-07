import { Md5 } from 'md5-typescript';
import { TFile } from 'obsidian';
import ImageToolkitPlugin from 'src/main';
import { FileCto } from 'src/to/FileCto';
import { GalleryImgCacheCto } from 'src/to/GalleryImgCacheCto';
import { GalleryImgCto } from 'src/to/GalleryImgCto';


/* // const imgList: Array<GalleryImg> = parseMarkDown(plugin, activeView.sourceMode?.cmEditor, activeView.file.path);
export const parseMarkDown = (plugin: ImageToolkitPlugin, cm: CodeMirror.Editor, filePath: string) => {
    let line, lineText;
    for (let i = 0, lastLine = cm.lastLine(); i <= lastLine; i++) {
        if (!(line = cm.lineInfo(i))) continue;
        if (!(lineText = line.text)) continue;
        console.debug((i + 1) + ' line: ' + lineText);
    }
} */

export const parseActiveViewData = (plugin: ImageToolkitPlugin, lines: string[], file: TFile): GalleryImgCacheCto => {
    if (!lines || 0 >= lines.length) return null;
    let lineText: string;
    let isCodeArea: boolean = false;
    let textArr: Array<string>;
    const imgList: Array<GalleryImgCto> = new Array<GalleryImgCto>();
    for (let i = 0, len = lines.length; i < len; i++) {
        if (!(lineText = lines[i])) continue;
        // console.log((i + 1) + ' line: ' + lineText);
        if (lineText.startsWith('```')) { isCodeArea = !isCodeArea; continue; }
        if (isCodeArea) continue;
        if (textArr = getNonCodeAreaTexts(lineText)) {
            for (const text of textArr) {
                extractImage(text, imgList);
            }
        } else {
            extractImage(lineText, imgList);
        }
    }
    const filePath: string = file.path;
    for (let i = 0, len = imgList.length; i < len; i++) {
        const img = imgList[i];
        if (img.convert) {
            const imageFile = plugin.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(img.src), filePath);
            img.src = imageFile ? plugin.app.vault.getResourcePath(imageFile) : '';
        }
        img.hash = md5Img(img.alt, img.src);
        img.match = null;
        img.name = null;
    }
    return new GalleryImgCacheCto(new FileCto(file.path, file.stat.ctime, file.stat.mtime), imgList, new Date().getTime());
}

const getNonCodeAreaTexts = (lineText: string): string[] => {
    let textArr: string[] = [];
    const idx1 = lineText.indexOf('`');
    if (0 > idx1) return null;
    const idx2 = lineText.lastIndexOf('`');
    if (idx1 === idx2) return null;
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

const IMG_MATCH_MIN_LEN: number = 7;

const extractImage = (text: string, imgList: Array<GalleryImgCto>) => {
    let img: GalleryImgCto;
    if (!(img = matchImage1(text))) {
        if (!(img = matchImage2(text))) {
            if (!(img = matchImageTag(text))) {
                return;
            }
        }
    }
    imgList.push(img);
    if (img.match) {
        const idx = img.match.index + img.match[0].length
        if (idx > text.length - IMG_MATCH_MIN_LEN) return;
        extractImage(text.substring(idx), imgList);
    }
}

/**
 * ![alt1|alt2|...|altn|width](src)
 * @param text 
 * @returns 
 */
const matchImage1 = (text: string): GalleryImgCto => {
    let match: RegExpMatchArray = text.match(IMAGE_LINK_REGEX1); // 1-link: [ ![alt1|alt2|...|altn|width](src) ](https://...)
    let link: boolean = false;
    let alt: string, src: string;
    if (match) {
        link = true;
        alt = match[2];
        src = match[3];
    } else {
        match = text.match(IMAGE_REGEX1); // 1: ![alt1|alt2|...|altn|width](src)
        if (match) {
            if (alt = match[1]) {
                if (0 <= alt.indexOf('[') && 0 <= alt.indexOf(']')) return;
            }
            src = match[2];
        }
    }
    if (!match) return null;
    const img: GalleryImgCto = new GalleryImgCto();
    img.link = link;
    img.match = match;
    img.alt = alt;
    img.src = src;
    let width: string;
    if (img.src) {
        if (SRC_LINK_REGEX.test(img.src)) { // 1.2: match link: http://, file://, app://local/
            if (img.src.startsWith('file://')) {
                img.src = img.src.replace(/^file:\/+/, 'app://local/');
            }
        } else if (SRC_IMG_REGREX.test(img.src)) { // 1.3: match image ext: .jpg/.jpeg/.png/.gif/.svg/.bmp
            const srcArr = img.src.split('/');
            if (srcArr && 0 < srcArr.length) {
                img.name = srcArr[srcArr.length - 1];
            }
            img.convert = true;
        }
    }
    const altArr = img.alt?.split('\|'); // match[1] = alt1|alt2|...|altn|width
    if (altArr && 1 < altArr.length) {
        if (/\d+/.test(width = altArr[altArr.length - 1])) {
            img.alt = img.alt.substring(0, img.alt.length - width.length - 1);
        }
    }
    return img;
}

/**
 * ![[src|alt1|alt2|width]]
 * @param text 
 * @returns 
 */
const matchImage2 = (text: string): GalleryImgCto => {
    let match: RegExpMatchArray = text.match(IMAGE_LINK_REGEX2); // 2-link: [ ![[src|alt1|alt2|width]] ](https://...)
    let link: boolean = false;
    let content: string;
    if (match) {
        link = true;
        content = match[2];
    } else {
        match = text.match(IMAGE_REGEX2); // 2: ![[src|alt1|alt2|width]]
        content = match ? match[1] : null;
    }
    if (!match) return null;
    const img: GalleryImgCto = new GalleryImgCto();
    img.link = link;
    img.match = match;
    let width: string;
    const contentArr = content?.split('|');
    if (contentArr && 0 < contentArr.length && (img.src = contentArr[0])) {
        const srcArr = img.src.split('/');
        if (srcArr && 0 < srcArr.length) {
            img.name = srcArr[srcArr.length - 1];
        }
        if (1 == contentArr.length) {
            img.alt = img.src;
        } else {
            img.alt = '';
            for (let i = 1; i < contentArr.length; i++) {
                if (i == contentArr.length - 1 && /\d+/.test(width = contentArr[i])) break;
                if (img.alt) img.alt += '|';
                img.alt += contentArr[i];
            }
        }
        img.convert = true;
    }
    return img;
}

const matchImageTag = (text: string): GalleryImgCto => {
    let match: RegExpMatchArray = text.match(IMG_TAG_LINK_SRC_REGEX); // 3-a-img-src: <a> <img ... src=''/> </a>
    let link: boolean = false;
    if (match) {
        link = true;
    } else {
        match = text.match(IMG_TAG_SRC_REGEX); // 3-img-src: <img ... src='' />
    }
    if (!match) return null;
    const img: GalleryImgCto = new GalleryImgCto();
    img.link = link;
    img.match = match;
    img.src = img.link ? match[2] : match[1];
    if (img.src) {
        if (img.src.startsWith('file://')) {
            img.src = img.src.replace(/^file:\/+/, 'app://local/');
        } else if (FULL_PATH_REGEX.test(img.src)) {
            img.src = 'app://local/' + img.src;
        }
    }
    const matchAlt = text.match(IMG_TAG_ALT_REGEX)
    img.alt = matchAlt ? matchAlt[1] : '';
    return img;
}

export const md5Img = (alt: string, src: string) => {
    return Md5.init((alt ? alt : '') + '_' + src);
}

// ------------------------------------------------------------
const extractImg = (lineText: string): GalleryImgCto => {
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

const parseAndExtractImg = (lineText: string, plugin: ImageToolkitPlugin, filePath: string) => {
    let img: GalleryImgCto = extractImg(lineText);
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
