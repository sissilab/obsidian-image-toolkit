import {PinContainerView} from "./pinContainerView";
import {MENU_ITEM_CONF} from "../conf/constants";

export class Menu {

    private readonly pinContainerView: PinContainerView;

    private menuEl: HTMLDivElement;


    constructor(pinContainerView: PinContainerView) {
        this.pinContainerView = pinContainerView;
    }

    public init = () => {
        const oitContainerViewEl = this.pinContainerView.getOitContainerViewEl();
        if (!oitContainerViewEl) return;
        oitContainerViewEl.appendChild(this.menuEl = createDiv("menu"));
        let menuItem: HTMLDivElement, menuItemTitle: HTMLDivElement;
        for (const itemConf of MENU_ITEM_CONF) {
            this.menuEl.appendChild(menuItem = createDiv("menu-item"));
            menuItem.appendChild(menuItemTitle = createDiv("menu-item-title"));
            menuItemTitle.setText(itemConf.key);
        }
    }
}