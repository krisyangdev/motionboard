[English](README.md) | **简体中文**

# Motionboard

用 Claude Code 或 Codex 做宣传片和动效：免费的 HyperFrames skill，48 个镜头配方（匹配剪辑转场、Logo 动画、动态文字排版、液态玻璃效果、打字机动画等），每个都拆自苹果、Linear、Figma 等公司的宣传片，用代码复刻。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-d97757)](#安装)
[![Codex skill](https://img.shields.io/badge/Codex-skill-111111)](#安装)

[motionboard.app](https://motionboard.app/zh/) · [全部配方](https://motionboard.app/zh/#recipes)

[![Motionboard 宣传片，由六个配方拼成](assets/readme/film.gif)](https://motionboard.app/zh/)

对 Agent 说「给我的产品做一支宣传片」「在这两个界面之间加一个匹配剪辑」或「给我们的 Logo 做个出场动画」，它会用代码做出镜头并渲染成 MP4，也可以把动效移植到你的网站。Motionboard 把真实的宣传片拆成 48 个镜头。每个镜头都用代码复刻成约 10 秒的 [HyperFrames](https://github.com/heygen-com/hyperframes) 短片（HTML 加 GSAP，渲染成视频），网站上每个配方都把原片和复刻并排放在一起。这个 skill 让你的 Agent 掌握全部 48 个配方，可以只做一个镜头，也可以为你的产品规划并做出完整的宣传片。

[![Motionboard 宣传片，用 Motionboard 技能做成](https://media.motionboard.app/launch-motionboard-motionboard.jpg)](https://media.motionboard.app/launch-motionboard-motionboard.mp4)

同样三个产品，我们的影片和 HyperFrames、brag 做的影片并排对比：[宣传片示例](https://motionboard.app/zh/guides/launch-video-examples/)。

环境要求：Node 22+、HyperFrames（`npx hyperframes`）、ffmpeg。

## 安装

```sh
npx skills add krisyangdev/motionboard
```

也可以把链接交给你的 Agent：

> Install this skill: https://github.com/krisyangdev/motionboard

在 Claude Code 中作为插件安装：

```sh
/plugin marketplace add krisyangdev/motionboard
/plugin install motionboard@motionboard
```

在 Claude Code 和 Codex 中手动安装：

```sh
git clone https://github.com/krisyangdev/motionboard.git ~/motionboard
ln -s ~/motionboard/skills/motionboard ~/.claude/skills/motionboard
ln -s ~/motionboard/skills/motionboard ~/.codex/skills/motionboard
```

## 使用

| 你说 | 发生什么 |
| --- | --- |
| 用 Motionboard 给我的产品做一支宣传片。 | Agent 先了解你的产品，给出 4 到 6 个镜头的分镜表和预览链接，等你确认后逐个做出镜头，再拼成一个 MP4。 |
| 用 Motionboard 给 https://your-product.com 做一支宣传片，直接做完。 | 一条命令，中途不问：Agent 抓取网页、写产品简报、挑 5 个配方，逐个做出并渲染，再拼成 22 到 32 秒的 MP4。 |
| 用 match-cut 配方，从我的 logo 切到应用界面。 | Agent 用你的品牌和界面做出这一个镜头，渲染后对照预览片检查。 |
| 给这个落地页做「斜拍景深界面」镜头。 | Agent 把配方里的 GSAP 时间线移植到你的网站，做成首屏动效。 |

[motionboard.app](https://motionboard.app/zh/) 每个配方页都有复制按钮，复制的是一句给 Agent 的英文指令：先安装这个 skill，再做这个镜头。

## 配方

48 个配方，按它们在宣传片中的位置分组。

<!-- recipes:start -->

### 开场 (10)

| 配方 | 镜头 |
| --- | --- |
| [暗场打光显影](https://motionboard.app/zh/recipes/light-reveal/) | 产品从全黑中靠提高曝光逐步显出，镜头只有极轻的推近，片尾同镜头反向熄灭。 |
| [作品墙展示动画](https://motionboard.app/zh/recipes/showcase-wall/) | 满屏作品卡片斜向匀速漂移并慢放大，结尾加速推近一张。 |
| [逐词高亮动画](https://motionboard.app/zh/recipes/word-by-word-text-highlight/) | 黑场小字按顺序由灰变白，一次点亮一个词，字本身不位移。 |
| [打字机动画](https://motionboard.app/zh/recipes/typing-animation/) | 等宽字加光标逐字打出，速度不均匀，可打出、停住、删除再重打。 |
| [分叉生长动画](https://motionboard.app/zh/recipes/branching-growth/) | 一个点逐层分叉长成网络，前慢后快；或一个点按翻倍节奏分裂铺满画面。 |
| [圆形光圈转场](https://motionboard.app/zh/recipes/iris-transition/) | 固定圆形取景窗，窗里快切图像或重看同一张图，圆窗大小随节奏跳变。 |
| [线条抖动效果](https://motionboard.app/zh/recipes/line-boil-effect/) | 手绘线条每 2–3 帧换一版描线，动作按低帧率逐帧，没有补间。 |
| [文字在物体后面效果](https://motionboard.app/zh/recipes/text-behind-object-effect/) | 超大标题放在产品窗口后面，窗口盖住字的下沿；窗口稳稳不动，每介绍一个功能，标题词就从窗口后面沉下去、换成新词升起来，窗口里的内容在同一帧跟着变。 |
| [3D 折带文字动画](https://motionboard.app/zh/recipes/3d-ribbon-text-animation/) | 两行标题在词与词之间折成锯齿状的 3D 折带，再复制成一整片，随后带箭头的宽色带从镜头旁扫过，最后一条色带铺满画面，擦出产品界面，界面里先拖 Rotate Y 手柄、再拖 Distance 滑块，最后停在 Planar 字标上。 |
| [一词一切文字动画](https://motionboard.app/zh/recipes/one-word-per-cut/) | 一句话按一词一镜头拆开，词固定在画面正中，背后每次换一屏产品界面，随后接一组文件名字幕，整句落到米色卡片上，再出字标。 |

### 产品亮相 (9)

| 配方 | 镜头 |
| --- | --- |
| [设备推镜聚焦](https://motionboard.app/zh/recipes/device-push-in-focus/) | 线稿风 3D 笔记本合盖转正、开盖、推近键盘，再随右侧选项逐次平移到对应按键并按下。 |
| [微距拉远揭示](https://motionboard.app/zh/recipes/macro-pull-out-reveal/) | 镜头贴着局部超近距离慢移，最后一次后拉把整机或整页交代出来。 |
| [X 光透视效果](https://motionboard.app/zh/recipes/x-ray-effect/) | 内部结构和外壳在同一机位对位叠化，随后镜头拉远成整机。 |
| [文字穿插实物效果](https://motionboard.app/zh/recipes/text-object-interleave/) | 文字和实物在深度上互相穿插：文字出现在产品后面，设备插入句子中间，或文字穿过实物变成另一种文字。 |
| [描边到实体显形动画](https://motionboard.app/zh/recipes/outline-to-solid-reveal/) | 先出线框或光线勾出的轮廓，再填成实心或材质。 |
| [3D 倾斜界面景深效果](https://motionboard.app/zh/recipes/3d-tilted-ui-depth-of-field/) | UI 平面倾斜 10–15° 贴近拍摄，只有当前操作行在焦内，其余行虚化。 |
| [Dock 图标动画](https://motionboard.app/zh/recipes/dock-arrival/) | 放大的 Dock 撑开空位长出新图标，冒一次小火花，光标点击后开窗。 |
| [棱镜玻璃效果](https://motionboard.app/zh/recipes/fluted-glass-effect/) | 笔记本屏幕被切成 28 条竖向棱镜，亮线从下往上穿过玻璃，收成大字；镜头推进屏幕后，字被抽走，字标升起，玻璃变平，字标从模糊变清晰，只在屏幕左右各留 3 条淡线。 |
| [希区柯克变焦效果](https://motionboard.app/zh/recipes/dolly-zoom-effect/) | 镜头后退的同时焦距拉长，手机在画面里保持原大小，背景的透视被压平，走廊收成一整面仪表盘墙。 |

### 功能展示 (17)

| 配方 | 镜头 |
| --- | --- |
| [配件依次滑出排列动画](https://motionboard.app/zh/recipes/dispense-line-up/) | 配件从主体里逐个滑出排成一行，文案逐词同步出现，停留后对称收回。 |
| [光标自动放大效果](https://motionboard.app/zh/recipes/zoom-to-cursor/) | 镜头 0.4–0.8s 快推到要操作的元素，完成一次点击或输入后拉回全景。 |
| [形变转场](https://motionboard.app/zh/recipes/morph-transition/) | 同一个元素连续变形成下一个元素，代替切镜，整段没有硬切。 |
| [线框重排动画](https://motionboard.app/zh/recipes/wireframe-re-layout/) | 内容退成线框，线框 Flip 重排成新布局，各格依次填入新内容。 |
| [卡片翻转动画](https://motionboard.app/zh/recipes/card-flip-animation/) | 预览卡绕 Y 轴翻转 180°，背面是代码。 |
| [控件联动动画](https://motionboard.app/zh/recipes/control-driven-change/) | 控件（取色器、开关、调节盘）一到位，页面结果同帧变化，可分屏左控件右结果。 |
| [多人协作光标动画](https://motionboard.app/zh/recipes/multiplayer-cursor-animation/) | 放大的双色带名字光标在画布上移动、评论、拖动重排。 |
| [焦点跳转动画](https://motionboard.app/zh/recipes/focus-hop/) | 高亮块或焦点框随光标一格一停跳动，焦点框可取框内图标的颜色。 |
| [堆积清空动画](https://motionboard.app/zh/recipes/pile-up-and-clear/) | 任务、标签或事件逐个堆满画面，然后一次清空成一个结果状态。 |
| [输入框提示词轮播](https://motionboard.app/zh/recipes/prompt-carousel/) | 标题下一条线加厚成胶囊再变输入框，框内逐条打提示词并上下滚动。 |
| [动态文字排版](https://motionboard.app/zh/recipes/kinetic-typography/) | 参数句拆成单词落在拉开的位置，连接词字母阶梯错开，正斜体混排。 |
| [液态玻璃效果](https://motionboard.app/zh/recipes/liquid-glass-effect/) | 透明玻璃圆、放大镜或控件在内容上移动，折射放大下方内容，边缘带色散。 |
| [地图标记动画](https://motionboard.app/zh/recipes/map-pin-animation/) | 定位钉回弹落下并爆出碎片，镜头拉远到全国，轨迹线划向下一座城市。 |
| [点阵动画](https://motionboard.app/zh/recipes/dot-matrix-animation/) | 图形被量化到圆形点阵屏上，旋转或变化时每一帧都对齐到点阵。 |
| [撒花成功动画](https://motionboard.app/zh/recipes/confetti-success-animation/) | 点击或付款那一帧，接触点外扩线条、方块、圆点，或图标回弹弹出并扩散同形描边。 |
| [光束效果](https://motionboard.app/zh/recipes/light-beam-effect/) | 几台笔记本在黑场里各自向外投出一束梯形光，光束里是它的 App 界面，光束摆动、交接，最后收成一束宽光，参数文字沿右侧斜边展开，笔记本合上。 |
| [滚动文字动画](https://motionboard.app/zh/recipes/scrolling-text-animation/) | 一整行口述文字从慢到快横向滚过画面，句尾的 m 被拖长并推近成巨大字形，整行随后压成一条竖线，展开成一个两行的短消息气泡，镜头拉远露出它所在的聊天窗口。 |

### 转场 (7)

| 配方 | 镜头 |
| --- | --- |
| [固定版式换肤动画](https://motionboard.app/zh/recipes/locked-layout-reskin/) | 布局位置不变，每 6–10 帧硬切换一套配色和字体。 |
| [玻璃水滴分离动画](https://motionboard.app/zh/recipes/glass-droplet-split/) | 玻璃片拉长成水滴，颈部收细断开，留下一颗圆珠；同类形式是色散玻璃环向中心收束。 |
| [方块波浪翻转](https://motionboard.app/zh/recipes/domino-wave/) | 一排方块按相位差依次翻转 90°，镜头沿队列平移。 |
| [匹配剪辑转场](https://motionboard.app/zh/recipes/match-cut-transition/) | 在同一个锚点把一个东西换成另一个，视线位置不动。 |
| [遮挡闪白转场](https://motionboard.app/zh/recipes/wipe-flash-transition/) | 场景内虚焦大物体横扫遮满画面切场，或中心光晕吹白后切场。 |
| [无限缩放效果](https://motionboard.app/zh/recipes/infinite-zoom/) | 镜头钻进界面里的一张卡片，卡片里的预览铺满画面成为下一屏，连推四层后回到第一屏，首尾画面相同，可以循环播放。 |
| [翻页动画效果](https://motionboard.app/zh/recipes/flipbook-animation/) | 点击按钮后，白板里的 15 张卡片收成一本书，逐页翻动并越翻越快，然后全部炸开成一幅朝镜头漂来的 3D 拼贴，最后落在字标上。 |

### 结尾 (5)

| 配方 | 镜头 |
| --- | --- |
| [旋转 Logo 揭示动画](https://motionboard.app/zh/recipes/rotating-logo-reveal/) | 物体在缓出旋转中停下，停止那一帧的角度正好是 logo 轮廓或产品的主视角。 |
| [元素汇聚 Logo 动画](https://motionboard.app/zh/recipes/converge-logo-reveal/) | 片尾把多个元素收拢、压缩成一个图标或 logo，位置始终在画面中心。 |
| [Logo 字标展开动画](https://motionboard.app/zh/recipes/logo-wordmark-reveal/) | logo 符号居中，字标从符号背后或中心向两侧展开，可带乱码定格。 |
| [色散文字效果](https://motionboard.app/zh/recipes/chromatic-aberration-text-effect/) | 字标局部字母被横向拉长并分出 RGB 重影，阶跃式扭曲后回正。 |
| [线条绘制 logo 动画](https://motionboard.app/zh/recipes/line-drawing-logo-animation/) | 低角度微距镜头在纸面上跟着绘图笔移动：先画圆环和经线，再画出每个字母的骨架，粗笔描实后硬切到正面标志，标志虚化，日期和网址逐字打出。 |

<!-- recipes:end -->

## 网站

网站使用 TanStack Start，构建时预渲染成静态 HTML，部署在 Cloudflare Workers。

```sh
npm install
npm run dev        # http://127.0.0.1:3000
npm run build      # 生成配方文件，预渲染所有页面，写入 sitemap.xml
npm run deploy     # 构建后执行 cf deploy
```

`scripts/recipes.mjs` 在每次 dev 和 build 之前运行。它根据 `src/data/` 生成给 Agent 读的配方文件，网站用 `public/r/`，skill 用 `skills/motionboard/recipes/`，并把 `skills/motionboard/source/` 复制到 `public/source/`。

影片和封面放在 R2，地址是 https://media.motionboard.app。源文件放在 `media/`（不进 git），用 `scripts/upload-media.sh [file ...]` 上传。复制、点赞和想要的计数存在 D1，本地首次运行需执行 `npx wrangler d1 migrations apply DB --local`。

## 许可证

MIT，见 [LICENSE](LICENSE)。`skills/motionboard/source/` 里的复刻是原创作品。原片归各自所有者，网站只在复刻旁边展示很短的参考片段。详见 [NOTICE](NOTICE)。
