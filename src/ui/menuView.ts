import {SEPARATOR_SYMBOL, TOOLBAR_CONF} from "../conf/constants";
import {Menu} from "obsidian";
import {t} from "../lang/helpers";
import {PinContainerView} from "./pinContainerView";
import {ImgCto} from "../to/imgTo";

export class MenuView {

    private menu: Menu;

    private pinContainerView: PinContainerView;

    private static activeImg: ImgCto;

    constructor(pinContainerView: PinContainerView) {
        this.pinContainerView = pinContainerView;
    }

    private init = () => {
        if (this.menu) return;
        this.menu = new Menu();
        for (const itemConf of TOOLBAR_CONF) {
            if (!itemConf.enableMenu)
                continue;
            if (SEPARATOR_SYMBOL === itemConf.title) {
                this.menu.addSeparator();
                continue;
            }
            this.menu.addItem(item => {
                if (itemConf.icon)
                    item.setIcon(itemConf.icon);
                // @ts-ignore
                item.setTitle(t(itemConf.title))
                    .onClick(() => {
                        this.pinContainerView.clickImgToolbar(null, itemConf.class, MenuView.activeImg);
                    });
            })
        }
    }

    public show = (event: MouseEvent, activeImg: ImgCto) => {
        MenuView.activeImg = activeImg;
        this.init();
        this.menu.showAtPosition({x: event.clientX, y: event.clientY});
    }
}