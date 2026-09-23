# Jev Survey 交接报告（中文）

生成日期：2026-09-23（Asia/Singapore）。版本：0.1.0。本报告说明本轮实际完成了什么、如何打开和重建、数据相对原快照的变化、已运行与未运行的检查，以及发布记录与仍待办的事项。所有数值均来自 `data/stats.json`，重建后以其为准。

## 1. 成果位置与打开方式

| 成果 | 路径 | 说明 |
| --- | --- | --- |
| 公开仓库 | https://github.com/Eurekaleo/awesome-jev-survey | 2026-09-23 创建（公开，`main` 分支）；本地目录 `jev-survey/` 即该仓库的工作副本 |
| 线上网站 | https://eurekaleo.github.io/awesome-jev-survey/ | GitHub Pages，从 `main` 根目录自动部署；推送后约 1 分钟更新 |
| 研究网站源文件 | `index.html`（由 `site/index.template.html` 生成） | 本地：`python3 -m http.server 8000` 后打开 http://localhost:8000；直接双击也可阅读，但证据抽屉与导出需要本地服务器 |
| Survey 初稿 | `paper/main.pdf`（20 页，XeLaTeX 已编译）、`paper/survey.md`、`paper/main.tex` + `paper/sections/` | 源文件为 `paper/src/survey.src.md`；表格、图、数字由数据生成 |
| 统一数据 | `data/*.json` | papers / claims / repositories / taxonomy / review-relations / sources / search-runs；另有生成的 `references.bib`、`exports/*.csv`、`stats.json` |
| 文档 | `docs/` | methodology、related-surveys、evidence-audit（这三份由数据生成）、limitations、reference-study、deployment、本报告 |
| 脚本 | `scripts/` | validate-data、build、render-readme、render-docs、build-paper、check-links、measure、update-metadata、update-github、bootstrap-from-snapshot |
| 检索留档 | `research/snapshot-2026-09-23/`（原快照，只读）、`research/increments/2026-09-23T0818Z/`（本轮增量）、`research/curation/`（首版编辑输入） | |
| 交付压缩包 | `../jev-survey-0.1.0.zip` | 不含论文 PDF 原件与第三方 README 全文 |
| 私有在线预览（发布前的临时预览，现以 GitHub Pages 为准） | https://claude.ai/artifact/P4LgwEVZ6HmgW4ubyXx49m | Claude Artifact，默认仅本人可见，分享需在页面 Share 菜单中操作；第 2 版已同步署名与许可。与线上版的差别：预览环境禁止下载，所以“当前结果”的 CSV/BibTeX 导出按钮改为说明，指向数据文件与 PDF 的链接改为在新标签页打开 GitHub Pages 上的文件；`?paper=` 深链接在该环境不可用。该副本在本地按预览外壳复现实测过；内置浏览器未登录 claude.ai，线上预览页本身未能由我打开核对 |

## 2. 本轮实际完成

- **核验**：13 篇核心论文与 1 篇边缘论文逐篇回到全文核对了主要数字、样本量、版本、测量口径与局限；62 条证据记录均带原文定位（44 条来自论文，8 条厂商文档，1 条厂商自报结果，6 条社区报告，3 条代码/README 核查）。
- **统一数据**：`research/` 原快照 → `data/` 规范数据，保留所有原字段于 `source_record`；网站、README、BibTeX、CSV、文档与稿件表格全部由同一数据生成，`build.py --check` 保证无漂移。
- **网站**（英文）：Hero / What is Jev / 研究地图 / 方法图鉴（6 类读出方式）/ 7 项发现与反证 / 可靠性实验室（4 个标注 Illustrative 的交互解释 + Reported 数据）/ 选择性控制与应用 / 开放生态审计 / 文献检索室 / 方法与维护；支持搜索、7 类筛选、排序、重置、空结果、分页、证据抽屉、深链接、BibTeX/CSV/JSON 导出。
- **Survey 初稿**：约 1 万词，含研究问题、方法、先行综述比较、谱系、实现分类、七项证据综合、失效目录、开放性审计、**提议**的评测方案（未执行）、开放问题、局限；7 张数据表、3 张数据图、88 条引用。
- **仓库**：README（生成）、LICENSE（MIT）、LICENSE-CONTENT（CC BY 4.0）、NOTICE、CONTRIBUTING、CITATION.cff、CHANGELOG、4 类 issue 模板、3 个 GitHub Actions（校验构建、每周链接检查、手动增量检索）。

