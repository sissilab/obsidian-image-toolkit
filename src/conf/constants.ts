export const ZOOM_FACTOR = 0.8;

export const IMG_VIEW_MIN = 30;

export const ICONS = [{
    id: 'zoom-to-100',
    svg: `<g> <path id="svg_1" d="m42,6c-18.8,0 -34,15.2 -34,34s15.2,34 34,34c7.4,0 14.3,-2.4 19.9,-6.4l26.3,26.3l5.6,-5.6l-26,-26.1c5.1,-6 8.2,-13.7 8.2,-22.1c0,-18.9 -15.2,-34.1 -34,-34.1zm0,4c16.6,0 30,13.4 30,30s-13.4,30 -30,30s-30,-13.4 -30,-30s13.4,-30 30,-30z" stroke-width="2" stroke="currentColor" fill="currentColor"/> <text font-weight="bold" xml:space="preserve" text-anchor="start" font-family="Noto Sans JP" font-size="24" id="svg_2" y="48.5" x="24" stroke-width="0" stroke="#000" fill="#000000">1:1</text> </g>`
}]

export const SEPARATOR_SYMBOL = "---";

export const TOOLBAR_CONF = [{
    title: "ZOOM_TO_100",
    class: 'toolbar_zoom_to_100',
    icon: 'zoom-to-100',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "ZOOM_IN",
    class: 'toolbar_zoom_in',
    icon: 'zoom-in',
    enableToolbarIcon: true,
    enableMenu: false,
    enableHotKey: true
}, {
    title: "ZOOM_OUT",
    class: 'toolbar_zoom_out',
    icon: 'zoom-out',
    enableToolbarIcon: true,
    enableMenu: false,
    enableHotKey: true
}, {
    title: "FULL_SCREEN",
    class: 'toolbar_full_screen',
    icon: 'expand',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "REFRESH",
    class: 'toolbar_refresh',
    icon: 'refresh-ccw',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "ROTATE_LEFT",
    class: 'toolbar_rotate_left',
    icon: 'rotate-ccw',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "ROTATE_RIGHT",
    class: 'toolbar_rotate_right',
    icon: 'rotate-cw',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "SCALE_X",
    class: 'toolbar_scale_x',
    icon: 'move-horizontal',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "SCALE_Y",
    class: 'toolbar_scale_y',
    icon: 'move-vertical',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "INVERT_COLOR",
    class: 'toolbar_invert_color',
    icon: 'droplet',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: "COPY",
    class: 'toolbar_copy',
    icon: 'copy',
    enableToolbarIcon: true,
    enableMenu: true,
    enableHotKey: true
}, {
    title: SEPARATOR_SYMBOL,
    enableToolbarIcon: false,
    enableMenu: true,
    enableHotKey: false
}, {
    title: "CLOSE",
    class: 'toolbar_close',
    icon: 'trash',
    enableToolbarIcon: false,
    enableMenu: true,
    enableHotKey: true
}];

export const IMG_FULL_SCREEN_MODE = {
    FIT: 'FIT',
    FILL: 'FILL',
    STRETCH: 'STRETCH'
}

export const VIEW_IMG_SELECTOR = {
    EDITOR_AREAS: `.workspace-leaf-content[data-type='markdown'] img,.workspace-leaf-content[data-type='image'] img`,
    EDITOR_AREAS_NO_LINK: `.workspace-leaf-content[data-type='markdown'] img:not(a img),.workspace-leaf-content[data-type='image'] img:not(a img)`,

    CPB: `.community-plugin-readme img`,
    CPB_NO_LINK: `.community-plugin-readme img:not(a img)`,

    OTHER: `#sr-flashcard-view img`,
    OTHER_NO_LINK: `#sr-flashcard-view img:not(a img)`,
}

export const IMG_BORDER_WIDTH = {
    THIN: 'thin',
    MEDIUM: 'medium',
    THICK: 'thick'
}

export const IMG_BORDER_STYLE = {
    // HIDDEN: 'hidden',
    DOTTED: 'dotted',
    DASHED: 'dashed',
    SOLID: 'solid',
    DOUBLE: 'double',
    GROOVE: 'groove',
    RIDGE: 'ridge',
    INSET: 'inset',
    OUTSET: 'outset'
}

// https://www.runoob.com/cssref/css-colorsfull.html
export const IMG_BORDER_COLOR = {
    BLACK: 'black',
    BLUE: 'blue',
    DARK_GREEN: 'darkgreen',
    GREEN: 'green',
    LIME: 'lime',
    STEEL_BLUE: 'steelblue',
    INDIGO: 'indigo',
    PURPLE: 'purple',
    GRAY: 'gray',
    DARK_RED: 'darkred',
    LIGHT_GREEN: 'lightgreen',
    BROWN: 'brown',
    LIGHT_BLUE: 'lightblue',
    SILVER: 'silver',
    RED: 'red',
    PINK: 'pink',
    ORANGE: 'orange',
    GOLD: 'gold',
    YELLOW: 'yellow'
}

export const GALLERY_NAVBAR_DEFAULT_COLOR = '#0000001A'; // rgba(0, 0, 0, 0.1)
export const GALLERY_NAVBAR_HOVER_COLOR = '#0000004D'; // rgba(0, 0, 0, 0.3)
export const GALLERY_IMG_BORDER_ACTIVE_COLOR = '#FF0000'; // red

