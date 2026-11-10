# POCKETMOSS 美术资产清单与规格

> 版本：v3.0-art ｜ 盘点日期：2026-11-10 ｜ 适用范围：`/workspace` 当前实现
> 渲染技术：Canvas 2D（场景 + 精灵）+ CSS（面板/动效），全部资产程序化生成

---

## 0. 总览

| 资产类别 | 数量 | 载体 | 外部文件 |
|---|---|---|---|
| 精灵像素点阵 | 15 只（5 元素 × 3） | `js/sprites.js` 内字符点阵 → canvas | 无 |
| 进化配色变体 | 15 套 | `js/config.js` `evolved` 字段 | 无 |
| 场景背景 | 5 个 | `js/renderer.js` 程序绘制 | 无 |
| 氛围粒子 | 5 类 / 98 个粒子 | `js/renderer.js` | 无 |
| UI 组件样式 | 11 类 | `css/styles.css` | 无 |
| 动效 | 12 种 | CSS keyframes + canvas 循环 | 无 |
| 音乐 | 5 首循环 | `js/music.js` WebAudio 合成 | 无 |
| 位图 / 音频 / 字体文件 | **0 / 0 / 0** | — | — |

**结论：当前项目没有一张图片、没有一个音频文件，全部由代码生成。** 优点是零加载、体积极小；代价是美术修改必须改代码，且没有传统意义上的切图交付物。

---

## 1. 全局色板

### 1.1 基础 GBA 色板（CSS 变量 + JS 常量）
| 名称 | 色值 | 用途 |
|---|---|---|
| `GBA_DARK` | `#0f380f` | 深色描边、深底文字 |
| `GBA_MID` | `#306230` | 面板边框、分隔线 |
| `GBA_LIGHT` | `#8bac0f` | 次级文字、悬浮态 |
| `GBA_BG` | `#9bbc0f` | 主强调色、气泡底、选中态 |
| 应用底色 | `#0a0a0a` | 页面底色 |
| 面板底色 | `#0d140d` | 弹窗面板 |
| 芯片底色 | `#141a14` | HUD 宠物芯片 |

### 1.2 场景配色（每场景 6 个色值）
| 场景 key | skyTop | skyBot | groundTop | groundBot | groundDark | accent |
|---|---|---|---|---|---|---|
| forest | `#065f46` | `#022c22` | `#059669` | `#047857` | `#064e3b` | `#9bbc0f` |
| volcano | `#7c3aed` | `#2e1065` | `#f97316` | `#9a3412` | `#451a03` | `#fb923c` |
| lake | `#0369a1` | `#1e3a8a` | `#3b82f6` | `#1d4ed8` | `#1e3a8a` | `#60a5fa` |
| peak | `#3730a3` | `#312e81` | `#a78bfa` | `#6d28d9` | `#3b0764` | `#c4b5fd` |
| cavern | `#3b0764` | `#0a0a0a` | `#6b21a8` | `#3b0764` | `#0a0a0a` | `#a78bfa` |

---

## 2. 精灵资产清单（15 只）

字段说明：本体 = `bodyColor`，阴影 = `shadowColor`，进化 = `evolved` 覆盖色；点阵记号见 §3.1。

