# Ming Ma × Dala 个人网站：目标、进展与问题清单

> 文档更新时间：2026-07-12
> 当前实际开发目录：`/Users/ming.ma/Downloads/moritz/ming-ma-dala-portfolio`

## 1. 项目背景

本项目的目标不是简单地给原个人网站更换一套颜色或 CSS，而是将 Ming Ma 个人网站的真实学术内容迁移到 Dala 网站的视觉语言和交互系统中。

最终网站需要同时满足两点：

1. 保留 Ming Ma 的个人身份、研究项目、研究方向、出版物、CV、邮箱和社交链接。
2. 尽可能复刻 Dala 的排版比例、平滑滚动、粒子场景、页面节奏、导航、轮播和 WebGL 后处理效果。

## 2. 最终目标

### 2.1 视觉目标

- 黑色沉浸式背景。
- Dala 原版的大字号、低字重、超长页面和留白节奏。
- 首页左侧展示 Ming Ma 的头像、职位、机构、ERC 项目和研究简介。
- 首页右侧展示侧面人形机器人：
  - 偏女性动漫人物的侧面轮廓。
  - 扎起并向下垂落的长发。
  - 人类耳朵。
  - Meta Quest / Apple Vision Pro 风格的头戴设备。
  - 不保留头发后的飘带。
- 机器人必须使用和 Dala 原生脑部相同的粒子材质与渲染管线，而不是图片淡入淡出或第二层 Canvas 模拟。

### 2.2 动效目标

- 页面只使用一个主要 WebGL Canvas。
- 首页机器人由 Dala 原生粒子系统直接渲染。
- 粒子具有 Dala 原版的：
  - 三角锥实例几何。
  - 三秒聚合入场。
  - 鼠标扰动和相机视差。
  - GPU 弹簧惯性。
  - Bloom、景深、暗角和噪点后处理。
  - 随滚动进行的原生形态转换。
- 页面转场应表现为粒子从当前三维位置飞向下一个目标，而不是两个画布之间做透明度交叉淡化。

### 2.3 内容目标

- 首页个人身份和研究主张。
- 详细个人简介。
- AI、公共服务、行政接触和可问责性研究。
- 威权叙事、跨国传播和生成式 AI 研究。
- 三个主要研究项目。
- 七篇期刊论文、一项图书章节和一篇工作论文。
- CV、邮箱、X 账号和个人版权信息。

### 2.4 工程目标

- Next.js 16 App Router、React 19、TypeScript strict。
- 保留 Dala 原始运行时和 DOM hooks。
- 桌面、平板和手机均可使用。
- 生产构建通过，可部署至 Vercel 或其他 Node 静态托管环境。

## 3. 当前已经完成的工作

### 3.1 Dala 原始运行时迁移

已经接入并保留：

- Dala 原始 ASScroll 平滑滚动。
- GSAP 页面文字和区块动画。
- 原始 WebGL Renderer。
- 原始粒子 shader。
- 原始 InstancedMesh 粒子几何。
- Position / Velocity 双缓冲 FBO。
- Bloom、DOF、Vignette 和噪点后处理。
- Dala 原始 Loader。
- 原始桌面导航和移动菜单。
- 原始项目惯性轮播。
- 原始 publication / investor WebGL 金字塔 hooks。

主要运行时文件位于：

- `public/scripts/manifest.js`
- `public/scripts/vendor.js`
- `public/scripts/theme.js`
- `src/app/dala-original.css`

### 3.2 原生机器人粒子

上一版使用了独立 Canvas2D 绘制机器人，再与 Dala Canvas 做透明度切换。该方案已经删除。

目前采用的方案是：

1. 读取 Dala 原始 `pos-33.exr`。
2. 保留原始位置纹理的后三个形态。
3. 将第一个 100×100 象限替换为 10,000 个机器人三维目标点。
4. 由 Dala 原始 WebGL 系统直接渲染机器人。

生成后的资产：

- `public/images/pos-ming-robot-v1.exr`

生成脚本：

- `scripts/generate-native-robot-texture.py`

运行时补丁脚本：

- `scripts/patch-dala-runtime.mjs`

机器人点云当前具有以下范围：

| 坐标 | 范围 |
| --- | --- |
| X | 0.1136–0.8801 |
| Y | 0.0396–0.9602 |
| Z | 0.0200–0.9800 |

Z 坐标根据轮廓内部距离生成，不是简单地把图片亮度当作深度，因此机器人具有一定的 2.5D 厚度。

所有 10,000 个点都经过确定性随机重排。移动端只使用前 7,000 个实例时，仍然能够覆盖完整头部、头发、面部、颈部和上半身。

粒子目标预览：

- `docs/design-references/native-dala-robot-points.png`

### 3.3 个人内容迁移

个人内容集中保存在：

- `src/data/content.ts`

当前页面映射如下：