## 3. 数据规模与相对原快照的变化

| 项目 | 原快照 | 本版 | 说明 |
| --- | ---: | ---: | --- |
| 核心 / 边缘论文 | 13 / 1 | 13 / 1 | 当日增量未发现新核心论文（arXiv 约 UTC 0 点公告新提交） |
| 背景文献 | 44 | 53 | 增量筛查 128 条新记录，新增 9 条背景（均有纳入理由），118 条排除、1 条作为数据集链接 |
| 文献记录总数 | 58 | 67 | 58 条原记录元数据与原快照逐字段一致（校验脚本强制） |
| arXiv 查询 | 17 | 17 + 19 扩展 | 17 条原查询重跑结果总数完全一致（225 命中 / 197 去重）；19 条扩展中 4 条因返回量异常被规则拒绝 |
| GitHub 发现 | 1,082 | 1,108（重跑） | 新增 28 个未核验候选，均未纳入；先行综述仓库与官方 SDK 头提交无变化 |
| 证据记录 | — | 62 | 新建 |
| 仓库记录 | 30 + 81 | 109 | 两者重叠 2 个；4,666 个 README 外链仍为未核验候选，未进入任何计数 |

**对交接材料的更正**（已写入 CHANGELOG 与文稿附录 C）：
1. `jujumilk3/jev-calibration-audit` 实际为七组实验、约 7,000 次调用；“11,759”是其源数据集 MMLU-ProX 的规模，并非审计样本量。
2. 2609.23136 的“真实服务”是经**模拟** NR 网络访问的真实图像服务，按 hybrid（混合）测试记录。
3. this-that-model 权重地址为 `flock-io/this-that-model-1.0`（Hugging Face API 返回 200）；PDF 文本中的 `thisthat` 为换行造成的伪影。
4. 核心论文实际钉住的 Jev 版本：jev-1.13.0（3 篇）、jev-1.13 / “Jev 1.13”（4 篇）、typesafe/jev1.13 经 OpenRouter（1 篇）；另 3 篇调用托管 Jev 但未报告版本。

## 4. 相对已有 survey 的真实贡献与仍需验证之处

先行工作 *Decisions, Not Tokens*（youzizzz1028/Awesome-Jev，文内日期 2026-09-21，本轮复核其仓库头提交仍为 `f3703012`）已提出机器原生决策模型的伞形概念、五维分类与“结构合法 / 语义正确 / 概率可靠 / 决策效用”四层评价——本稿明确沿用并致谢该分层。

本稿的实际增量（均为可检查的产物，而非“首个”）：
- 覆盖先行草稿参考文献中没有的 13 篇近期核心实证论文，并落到 62 条带定位的证据记录；
- 按测量口径（单请求 / 摊销 / 端到端 / 模拟 / 作者估算 / 厂商声明）分组，拒绝跨口径排名；
- 六类读出方式的实现谱系 + 30 个资源的七字段开放性审计（“未找到”≠“不存在”）；
- 失效目录（12 类，含来源与缓解措施）与一个**提议**（未执行）的统一评测方案；
- 公开的检索日志、筛查理由与增量流程，所有表图可由脚本复算。

仍需验证：投稿前重跑 Q07/Q08/Q14 与学术搜索引擎的题名检索；复读先行草稿最新提交并更新 `docs/related-surveys.md`；引入第二位独立审稿人复筛。

## 5. 参考网站：学习了什么，改造了什么