| # | id | 名称 | 元素 | 性格 | 本体色 | 阴影色 | 进化本体 | 进化阴影 | 造型 | 点阵 | 记号 | 点缀色 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | mossbeast | 苔藓兽 | 木 | 慵懒治愈 | `#10b981` | `#059669` | `#34d399` | `#047857` | blob | 16×16 | a b e h o s | `#86efac` |
| 2 | mushroom | 蘑菇灵 | 木 | 害羞胆小 | `#fca5a5` | `#b91c1c` | `#fecaca` | `#dc2626` | mushroom | 16×16 | a b e o w | `#dc2626` |
| 3 | leafsprite | 藤叶精 | 木 | 好奇活泼 | `#34d399` | `#059669` | `#6ee7b7` | `#10b981` | leafy | 16×16 | a b e h o | `#6ee7b7` |
| 4 | flamefox | 炎狐 | 火 | 傲娇毒舌 | `#f97316` | `#c2410c` | `#fbbf24` | `#b45309` | fox | 16×16 | a b e h o s w | `#fbbf24` |
| 5 | lavaspirit | 熔岩精 | 火 | 慵懒治愈 | `#ea580c` | `#7c2d12` | `#f43f5e` | `#9f1239` | lavablob | 16×16 | a b e o | `#fef08a` |
| 6 | sparkseed | 火星种 | 火 | 好奇活泼 | `#fbbf24` | `#d97706` | `#fde047` | `#ca8a04` | spark | 16×16 | a b e h o | `#fef9c3` |
| 7 | dropfrog | 水滴蛙 | 水 | 温柔治愈 | `#60a5fa` | `#2563eb` | `#34d399` | `#059669` | frog | 16×16 | b e o | `#dbeafe` |
| 8 | jellyspirit | 水母灵 | 水 | 害羞胆小 | `#93c5fd` | `#3b82f6` | `#e0e7ff` | `#818cf8` | jelly | 16×16 | b e h o s | `#e0f2fe` |
| 9 | bubbledragon | 泡泡龙 | 水 | 好奇活泼 | `#38bdf8` | `#0369a1` | `#818cf8` | `#4f46e5` | dragon | 16×16 | b e h o s w | `#38bdf8` |
| 10 | thundermouse | 雷电鼠 | 雷 | 好奇活泼 | `#facc15` | `#a16207` | `#fde047` | `#ca8a04` | mouse | 16×16 | b e h o s w | `#facc15` |
| 11 | cloudspirit | 云朵灵 | 雷 | 慵懒治愈 | `#e0e7ff` | `#818cf8` | `#ffffff` | `#a5b4fc` | cloud | 16×16 | b e o | `#e0e7ff` |
| 12 | lightningbird | 闪电鸟 | 雷 | 傲娇毒舌 | `#a78bfa` | `#6d28d9` | `#c4b5fd` | `#7c3aed` | bird | 16×16 | a b e h o s | `#fbbf24` |
| 13 | shadowbat | 暗影蝠 | 暗 | 孤僻少言 | `#7e22ce` | `#3b0764` | `#a855f7` | `#581c87` | bat | 16×16 | b e o s w | `#c084fc` |
| 14 | dreamspirit | 梦灵 | 暗 | 温柔治愈 | `#c4b5fd` | `#7c3aed` | `#ddd6fe` | `#8b5cf6` | dream | 16×16 | b e h o w | `#c4b5fd` |
| 15 | ghostseed | 幽灵种 | 暗 | 害羞胆小 | `#e9d5ff` | `#9333ea` | `#f5f3ff` | `#a855f7` | ghost | 16×16 | b e h o | `#f5f3ff` |

---

## 3. 精灵像素规格

### 3.1 点阵记号语义（7 种）
| 记号 | 含义 | 取色规则 |
|---|---|---|
| `.` | 透明 | 不绘制 |
| `o` | 描边 | `shadowColor` 压暗 55% |
| `b` | 本体 | `bodyColor`（进化后取 evolved 值） |
| `s` | 阴影 | `shadowColor` |
| `h` | 高光 | `bodyColor` 提亮 45% |
| `w` | 纯白 | `#fffdf5`（眼白/牙齿/口鼻/泡泡） |
| `e` | 眼睛 | `#0b0b12` |
| `a` | 点缀 | 每只精灵独立的 ACCENTS 色（叶芽/菌斑/火星/喙/鳍等） |

