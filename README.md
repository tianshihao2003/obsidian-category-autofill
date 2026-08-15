# Category Autofill

自动把笔记 frontmatter 中的 `category` 属性填充为该文件**直接父文件夹**的名称，让分类与目录结构保持一致。

## 功能

- **自动监听**：新建 md 文件、移动/重命名文件、重命名文件夹时，实时更新其下文件的 `category`。
- **新建文章自动属性**：在文章根目录内新建 Markdown 文件时，自动补上模板中缺失的属性（默认 `title`、`published`、`tags`、`category`、`description`），模板可在设置里自由修改。
- **批量命令**：命令面板执行「自动填充 category（全库）」，一键修复所有历史文件，结束后提示「更新 X 个 / 跳过 Y 个 / 失败 Z 个」。命令幂等，可重复执行。
- **设置项**：
  - 「文章根目录」：只处理该目录内的 Markdown 文件（相对库根目录，默认 `content/posts`），留空表示整个库。
  - 「覆盖已有的 category 值」：默认开启。关闭时只在 `category` 为空时填充。
  - 「新建文章时自动添加属性」：开关，默认开启。
  - 「新建文章属性模板」：每行一个「属性名: 值」，只补缺失的属性（不覆盖已有值）。支持占位符 `{{title}}`（文件名）、`{{category}}`（父文件夹名）、`{{date}}`（今天日期，格式 YYYY-MM-DD）。值支持布尔（true/false）、数组（`[]`、`[a, b]`）、数字、引号字符串、普通字符串。

## 行为规则（自动监听与批量命令一致）

- 只处理「文章根目录」内的 Markdown 文件，目录外的文件一律不动。
- 库根目录的文件不处理。
- 隐藏目录（路径任一段以 `.` 开头，如 `.obsidian`、`.trash`）内的文件不处理。
- 多层子文件夹只取**直接父文件夹名**：`技术分享/前端/x.md` → `category: 前端`。
- `category` 已等于文件夹名时不写入，文件内容零改动。

## 安装

1. 构建：`pnpm install && pnpm build`，产物为 `main.js`。
2. 在库目录 `.obsidian/plugins/` 下新建文件夹 `category-autofill`，拷入 `main.js` 和 `manifest.json`。
3. 重启 Obsidian，在「设置 → 第三方插件」中启用「Category Autofill」。

### 自动拷贝（已配置）

构建脚本（`esbuild.config.mjs`）内置了自动拷贝：每次 `pnpm build` 或 `pnpm dev`（监听模式，改代码后自动重新构建）都会把 `main.js`、`manifest.json`、`versions.json` 拷入 `VAULT_PATHS` 数组里列出的每个库的 `.obsidian/plugins/category-autofill/` 目录。当前配置的目标库是博客仓库的 `src` 库；要增加或更换库，修改 `esbuild.config.mjs` 顶部的 `VAULT_PATHS` 数组即可。

注意：拷贝后需要在 Obsidian 里「重新加载应用」（命令面板搜 reload）或重启，改动才会生效。

## 验收清单

1. 在子文件夹新建 md 文件 → category 自动填为文件夹名。
2. 在文章根目录内新建 md 文件 → 自动带上模板属性（title=文件名、published=今天日期、tags=[]、category=父文件夹名、description=""）。
3. 新建文件时自带 frontmatter（如用模板插件创建）→ 已有属性不被覆盖，只补缺失的。
4. 把文件拖到另一个文件夹 → category 变为新文件夹名。
5. 重命名文件夹 → 其下所有文件的 category 变为新文件夹名。
6. 执行全库命令 → 历史文件被批量修复，Notice 计数正确。
7. 关闭「覆盖已有值」后手动填一个 category → 再移动文件，手动值不被覆盖。
8. 库根目录文件、隐藏文件夹（`.obsidian` 等）内文件 → 均不被改动。
9. 「文章根目录」之外的文件（如 `content/album`、`content/bangumi`）→ 均不被改动（新建时也不会添加属性）。
10. category 已等于文件夹名 → 文件内容无任何改动。
11. 非 md 文件（图片、PDF）→ 不被改动。

## 已知边界

- 文件在编辑器中有**未保存的正文改动**时，若被写入（新建/移动/批量命令命中），编辑器会重载并丢弃未保存改动。这是 Obsidian 官方 `processFrontMatter` API 的通用行为，非本插件独有；建议操作前先保存正在编辑的文件。
- 无 frontmatter 的文件会自动创建 frontmatter（官方 API 行为）。

## 开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 监听模式构建
pnpm build        # 类型检查 + 生产构建
pnpm typecheck    # 仅类型检查
pnpm test         # node:test 单元测试（纯逻辑模块）
```