- **观察**：2026-09-23 实际打开了指定网站（约 800px 与 1440px 宽度），并阅读固定提交 `5815804c` 的源码。线上页显示 421 条文献、六个可玩世界、无作者区；源码快照为 445 条、九个世界、含作者区与视频——二者不是同一部署版本。
- **继承**：深色场景式首页、左文右图、深浅交替章节、编辑式排版与三字体体系、概念→图谱→分类图鉴→交叉讨论→证据→文献室→贡献的阅读路径、数据驱动的计数与 README、CI 质量检查、可访问性细节。
- **重做为 Jev 专属**：原创 SVG 主视觉（state → typed question → 分布 → 置信门 → act/escalate，标注“示意，非实测”）；五个“主张所在位置”而非六角色；六类读出方式图鉴；七项发现 + 反证 + 研究×发现矩阵；可靠性实验室替代小游戏（每个面板标注 Illustrative 或 Reported）；开放生态矩阵替代项目图片；文献室增加证据抽屉与开放性筛选。
- **未复制**：游戏六角色、城堡/游戏图像、可玩游戏、421/445 计数、作者署名、视频与游戏综述 PDF。测试会在构建页面重新出现游戏领域字符串时失败。

## 6. 已运行的检查与结果

| 检查 | 结果 |
| --- | --- |
| `scripts/validate-data.py` | 通过（67 文献、62 证据、109 仓库；词表、引用、定位、缺失原因、原快照一致性） |
| `scripts/build.py --check` | 通过（生成文件与数据一致，构建幂等） |
| Python 单元测试 `python3 -m unittest discover -s tests` | 13/13 通过（计数不膨胀、4,666 候选不入库、无“已复现”、CSV 注入防护、README/CITATION 与数据一致、除已确认作者主页与本站网址外无参考站残留、署名在网站 / README / CITATION / 文稿中一致且无占位身份） |
| JS 单元测试 `node --test tests/*.test.mjs` | 7/7 通过（搜索、筛选、排序、CSV、URL/HTML 安全、URL 状态）。注：本机 Homebrew Node 缺失 ICU 库无法启动，测试通过 VS Code 自带的 Node 运行；GitHub Actions 上以 Node 22 运行并通过 |
| `scripts/check-links.py` | 本地与 GitHub Actions（“Link check” 手动触发一次）均为 219 个链接全部可达（含新增的仓库、作者主页与许可链接；arXiv 顺序限速检查），报告见 `reports/link-check.json` |
| `scripts/measure.py --budget` | 首次加载 409 KB 原始 / 80.3 KB gzip（不含网页字体），在 110 KB 预算内；首页不加载 PDF、4,666 候选或全量 JSON；证据数据 185.6 KB（gzip 34.5 KB）按需加载 |
| 浏览器实测（内置浏览器） | 桌面 1440×900、平板 768×1024 与手机 375×812：均无横向溢出；Tab/方向键切换、搜索、筛选、分页、抽屉（含焦点返回）、深链接、四个解释面板与升级模拟器均实际操作；控制台无错误。导出按钮的 CSV/BibTeX 逻辑由单元测试覆盖，未在浏览器中实际触发下载 |
| 搜索与筛选响应（浏览器实测） | 筛选重绘 0.4–2.7 ms；输入搜索到结果更新 95–106 ms（含 90 ms 防抖）；本地 DOMContentLoaded 153 ms（本机回环服务器，非网络实测）；记录于 `reports/browser-measurements.json` |
| 私有预览副本（本地复现 Artifact 外壳） | 以预览环境的页面外壳与文件布局在本地服务器实测：标题、字体、搜索（calibration → 26 条）、解释图、证据抽屉（加载 drawer.json、Esc 关闭后焦点返回）正常，控制台无错误，无横向溢出。线上预览页因内置浏览器未登录 claude.ai 未能直接打开核对 |
| 自动可访问性扫描 | 无缺失 alt、无无名按钮/链接、无重复 id、表单均有标签、标题层级无跳级（已修复两处） |
| 调色板校验（dataviz 校验器） | 浅色 / 深色三槽位全部通过色盲分离与对比度检查；浅色 aqua 对比不足 3:1，已通过直接标签与表格视图补偿 |
| LaTeX | `latexmk -xelatex` 成功，无未定义引用，剩 1 个轻微 overfull；标题页署名 Meng Luo（链接主页） |
| GitHub Actions “Validate and build” | 首次推送（`9d28a38`）与升级到 v7 Actions 后（`2018613`）均通过：数据校验、生成文件一致性、Python 与 JS 单元测试、页面体积预算；Node 20 弃用提示已随升级消除 |
| GitHub Pages 线上核对 | 首页、样式、脚本（含 `.mjs` 的 `text/javascript` 类型）、drawer.json、PDF、CSV、BibTeX 均返回 200；内置浏览器打开线上站点实测搜索（calibration → 26 条）、URL 状态、解释图、证据抽屉与深链接正常，控制台无错误，无横向溢出；首页仓库按钮与贡献卡片指向 GitHub 仓库与 issue 表单 |
| 仓库元数据 | GitHub 识别许可证为 MIT；`CITATION.cff` 通过 CFF 1.2.0 schema 校验；四个 issue 表单可解析，其引用的标签（add-paper / correction / resource-update / reproduction）已创建 |