export const MODIFIER_HOTKEYS = {
    NONE: "NONE",
    CTRL: "CTRL",
    ALT: "ALT",
    SHIFT: "SHIFT",
    CTRL_ALT: "CTRL_ALT",
    CTRL_SHIFT: "CTRL_SHIFT",
    SHIFT_ALT: "SHIFT_ALT",
    CTRL_SHIFT_ALT: "CTRL_SHIFT_ALT"
}

export const MOVE_THE_IMAGE = {
    CODE: "MOVE_THE_IMAGE",
    DEFAULT_HOTKEY: MODIFIER_HOTKEYS.NONE,
    SVG: `<svg width="56" height="37" xmlns="http://www.w3.org/2000/svg" class="icon"><path fill="none" d="M-1 -1H57V38H-1z"/><g><path stroke="null" fill="#707070" d="M19.001 16.067V1.928C19.001.864 19.865 0 20.93 0h14.142c1.064 0 1.928.864 1.928 1.928v14.14a1.929 1.929 0 01-1.928 1.927H20.929a1.929 1.929 0 01-1.928-1.928zm4.805-5.909l2.908-3.032v7.334c0 .535.43.964.965.964h.642c.535 0 .965-.43.965-.964V7.126l2.908 3.032a.965.965 0 001.378.017l.438-.442a.96.96 0 000-1.362l-5.327-5.33a.96.96 0 00-1.362 0l-5.335 5.33a.96.96 0 000 1.362l.438.441a.97.97 0 001.382-.016zM36.999 20.933v14.139A1.929 1.929 0 0135.07 37H20.929a1.929 1.929 0 01-1.928-1.928v-14.14c0-1.064.864-1.927 1.928-1.927h14.142c1.064 0 1.928.863 1.928 1.928zm-4.805 5.909l-2.908 3.032V22.54a.962.962 0 00-.965-.964h-.642a.962.962 0 00-.965.964v7.334l-2.908-3.032a.965.965 0 00-1.378-.016l-.438.441a.96.96 0 000 1.362l5.327 5.33a.96.96 0 001.362 0l5.335-5.33a.96.96 0 000-1.362l-.438-.441a.97.97 0 00-1.382.016zM16.068 37.001H1.93a1.929 1.929 0 01-1.928-1.928V20.932c0-1.065.864-1.928 1.928-1.928h14.14c1.064 0 1.927.863 1.927 1.928v14.14a1.929 1.929 0 01-1.928 1.93zm-5.908-4.804l-3.033-2.909h7.335c.534 0 .964-.43.964-.964v-.643a.962.962 0 00-.964-.964H7.127l3.033-2.909a.965.965 0 00.016-1.378l-.442-.438a.96.96 0 00-1.362 0l-5.33 5.327a.96.96 0 000 1.362l5.33 5.335a.96.96 0 001.362 0l.442-.438a.97.97 0 00-.016-1.381zM39.932 19.004H54.07c1.064 0 1.928.863 1.928 1.928v14.14a1.929 1.929 0 01-1.928 1.93H39.93a1.929 1.929 0 01-1.927-1.93v-14.14c0-1.065.863-1.928 1.928-1.928zm5.908 4.804l3.033 2.909h-7.335a.962.962 0 00-.964.964v.643c0 .534.43.964.964.964h7.335l-3.033 2.909a.965.965 0 00-.016 1.377l.442.438a.96.96 0 001.362 0l5.33-5.327a.96.96 0 000-1.362l-5.33-5.335a.96.96 0 00-1.362 0l-.442.438a.97.97 0 00.016 1.382z"/></g></svg>`
}

export const SWITCH_THE_IMAGE = {
    CODE: "SWITCH_THE_IMAGE",
    DEFAULT_HOTKEY: MODIFIER_HOTKEYS.CTRL,
    SVG: `<svg width="37" height="18" xmlns="http://www.w3.org/2000/svg" class="icon"><path fill="none" d="M-1 -1H38V19H-1z"/><g><path stroke="null" fill="#707070" d="M16.068 17.999H1.93A1.929 1.929 0 01.001 16.07V1.929C.001.865.865.001 1.93.001h14.14c1.064 0 1.927.864 1.927 1.928v14.142a1.929 1.929 0 01-1.928 1.928zm-5.908-4.805l-3.033-2.908h7.335c.534 0 .964-.43.964-.965V8.68a.962.962 0 00-.964-.965H7.127l3.033-2.908a.965.965 0 00.016-1.378l-.442-.438a.96.96 0 00-1.362 0l-5.33 5.327a.96.96 0 000 1.362l5.33 5.335a.96.96 0 001.362 0l.442-.438a.97.97 0 00-.016-1.382zM20.932.001H35.07c1.064 0 1.928.864 1.928 1.928v14.142a1.929 1.929 0 01-1.928 1.928H20.93a1.929 1.929 0 01-1.927-1.928V1.929c0-1.064.863-1.928 1.928-1.928zm5.908 4.805l3.033 2.908h-7.335a.962.962 0 00-.964.965v.642c0 .535.43.965.964.965h7.335l-3.033 2.908a.965.965 0 00-.016 1.378l.442.438a.96.96 0 001.362 0l5.33-5.327a.96.96 0 000-1.362l-5.33-5.335a.96.96 0 00-1.362 0l-.442.438a.97.97 0 00.016 1.382z"/></g></svg>`
}

export const IMG_DEFAULT_BACKGROUND_COLOR = '#00000000';

export const enum CONTAINER_TYPE {
    MAIN,
    PIN
}