### 3.2 渲染管线
1. 字符点阵 → `canvas`，**1 个字符 = 1 个物理像素**（`fillRect(x, y, 1, 1)`）
2. 行宽不一致时右补 `.`，画布宽取最长行，高取行数
3. CSS 等比放大到 **高 52px**，`image-rendering: pixelated` 保持硬边
4. 外挂 `drop-shadow(0 2px 0 rgba(0,0,0,.35))` 做像素风投影
5. 进化形态：仅替换 `bodyColor/shadowColor` 并加右上角 `✦` 星标

### 3.3 场景内的尺寸与层级
| 项目 | 规格 |
|---|---|
| 精灵容器 | 60 × 70 px，`translate(-50%,-50%)` 锚定中心 |
| 透视缩放 | `scale = 0.55 + depth × 0.55`（深度 0→0.55 倍，1→1.10 倍） |
| 层级 | `z-index = floor(depth × 100)`，保证近遮挡远 |
| 地板投影 | 34 × 6 px，黑色椭圆，透明度 0.28 |
| 待机浮动 | 内层 `.sprite-bob` 上下 ±3px，2.6s，随机负延迟错相位 |
| 呼吸光晕 | 外层 3s，`drop-shadow` 0→4px 白色 15% |
| 横向排布 | 场景内 N 只精灵按 0.14 屏宽等距分布，带 ±7.5% 随机抖动 |

### 3.4 小尺寸复用
`createPetCanvas()` 输出同一 canvas，用于三处：
| 位置 | 显示尺寸 | 说明 |
|---|---|---|
| HUD 宠物芯片头像 | 18 × 18 | 与状态条同一芯片 |
| 孵化三选一卡片 | 36 × 36 | 带径向微光底 |
| 图鉴格子头像 | 32 × 32 | 未解锁 `brightness(.5) grayscale(1)` |

---

## 4. 场景资产清单

所有场景共用：天空竖向渐变（0→58% 高度）、0.58H 地平线、梯形地面（左右各内缩 5%）、5 条透视横线、`#scene-canvas` 全屏铺满（`pointer-events:none`）。

| 场景 | 远景层 | 中景层 | 近景/地面细节 | 粒子 | 数量 | 粒子色 | 特殊动效 |
|---|---|---|---|---|---|---|---|
| forest | 2 层松树剪影（不同高度/间距，seed 稳定）+ 天空光源方块 | 林间雾带 3 条横向漂移 | 左右树桩色块 + 草丛短竖线 | 萤火虫 | 18 | `#d9f99d` / `#fef08a` | 雾带 sine 漂移 |
| volcano | 远山火山三角 + 岩浆口闪烁 + 5 团上升烟柱 | 地平线熔岩橙辉光渐变 | 4 条锯齿状岩浆裂缝 | 上升火星 | 24 | `#fb923c` / `#fde047` | 浆口 2Hz 明暗呼吸 |
| lake | 2 层远山折线（seed 稳定） | 水光带渐变 + 6 条横向波光跑动 | 无 | 上升气泡 | 16 | `rgba(224,242,254,.85)` | 水光带横向循环 |
| peak | 3 层紫色山脊折线 + 云带 | 4 条斜向气流线 | 6 段雪地高光 | 火花 | 18 | `#fde047` / `#c4b5fd` | 每 3–8s 随机闪电（全屏泛白 + 折线） |
| cavern | 洞顶岩层 + 钟乳石（程序生成锯齿） | 4 簇呼吸脉动水晶 | 底部 4 组岩柱 | 漂浮尘埃 | 22 | `#c4b5fd` / `#a78bfa` | 水晶 1.6Hz 脉动 |

**渲染循环**：`requestAnimationFrame` 常驻，每帧顺序 `天空 → 远景 → 中景 → 地平线 → 地面 → 近景 → 粒子 → 闪电`。

---

## 5. UI / 面板组件清单