| Dala 原始结构 | 当前个人网站内容 |
| --- | --- |
| Landing | Ming Ma 身份、机构、ERC 项目、研究主张 |
| Introduction | 详细个人简介与研究兴趣 |
| Problem Narrative | 行政接触 → AI 决策 → 跨国叙事 |
| Manifesto 1 | AI 与公共服务、偏差和问责 |
| Manifesto 2 | 威权叙事、生成式 AI 和研究方法 |
| Team Carousel | 三个主要研究项目 |
| Investors Grid | 五项精选出版物 |
| Publication Archive | 完整论文、图书章节和工作论文 |
| Footer | 邮箱、CV、X 和版权信息 |

### 3.4 已完成的页面优化

- 删除首页双 Canvas 和黑色遮罩交叉淡化。
- 放宽首页标题宽度，恢复更接近 Dala 的超大排版。
- 首页只保留精炼研究主张，完整简介移至下一屏。
- 缩小头像和身份块，降低首屏信息过载。
- 恢复移动端原始页面节奏和文字可读性模糊层。
- 缩短项目轮播的显示标题和摘要，避免内容溢出。
- 恢复轮播原始 active link 动画 hook。
- 使用较短的出版物显示标签，完整标题保留在 archive 中。
- 将 publication archive 移出 investors grid，修复移动端顺序错误。
- 删除为掩盖轮播溢出而添加的 34rem 人工空白。
- 修复运行时请求不存在的 `py-monbile.glb` 导致移动端可能卡在 Loader 的问题。

## 4. 当前技术结构

```text
src/app/page.tsx
  ├── PortfolioHeader
  ├── SiteLoader
  ├── [asscroll-container]
  │   └── main
  │       ├── PortfolioHero
  │       ├── PortfolioIntroduction
  │       ├── PortfolioNarrative
  │       ├── PortfolioManifestos
  │       ├── ProjectCarousel
  │       ├── PublicationShowcase
  │       ├── PublicationArchive
  │       └── PortfolioFooter
  ├── ParticleCanvas        # 唯一主要粒子 Canvas
  └── DalaRuntime           # 原始 Dala 脚本加载顺序
```

粒子数据链路：

```text
robot-source.png
  ↓ 轮廓提取、加权采样、Z 厚度生成、随机重排
10,000 个 XYZ 目标点
  ↓ 写入第一个 100×100 象限
pos-ming-robot-v1.exr
  ↓ Dala EXRLoader
Position FBO + Velocity FBO
  ↓ spring 0.006 / friction 0.892
原始 Dala InstancedMesh + 后处理
```

## 5. 已完成的验证

- 新 EXR 为 200×200 FLOAT RGB，ZIP16 压缩。
- 机器人区域包含正好 10,000 个位置目标。
- 后三个 Dala 原始形态与原 EXR 的最大绝对差值为 `0.0`。
- 机器人 EXR 可以重复生成，文件 SHA-256 保持一致。
- 生产环境可以通过 HTTP `200` 返回新 EXR。
- 运行时已引用 `/images/pos-ming-robot-v1.exr`。
- 移动端不存在的模型路径已经移除。
- `npm run lint` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- `npm run check` 全部通过。

## 6. 当前仍然存在的问题

### P0：最终浏览器视觉验收尚未完成

生成新 EXR 后，本次工具环境阻止了 localhost 页面重新载入，因此没有拿到“最新版本实际 WebGL 首屏”的最终截图。

目前已经完成资产级、运行时级和生产构建级验证，但仍然必须人工打开页面确认：

- 机器人是否在预期方向显示。
- 机器人与首页标题是否发生不理想的遮挡。
- 头戴设备、耳朵和长马尾是否在 WebGL 后处理中仍然清晰。
- 从机器人到下一形态的粒子轨迹是否符合预期。
- 项目轮播和出版物区的最新排版是否仍有溢出。

### P0：机器人形象仍需一次视觉定稿

当前机器人轮廓来自已确认的 `robot-source.png`，但 WebGL 粒子会受到以下因素影响：

- 原始 Dala 色彩纹理。
- 粒子尺寸纹理。
- 三角锥实例的旋转。
- Bloom 和景深。
- 入场时的排序与聚合过程。

因此，点云预览正确并不代表浏览器里的最终轮廓一定已经完美。最终可能还需要调整：

- 粒子在眼镜区域的密度。
- 面部和耳朵轮廓密度。
- 马尾长度和宽度。
- 肩部与背景的分离度。
- X/Y 缩放和整体位置。
- Z 厚度。

### P1：当前机器人是 2.5D 点云，不是真正的完整 3D 人体模型

当前方案已经进入 Dala 原生 WebGL 管线，但机器人点位仍然由一张侧面图像生成。

优点：

- 正侧面轮廓能够忠实接近设计图。
- 成本低，能够直接使用 Dala 原生形变和后处理。