**未运行**：Lighthouse 与线上 Core Web Vitals（站点已部署，但尚未做正式性能审计）；真机与屏幕阅读器人工测试；第二审稿人独立筛查；任何模型实验或复现（全部数值均为作者 / 厂商 / 社区报告）。

## 7. 维护者确认事项

已确认并落实：
1. **作者**：Meng Luo（主页 https://eurekaleo.github.io/）。由 `site.config.json` 统一提供给网站署名与 `<meta name="author">`、README、BibTeX、文稿标题页；`CITATION.cff` 同步，测试检查四处一致。未添加单位（未确认）。
2. **许可**：代码 MIT（`LICENSE`，GitHub 可识别）；原创文字、图表与整理后的数据 CC BY 4.0（`LICENSE-CONTENT.md`，含适用范围与建议署名）；第三方材料不在两者范围内（`NOTICE.md`）。
3. **远程仓库与网址**：https://github.com/Eurekaleo/awesome-jev-survey（公开）与 https://eurekaleo.github.io/awesome-jev-survey/ ；DOI 与 arXiv 编号仍为空，未虚构。
4. **arXiv 摘要**：已核对 arXiv API 使用条款（2026-09-23）：描述性元数据（明确包括标题、摘要、作者、标识符）以 CC0 1.0 提供，允许存储、转换与分享；`NOTICE.md` 已写明。

仍待办：
5. **下一次增量**：本轮增量完成于 2026-09-23 08:18 UTC；arXiv 下一次公告在 2026-09-24 00:00 UTC 左右。之后在 GitHub Actions 手动运行 “Literature increment”，或本地运行 `update-metadata.py` / `update-github.py`，人工筛查后更新数据。
6. **第二审稿人**复筛核心纳入与证据记录（见第 4 节）。

## 8. 发布记录与后续发布

2026-09-23 已执行：`git init -b main`、首个提交（作者 Meng Luo，邮箱为 GitHub noreply 地址）、`gh repo create Eurekaleo/awesome-jev-survey --public --source . --push`、通过 API 开启 Pages（`main` / 根目录）、添加仓库主题标签、创建 issue 标签、将 Actions 升级到 v7。

之后的每次更新：

```sh
python3 scripts/validate-data.py && python3 scripts/build.py && python3 -m unittest discover -s tests
git add -A && git commit -m "<变更说明>" && git push
```

推送后 “Validate and build” 自动校验，Pages 自动重新部署。论文重建：`python3 scripts/build-paper.py --pdf`（需要 matplotlib 与 TeX Live）。

## 9. 后续维护流程

1. `python3 scripts/update-metadata.py`、`python3 scripts/update-github.py` 生成新的日期目录（不会覆盖原快照）；也可在 GitHub Actions 手动运行 “Literature increment”。
2. 人工筛查 `new_candidates.json` 并写入 `screening.json`（附理由），把纳入记录加入 `data/`。
3. `python3 scripts/validate-data.py && python3 scripts/build.py`，更新 `CHANGELOG.md`，运行链接检查。
4. 每条新数值必须带定位、口径、样本量与版本；缺失值写 null 并注明原因。

## 10. 已知限制（摘要）

单一 AI 辅助审稿流程、非注册或 PRISMA 系统综述；文献检索以 arXiv API 元数据与 GitHub 为主；背景文献仅核到摘要；仓库只读未执行；无任何复现；五阶段与六类读出方式是分析框架，不代表任何商业模型架构。完整说明见 `docs/limitations.md`。