| 组件 | 位置 | 尺寸/规格 | 色彩 | 状态 |
|---|---|---|---|---|
| 顶部 HUD | `#hud-top` | 高约 76px（含安全区），`rgba(0,0,0,.88)`，下边框 2px | `#306230` | 固定 z-50 |
| 场景名 / 电量 / 时钟 | `.hud-row-1` | 11px，字距 1px | `#9bbc0f` | 纯文本 |
| 图标按钮（蛋/图鉴/静音） | `.hud-icon` | padding 2×6，1px 边框，`0 2px 0` 硬阴影 | 渐变 `#232b23→#141a14` | 按下下沉 2px |
| 宠物芯片 | `.hud-pet-chip` | 最小宽 54px，头像 18px，4 条状态条各 4px | 边框 `#306230` | 选中：亮边 + 8px 绿光 |
| 状态条配色 | 芯片内 | 高 4px，带 1px 深色描边 | 饱食 `#ef4444` / 心情 `#fbbf24` / 清洁 `#60a5fa` / 好感 `#f472b6` | — |
| 场景 Tab | `.scene-tab` | flex 均分，9px，1px 边框 | 选中 `#9bbc0f` 底 | 未解锁 35% 透明 + 灰度 |
| 快捷栏 | `#quick-bar` | 5 按钮，各最小宽 56px，11px | 半透明黑底 + 2px 上边框 | 按下下沉 3px |
| 对话按钮 | `.qb-ai` | 同上 | 亮绿渐变强调 | 常驻高亮 |
| Toast | `#toast` | 居中浮层，居中显示 | 亮绿底 + 深色边 | `.show` 淡入 |
| 对话气泡 | `.bubble` | 最大宽 160px，11px，圆角 8px | `#9bbc0f` 底 + 2px 深边 | 0.25s 上浮淡入 |
| 弹窗面板 | `.modal-panel` | 背景 `#0d140d`，2px 亮边 + 双层外描边 + 四角装饰 | — | 遮罩 `rgba(0,0,0,.75)` |
| 孵化蛋 | `.hatch-egg` | emoji 56px | — | 摇晃 0.5s / 破裂 0.4s |
| 孵化卡片 | `.hatch-card` | 宽 80px，头像 36px | 渐变底 + 3px 硬阴影 | 悬停亮边 |
| 图鉴网格 | `.codex-grid` | 3 列，间隔 6px，最小宽 240px | 格子 `#111711` | 已拥有：亮边 + 绿底 |
| 聊天气泡 | `.chat-msg` | 最大宽 80%，11px | 精灵：亮绿底；玩家：深绿底 | — |
| CRT 扫描线 | `#app::after` | 3px 周期、1px 黑线，透明度 0.5 | `mix-blend-mode: multiply` | 全屏覆盖、不拦截点击 |

> 图标现状说明：🥚 📖 🔊 🍖 🎾 🧼 💬 ▶ ➤ ✕ 均为**系统 emoji 文本**，不是图片资产，在不同平台渲染差异较大。

---

## 6. 动效清单

| 动效 | 触发 | 时长/节奏 | 缓动 |
|---|---|---|---|
| 精灵呼吸光晕 | 常驻 | 3s 循环 | ease-in-out |
| 精灵待机浮动 | 常驻 | 2.6s，±3px | ease-in-out |
| 点击爆散粒子 | 点击精灵 | 0.6s，6px 方块 | ease-out |
| 亲密 ♥ 粒子 | 好感彩蛋 | 1.4s 上浮 36px | ease-out |
| 气泡入场 | 说话/互动 | 0.25s 上浮 | ease-out |
| 孵化摇晃 | 点击蛋后 | 0.5s 循环 | ease-in-out |
| 孵化破壳 | 孵化瞬间 | 0.4s 放大淡出 | ease-out |
| 状态条 | 数值变化 | 0.4s 宽度过渡 | 默认 |
| 按钮按压 | 按下 | 0.06s 位移 | — |
| 场景粒子 | 常驻 | 每帧更新 | — |
| 闪电 | 雷峰场景 | 每 3–8s 随机 | 3 倍速衰减 |
| 水晶脉动 | 洞窟场景 | 1.6Hz | 正弦 |

