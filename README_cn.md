<h1 align="center">Obsidian Image Toolkit</h1>

<p align="center">
    <img alt="Release version" src="https://img.shields.io/github/v/release/sissilab/obsidian-image-toolkit?style=for-the-badge">
    <img alt="Download count" src="https://img.shields.io/github/downloads/sissilab/obsidian-image-toolkit/total?style=for-the-badge">
</p>

<p align="center">
    <span>Obsidian Image Toolkit 是一款 Obsidian 的第三方插件，它提供了一些有关图片查看操作的小功能。</span>
    <br/>
    <a href="/README_cn.md">简体中文</a>
    ·
    <a href="/README.md">English</a>
</p>


## 关于插件
当你点击某个图片时，该图片将会弹出，此时您可以预览查看、缩放、移动、旋转、翻转、拷贝、反色图片。

## 基本特性
- 通过鼠标滚轮或点击工具栏缩放图标来放大或缩小图片
- 通过鼠标拖拽或键盘方向按键（上、下、左、右）来移动图片
- 支持全屏查看图片
- 支持左旋、右旋、x轴翻转、y轴翻转图片
- 支持实现图片的颜色反转
- 支持拷贝图片
  
## 普通模式

当你关闭”贴图模式“（将所点击的图片贴到屏幕上），将处于**普通模式**。

![normal_mode_screenshot](https://raw.githubusercontent.com/sissilab/obsidian-image-toolkit/master/example/normal_mode_screenshot.png)

**规则**:
- 当你点击图片后，该图片将会弹出，并且背景为透明遮罩层
- 在同一时间你仅能点击和预览一张图片
- 在普通模式下，你无法编辑、浏览你的笔记，只能预览和操作图片

**图片导航**:
- 当前笔记中所有的图片将会被展示在底部，并且你可以切换这些缩略图来放大预览
- 你需要在配置界面开启”展示图片导航“来使用该功能
- 你可以可以设置图片导航的背景色和被选中图片的边框色

**离开**:
- 点击图片以外的其他地方、
- 按 Esc
> 若处于全屏模式，你需要先关闭全屏模式，然后才能离开图片预览界面

**移动图片**:
- 直接用鼠标拖动图片
- 按已配置的方向键来移动图片
  > 如果你为图片移动设置了修改键（Ctrl、Alt、Shift），你需要同时按住修改键和方向键来移动图片。

## 贴图模式

当你打开”贴图模式“（将所点击的图片贴到屏幕上），将处于**贴图模式**。

![pin_mode_screenshot](https://raw.githubusercontent.com/sissilab/obsidian-image-toolkit/master/example/pin_mode_screenshot.png)

**规则**:
- 你可以在同时点击和弹出1指5张图片
- 相较于普通模式，在贴图模式下点击弹出的图片没有遮罩层的限制
- 在贴图模式下，你可以在预览图片的情况下，同时编辑和浏览你的笔记

**菜单**:
- 当你右击某个弹出的图片时，将会在你光标右侧显示菜单，这些菜单包含的功能有缩放、全屏、刷新、旋转、翻转、拷贝、关闭等。

**离开**:
- 按 Esc 关闭你鼠标所在的图片
- 在菜单中点击”关闭“

**移动图片**:
- 直接用鼠标拖动图片
- 不支持通过方向键来移动图片

## 安装

**从 Obsidian 的社区插件来安装**:
1. 打开设置 > 第三方插件
2. 关闭”安全模式“
3. 点击”浏览“按钮来查看第三方插件市场
4. 输入搜索：“Image Toolkit”
5. 点击“安装”按钮
6. 一旦安装成功，先关闭当前社区插件窗口，然后在已安装插件列表下激活刚安装的插件

**手动安装**:
1. 下载 [latest release](https://github.com/sissilab/obsidian-image-toolkit/releases/latest)
2. 解压并提取 obsidian-image-toolkit 文件夹，然后放到你 Obsidian 库中的插件目录中 `<库>/.obsidian/plugins/` (注意: `.obsidian` 文件夹可能被隐藏了，你需要先将该文件夹展示出来)
3. 打开设置 > 第三方插件，重新加载和激活该插件

## 联系和反馈

如果你在使用该插件过程中，遇到各种问题、或有什么好的建议，欢迎在 [GitHub issues](https://github.com/sissilab/obsidian-image-toolkit/issues) 中提出。
