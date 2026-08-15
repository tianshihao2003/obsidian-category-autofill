/** 纯逻辑模块：不依赖 Obsidian API，可直接被 node:test 测试。 */

/** 路径任一段以 "." 开头（如 .obsidian、.trash）则视为隐藏目录。 */
export function isHiddenPath(path: string): boolean {
	return path.split("/").some((segment) => segment.startsWith("."));
}

/** 判断现有 category 值是否为空（缺失、null、空串、纯空白、空数组都算空）。 */
export function isEmptyCategory(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

/**
 * 判断路径是否在指定的根目录内。
 * baseFolder 为空或 "/" 表示不限制（整个库）；
 * 首尾斜杠会被规范化；同前缀目录（如 posts2）不会误匹配。
 */
export function isInBaseFolder(path: string, baseFolder: string): boolean {
	const base = baseFolder.trim().replace(/^\/+|\/+$/g, "");
	if (base === "") return true;
	if (path === base) return true;
	return path.startsWith(`${base}/`);
}

/** 返回本地今天的日期，格式 YYYY-MM-DD（不用 UTC，避免跨天偏差）。 */
export function todayString(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 解析一行「属性名: 值」的字面量值（不含占位符）。 */
function parseLiteral(value: string): unknown {
	if (value === "true") return true;
	if (value === "false") return false;
	if (/^-?\d+$/.test(value)) return Number(value);
	if (value.startsWith("[") && value.endsWith("]")) {
		const inner = value.slice(1, -1).trim();
		if (inner === "") return [];
		return inner.split(",").map((item) => {
			const t = item.trim();
			if (
				(t.startsWith('"') && t.endsWith('"')) ||
				(t.startsWith("'") && t.endsWith("'"))
			) {
				return t.slice(1, -1);
			}
			return t;
		});
	}
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

/**
 * 解析新建文章属性模板。
 * 每行一个「属性名: 值」；空行、# 注释、无冒号的行被跳过；重复键取最后一行。
 * 占位符：{{title}} / {{category}} / {{date}}；未知占位符按字面字符串处理。
 */
export function resolveTemplate(
	templateText: string,
	context: { title: string; category: string; date: string },
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const rawLine of templateText.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) continue;
		const sep = line.indexOf(":");
		if (sep <= 0) continue;
		let key = line.slice(0, sep).trim();
		const value = line.slice(sep + 1).trim();
		if (key === "") continue;
		if (
			(key.startsWith('"') && key.endsWith('"')) ||
			(key.startsWith("'") && key.endsWith("'"))
		) {
			key = key.slice(1, -1);
		}

		if (value === "{{title}}") result[key] = context.title;
		else if (value === "{{category}}") result[key] = context.category;
		else if (value === "{{date}}") result[key] = context.date;
		else result[key] = parseLiteral(value);
	}
	return result;
}

/**
 * 计算该文件应填入的 category 值。
 * 返回 null 表示跳过：库根目录文件或隐藏目录中的文件。
 */
export function getTargetCategory(
	path: string,
	parentName: string,
	parentIsRoot: boolean,
): string | null {
	if (parentIsRoot) return null;
	if (isHiddenPath(path)) return null;
	return parentName;
}

/**
 * 判断是否需要写入。
 * current === target 时不写（避免无意义文件改动）；
 * 覆盖开关关闭时仅在当前值为空的情况下写。
 */
export function shouldUpdateCategory(
	current: unknown,
	target: string,
	overwrite: boolean,
): boolean {
	if (current === target) return false;
	if (overwrite) return true;
	return isEmptyCategory(current);
}
