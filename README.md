# Category Autofill

自动把笔记 frontmatter 中的 `category` 属性填充为该文件**直接父文件夹**的名称，让分类与目录结构保持一致。

## 功能

- **自动监听**：新建 md 文件、移动/重命名文件、重命名文件夹时，实时更新其下文件的 `category`。
- **批量命令**：命令面板执行「自动填充 category（全库）」，一键修复所有历史文件，结束后提示「更新 X 个 / 跳过 Y 个 / 失败 Z 个」。命令幂等，可重复执行。
- **设置项**：「覆盖已有的 category 值」，默认开启。关闭时只在 `category` 为空时填充。

## 行为规则（自动监听与批量命令一致）

- 只处理 Markdown 文件。
- 库根目录的文件不处理。
- 隐藏目录（路径任一段以 `.` 开头，如 `.obsidian`、`.trash`）内的文件不处理。
- 多层子文件夹只取**直接父文件夹名**：`技术分享/前端/x.md` → `category: 前端`。
- `category` 已等于文件夹名时不写入，文件内容零改动。

## 安装

1. 构建：`pnpm install && pnpm build`，产物为 `main.js`。
2. 在库目录 `.obsidian/plugins/` 下新建文件夹 `category-autofill`，拷入 `main.js` 和 `manifest.json`。
3. 重启 Obsidian，在「设置 → 第三方插件」中启用「Category Autofill」。

## 验收清单

1. 在子文件夹新建 md 文件 → category 自动填为文件夹名。
2. 把文件拖到另一个文件夹 → category 变为新文件夹名。
3. 重命名文件夹 → 其下所有文件的 category 变为新文件夹名。
4. 执行全库命令 → 历史文件被批量修复，Notice 计数正确。
5. 关闭「覆盖已有值」后手动填一个 category → 再移动文件，手动值不被覆盖。
6. 库根目录文件、隐藏文件夹（`.obsidian` 等）内文件 → 均不被改动。
7. category 已等于文件夹名 → 文件内容无任何改动。
8. 非 md 文件（图片、PDF）→ 不被改动。

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
