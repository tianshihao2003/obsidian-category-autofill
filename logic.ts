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
