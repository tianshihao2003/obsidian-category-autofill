# AGENTS.md — Category Autofill 插件开发规范

**回复语言：全程中文。** 本文件是插件的唯一权威开发规范。任何 AI / 人修改此插件前，必须先读本文件。

## 项目简介

Obsidian 插件「Category Autofill」：

- 把文章 frontmatter 的 `category` 自动填充为**直接父文件夹名**（自动监听 + 全库批量命令）
- 在文章根目录内新建文件时，自动补上模板属性（默认 `title` / `published` / `tags` / `category` / `description`，模板可在设置里改）
- 零运行时依赖；纯逻辑层（`logic.ts`）带 `node:test` 单元测试

## 位置与仓库

- 项目根目录：本目录（`plug-in/Obsidian/obsidian-category-autofill`，博客仓库已通过 `/plug-in/` 忽略，不随博客提交）
- 独立 git 仓库，`origin = https://github.com/tianshihao2003/obsidian-category-autofill.git`
- 仓库 local 已配置 git user（dumplingandcake），直接 `git commit` / `git push` 即可
- GitHub 走 FlClash 代理（git 全局已配 `http.proxy=http://127.0.0.1:7890`）；FlClash 未开时推不上去，提醒用户开代理

## 命令

```bash
pnpm install      # pnpm 11 / Node 24；若报 confirmModulesPurge 无 TTY 错误，加 --config.confirmModulesPurge=false
pnpm dev          # esbuild 监听模式，每次重建后自动拷贝到 Obsidian 库
pnpm build        # typecheck + esbuild + 自动拷贝到 Obsidian 库
pnpm test         # node:test 单元测试（改 logic.ts 必跑）
pnpm typecheck    # 仅类型检查
```

## 完成一项改动后的强制流程（禁止跳过任何一步）

1. 改 `logic.ts` 的纯逻辑 → **先**在 `logic.test.ts` 加测试（TDD），`pnpm test` 全绿
2. 跑 `pnpm build`，确认输出 `[copy-to-vault] 已拷贝到 ...\src\.obsidian\plugins\category-autofill`
3. `git add` + `git commit`（格式 `<type>(<scope>): <描述>`，如 `feat(template): ...`、`fix(scope): ...`）+ `git push`
4. **必须提醒用户**：在 Obsidian 里执行「Ctrl+P → 重新加载应用」新版本才生效——不提醒的话用户测到的是旧版，会误报 bug

## 核心行为红线（历史教训，违反会造成大量误改）

1. **只处理「文章根目录」（设置 `baseFolder`，默认 `content/posts`）内的 md 文件**，目录外一律跳过。事件监听、批量命令、新建模板三条路径共用同一个限制。教训：曾因无此限制误改 275 个文件，靠 git 回退才修复——**不要重蹈覆辙**。
2. 跳过规则：库根目录文件、隐藏目录（路径任一段以 `.` 开头）、非 md 文件。
3. `category` 已等于文件夹名时不写入（零无意义改动）。
4. 新建文章模板**只补缺失的属性，绝不覆盖已有值**；`category` 遵循「覆盖已有值」设置。
5. 事件监听与批量命令必须共用同一套判定/写入逻辑（`updateCategory` / `applyCreateTemplate`），禁止出现两套行为。

## 架构约束

- 纯逻辑一律放 `logic.ts`（可被 `node:test` 直接运行；禁止 enum/namespace；import 带 `.ts` 后缀），`main.ts` 只做 Obsidian API 接线
- frontmatter 读写只用 Obsidian 官方 `fileManager.processFrontMatter()`，**禁止手写 YAML 解析/拼接**
- 新增设置项必须带默认值（`Object.assign` 合并，老 `data.json` 自动迁移）
- 构建自动拷贝的目标库在 `esbuild.config.mjs` 顶部 `VAULT_PATHS` 数组（要加库改这里）
- 监听器用 `registerEvent` 注册；防抖 200ms；`onunload` 清理定时器，防内存泄漏

## 已知边界

- 文件在编辑器中有未保存正文改动时，`processFrontMatter` 写盘会重载编辑器并丢弃未保存正文（Obsidian 官方 API 通用行为，README 已注明）
- 本开发环境无法运行 Obsidian 桌面端：动态行为需用户按 README 的验收清单在真实库里实测；静态层面（测试/类型/构建/审查）必须全部通过才能交付

## 交付物

- `main.js`（构建产物，gitignore）+ `manifest.json` + `versions.json`，由构建自动拷入 `src/.obsidian/plugins/category-autofill/`
- README.md 同步维护：功能、设置项、行为规则、验收清单、已知边界