---

## 7. 音乐资产（程序合成，非文件）

| 场景 | 调式 | BPM | 拍号 | 长度 | 音色 |
|---|---|---|---|---|---|
| forest | C 五声 | 96 | 4/4 | 8 小节 | 方波主旋律 + 三角波贝斯 |
| volcano | E 弗里几亚 | 128 | 4/4 | 8 小节 | 方波 + 三角波 |
| lake | A 小调五声 | 84 | 3/4 | 8 小节 | 方波 + 三角波 |
| peak | D 多利亚 | 132 | 4/4 | 8 小节 | 方波 + 三角波 |
| cavern | B 小调 | 72 | 4/4 | 8 小节 | 方波 + 三角波 |

调度：WebAudio 前瞻调度（每步 = 16 分音符），首次用户手势后启动，`localStorage.pocketmoss_bgm_muted` 记忆静音。

---

## 8. 已知缺口与风险

| # | 缺口 | 影响 | 优先级 |
|---|---|---|---|
| 1 | 精灵只有“整体浮动 + 呼吸”，无姿态帧 | 互动缺乏表演感，喂食/玩耍/进化无专门反馈 | 高 |
| 2 | 进化形态仅换色 | 成长感弱，玩家难以一眼看出进化 | 高 |
| 3 | 图标全部是 emoji | iOS/Android/桌面渲染不一致，可能显示为方块 | 中 |
| 4 | 互动道具（食物/球/肥皂）没有视觉 | 点击后只有粒子 + 气泡，缺少“做了什么”的画面 | 中 |
| 5 | `drawScene` 的 `timeOfDay` 参数未使用 | 没有昼夜/天气变化，长时间游玩画面单调 | 中 |
| 6 | 场景装饰是代码生成，无法交付给外部美术 | 换风格必须改 renderer.js | 低 |
| 7 | 精灵点阵硬编码在 JS | 新增精灵需同时改 config + sprites | 低 |
| 8 | 无独立音效层 | 喂食/点击/进化只有静默或 BGM，缺反馈 | 低 |

---

## 9. 下一步推进建议

### P0 — 观感与反馈（建议先做）
1. **精灵姿态帧**：用现有 16×16 点阵扩展 3 个变体（眨眼待机 / 进食 / 开心跳），`createSpriteEl` 增加 `pose` 参数，互动时临时切帧 600ms 再回待机。
   - 落点：`sprites.js` 加 `POSE_MAPS`，`game.js` 互动后切 pose
   - 验收：喂食瞬间精灵有咀嚼帧，点击有跳动帧
2. **互动道具像素化**：把 🍖🎾🧼 换成 16×16 点阵小物件，互动时从屏幕下方飞向精灵。
   - 好处：消除 emoji 跨平台差异，同时补上缺口 #4
3. **进化专属造型**：给 5 个元素各画 1 套 `evolved` 点阵（体型加大、加角/翼/光环），不再只换色。
   - 验收：进化前后点阵不同，`✦` 星标保留

### P1 — 氛围与表现力
4. **昼夜系统**：复用已存在的 `timeOfDay` 参数，加黄昏/夜晚两套调色 + 粒子密度变化（夜里萤火虫变多、洞窟更暗）。
5. **天气 / 事件视觉绑定**：散步事件 `tag` 驱动画面（`find` → 彩虹/闪光，`scare` → 压暗 + 抖动，`mystery` → 雾）。
6. **音效层**：与 BGM 同一 WebAudio 管线，加点击/喂食/进化/孵化 4 个短音。

### P2 — 管线与扩展性
7. **资产管线化**：`PIXEL_MAPS` 抽成 `assets/sprites.json`，写一个导出脚本生成 PNG 精灵表（16×16 × 15 只 = 1 张 240×16 图集），方便外部美术接手。
8. **同形差异化配饰**：同场景 3 只共用 shape 时，加围巾/蝴蝶结/斑点等配饰层，提升辨识度。