限制：

- 大角度旋转时可能暴露出近似体积感。
- 耳朵、眼镜和头发背面的真实结构不存在。
- 如果未来需要自由旋转，应改为从真实机器人 3D Mesh 表面采样 10,000 个点。

### P1：原始脑部首形态已被机器人替换

Dala 原始位置纹理只有四个形态槽位。当前映射是：

1. 机器人。
2. Dala 原第二形态。
3. Dala 原第三形态。
4. Dala 原第四形态。

这意味着原始首页脑部不再作为独立形态出现。

如果最终目标必须是：

```text
机器人 → 原始脑部 → 原始第二形态 → 原始第三形态 → 原始第四形态
```

则需要扩展为五形态 atlas，并修改 shader、UV 采样、FBO readback 和滚动阶段公式。这是下一阶段较大的运行时改造，不属于当前最小原生迁移方案。

### P1：真实移动设备性能尚未验证

当前移动端使用 7,000 个实例，但由于原站缺少专用 `py-monbile.glb`，目前回退使用 `py-lod7.glb`。

仍需在真实手机上确认：

- Loader 完成时间。
- WebGL 帧率。
- 页面滚动温度与功耗。
- Safari 的 EXR、WebGL 和景深表现。
- 是否需要进一步降低移动端实例几何复杂度。

### P1：Dala 运行时是压缩后的第三方 bundle

`theme.js` 是压缩运行时。当前补丁只修改两个资源 URL，其余代码与 Dala 原版一致。

风险：

- 如果替换 Dala 原始 bundle，补丁特征字符串可能变化。
- 运行时内部没有稳定、公开的 API。

缓解方式：

- 保留 `scripts/patch-dala-runtime.mjs`。
- 补丁会检查目标字符串出现次数，不会在不匹配时静默修改。
- `public/scripts/**` 被视为静态 vendor 产物，不参与源码 ESLint。

### P2：导航高亮边界仍需观察

项目轮播和出版物仍位于同一个 Dala 原始大区块中。进入项目轮播后，导航可能较早高亮 `Publications`。

如果视觉验收确认存在问题，可以：

- 调整 `section-name` 映射；或
- 给项目和出版物增加独立的轻量导航状态，但不改变 WebGL 的七段场景索引。

### P2：出版物展示采用“短标签 + 完整档案”结构

为了保持 Dala investors grid 的比例，精选出版物区只展示短标签，例如 `Institutional Logics` 和 `Mirrors & Mosaics`；完整论文名位于可展开 archive 中。

需要最终确认这种信息层级是否符合个人学术网站需求。如果希望首页直接展示完整论文标题，需要重新设计 investors grid，而不能简单地把长标题塞回原始卡片。

### P2：当前工作区尚未提交

当前迁移和原生机器人相关文件仍然是未提交修改。完成视觉验收前不建议直接覆盖或清理这些文件。

## 7. 下一步建议

建议按照以下顺序继续：

1. 本地启动网站并等待 Loader 完全结束。
2. 在 1440×900 桌面尺寸检查首屏机器人。
3. 缓慢滚动至第一次、第二次和第三次粒子形态转换并录屏。
4. 检查项目轮播三个状态。
5. 检查 publication grid 和完整 archive。
6. 在 768px 和 390px 宽度复查布局。
7. 在真实 iPhone / Android 手机上做性能测试。
8. 根据截图只调整机器人点云生成参数，不再增加第二 Canvas。
9. 完成最终视觉验收后再提交 Git 和部署。

## 8. 本地运行方式

```bash
cd /Users/ming.ma/Downloads/moritz/ming-ma-dala-portfolio
npm run dev
```

打开终端显示的本地地址，等待 Dala Loader 显示 `Completed` 后再开始判断粒子效果。

完整检查：

```bash
npm run check
```

重新生成机器人 EXR：

```bash
python3 scripts/generate-native-robot-texture.py
node scripts/patch-dala-runtime.mjs
```

## 9. 完成标准

只有同时满足以下条件，才可以认为项目完成：

- [ ] 首屏机器人在唯一 Dala WebGL Canvas 内显示。
- [ ] 页面不存在 Canvas2D 机器人覆盖层。
- [ ] 机器人头戴设备、耳朵、马尾和上半身轮廓清晰。
- [ ] 粒子入场、鼠标反馈和滚动形变均为原生效果。
- [ ] 转场过程中没有透明度叠影、突然切换或明显掉帧。
- [ ] 桌面首屏排版接近 Dala 原始比例。
- [ ] 项目轮播三个状态没有内容溢出。
- [ ] 出版物信息完整且移动端顺序正确。
- [ ] 390px、768px、1440px 三个宽度均完成视觉验收。
- [ ] 真实手机完成性能测试。
- [x] ESLint、TypeScript 和生产构建通过。