### 不建议现在做
- 直接上 32×32 或 48×48 高清精灵：手机端 52px 显示尺寸下收益有限，但绘制成本翻倍。
- 接入外部美术管线（Figma/Sketch 导出）：当前 15 只精灵体量太小，程序化点阵反而更快迭代。

---

## 附录 A：精灵点阵源文件（可直接编辑）

> 修改字符即可改造型：`o` 描边 / `b` 本体 / `s` 阴影 / `h` 高光 / `w` 白 / `e` 眼 / `a` 点缀 / `.` 透明。


### A.1 苔藓兽（mossbeast）· 木 · 造型 blob · 16×16

```text
................
.......oo.......
......oaao......
.....oaaaao.....
......oooo......
...oooooooooo...
..obhhhhhhhhbo..
.obhhhhhhhhhhbo.
.obhhbeebeebhbo.
.obhbbbbbbbbhbo.
.obbbbbbbbbbbbo.
.obbbbboobbbbbo.
..obbbssssbbbo..
...oooooooooo...
................
................
```

### A.2 蘑菇灵（mushroom）· 木 · 造型 mushroom · 16×16

```text
................
.....oooooo.....
...oowwwwaaoo...
..owwaawwwwwoo..
.owwaaaawwwwwoo.
.owaaaaaaawwwoo.
.owaaaaaaaaawwo.
..owaaaaaaawwo..
...oowwaawwoo...
.....obbbbo.....
.....obeebo.....
.....obbbbo.....
.....obbbbo.....
....oobbbboo....
....oobbbboo....
.....oooooo.....
```

### A.3 藤叶精（leafsprite）· 木 · 造型 leafy · 16×16

```text
................
....o......o....
...oao....oao...
...oao....oao...
....oo....oo....
...oooooooooo...
..obhhhhhhhhbo..
.obhhhbbbbhhhbo.
.obhhbeebeebhbo.
.obhbbbbbbbbhbo.
.obbbbbbbbbbbbo.
..obbbbbbbbbbo..
...obbbbbbbbo...
....oooooooo....
....o.o..o.o....
................
```

### A.4 炎狐（flamefox）· 火 · 造型 fox · 16×16

```text
..oo........oo..
..oao......oao..
..oaao....oaao..
..oaaooooooaao..
..obhhhhhhhhbo..
.obhhhbbbbhhhbo.
.obhhbeebeebhbo.
.obhbbbbbbbbhbo.
.obbbbwwwwbbbbo.
.obbbbweebbbbbo.
.obbbbbbbbbbbbo.
..obbbbbbbbbbo..
...oooooooooo...
.......sssss....
......sssss.....
.....ooo........
```

### A.5 熔岩精（lavaspirit）· 火 · 造型 lavablob · 16×16

```text
................
................
.....oooooo.....
...oobbbbbboo...
..obbbbbbbbbbo..
.obbbabbbabbbbo.
.obbbbaaaabbbbo.
.obbbeebeebbbbo.
.obbbbbbbbbbbbo.
.obbbbaaabbbbbo.
..obbbbbbbbbbo..
...oobbbbbboo...
.....oooooo.....
................
................
................
```

### A.6 火星种（sparkseed）· 火 · 造型 spark · 16×16

```text
................
................
......a...a.....
...a..oo..a.....
......oo........
....oooooo......
...obhhhhbo.....
..obbeebbbbo....
..obbeeebbo.....
..obbbbbbbbo....
...obbbbbbo.....
....oooooo......
..a....a....a...
................
................
................
```

### A.7 水滴蛙（dropfrog）· 水 · 造型 frog · 16×16

```text
................
..oooo....oooo..
.obbbbo..obbbbo.
.obebbo..obbebo.
.obbbbboobbbbbo.
..ooobbbbbbooo..
..obbbbbbbbbbo..
.obbbbbbbbbbbbo.
.obbbbbbbbbbbbo.
.obbbbbbbbbbbbo.
..obbbbbbbbbbo..
...oooooooooo...
..oo........oo..
.oo..........oo.
................
................
```

### A.8 水母灵（jellyspirit）· 水 · 造型 jelly · 16×16

```text
................
.....oooooo.....
...oobbbbbboo...
..obhhhhhhhboo..
.obhhhbbbbhhhbo.
.obhbbeebeebhbo.
.obbbbbbbbbbbbo.
.obbbbbbbbbbbbo.
..oobbbbbbbboo..
...osso..osso...
...o..o..o..o...
...o..o..o..o...
...oo....o..o...
................
................
................
```

### A.9 泡泡龙（bubbledragon）· 水 · 造型 dragon · 16×16

```text
.....ww.........
....woow........
.....ww.........
...oooooooooo...
..obhhhhhhhhbo..
.obhhbbbbbbhhbo.
.obbeebbbeebbo..
.obhbbbbbbbbhbo.
.obbbbbwwbbbbbo.
.obbbbbbbbbbbbo.
..obbbbbbbbbbo..
...oooooooooo...
..ss........ss..
.ss..........ss.
................
................
```

### A.10 雷电鼠（thundermouse）· 雷 · 造型 mouse · 16×16

```text
..oooo....oooo..
.obbbbo..obbbbo.
.obbbbo..obbbbo.
..oooo....oooo..
....oooooooo....
...obhhhhhhbo...
..obhbeebeebbo..
..obbbbbbbbbbo..
..obbbbwwbbbbo..
...obbbbbbbbo...
....oooooooo....
.......ss.......
......ssss......
.....ss.........
................
................
```

### A.11 云朵灵（cloudspirit）· 雷 · 造型 cloud · 16×16

```text
................
.......oooo.....
....oooooooo....
...obbbbbbbbo...
..obbbbbbbbbbo..
.obbbbbbbbbbbbo.
.obbeebbbeebboo.
.obbbbbbbbbbbbo.
.obbbbbbbbbbbbo.
..obbbbbbbbbbo..
...oooooooooo...
................
................
................
................
................
```

### A.12 闪电鸟（lightningbird）· 雷 · 造型 bird · 16×16

```text
................
.ss..........ss.
.osso..oo..osso.
..ossoooooosso..
...obhhhhhhbo...
..obhhbbbbhhbo..
..obbeebbeebbo..
..obbbbbbbbbbo..
..obbbbaabbbbo..
...obbbbbbbbo...
....oooooooo....
......aaaa......
.......aa.......
................
................
................
```

### A.13 暗影蝠（shadowbat）· 暗 · 造型 bat · 16×16

```text
.o............o.
.oo..........oo.
.osso......osso.
.osssso..osssso.
.osssssoossssso.
..osssbbbssso...
...obbbbbbbbo...
...obbeebeebo...
...obbbbbbbbo...
...obwbwbwbbo...
....oooooooo....
................
................
................
................
................
```

### A.14 梦灵（dreamspirit）· 暗 · 造型 dream · 16×16

```text
................
.......w........
......www.......
.....w...w......
....ooooooo.....
...obbbbbbbo....
..obhbbbbbhbo...
..obbeebeebbo...
..obbbeebeebo...
..obbbbbbbbbo...
...obbbbbbbo....
....ooooooo.....
................
................
................
................
```

### A.15 幽灵种（ghostseed）· 暗 · 造型 ghost · 16×16

```text
................
.....oooooo.....
...oobbbbbboo...
..obbbbbbbbbbo..
.obhhbbbbbbhbo..
.obbeebbbeebbo..
.obbeebbbeebbo..
.obbbbbbbbbbbbo.
.obbbboooobbbbo.
.obbbbbbbbbbbbo.
.obbbbbbbbbbbbo.
.obboobboobbbbo.
.o.o.oo.oo.o.o..
................
................
................
```

