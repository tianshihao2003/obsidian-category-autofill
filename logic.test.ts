import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getTargetCategory,
	isEmptyCategory,
	isHiddenPath,
	isInBaseFolder,
	shouldUpdateCategory,
} from "./logic.ts";

describe("isHiddenPath", () => {
	it("普通路径返回 false", () => {
		assert.equal(isHiddenPath("技术分享/前端/x.md"), false);
		assert.equal(isHiddenPath("x.md"), false);
	});

	it("隐藏目录返回 true", () => {
		assert.equal(isHiddenPath(".obsidian/plugins/x.md"), true);
		assert.equal(isHiddenPath("技术分享/.trash/x.md"), true);
	});

	it("隐藏文件本身也算隐藏路径", () => {
		assert.equal(isHiddenPath(".hidden.md"), true);
	});
});

describe("isEmptyCategory", () => {
	it("缺失、null、空串、纯空白、空数组视为空", () => {
		assert.equal(isEmptyCategory(undefined), true);
		assert.equal(isEmptyCategory(null), true);
		assert.equal(isEmptyCategory(""), true);
		assert.equal(isEmptyCategory("   "), true);
		assert.equal(isEmptyCategory([]), true);
	});

	it("非空值不算空", () => {
		assert.equal(isEmptyCategory("前端"), false);
		assert.equal(isEmptyCategory(["前端"]), false);
		assert.equal(isEmptyCategory(0), false);
	});
});

describe("getTargetCategory", () => {
	it("根目录文件跳过（即使父名为库名）", () => {
		assert.equal(getTargetCategory("x.md", "我的库", true), null);
	});

	it("隐藏目录中的文件跳过", () => {
		assert.equal(getTargetCategory(".obsidian/x.md", "obsidian", false), null);
	});

	it("子文件夹文件返回直接父文件夹名", () => {
		assert.equal(getTargetCategory("技术分享/前端/x.md", "前端", false), "前端");
	});
});

describe("isInBaseFolder", () => {
	it("根目录内的文件返回 true（含恰好位于根目录的文件）", () => {
		assert.equal(
			isInBaseFolder("content/posts/技术分享/x.md", "content/posts"),
			true,
		);
		assert.equal(isInBaseFolder("content/posts/x.md", "content/posts"), true);
	});

	it("根目录外的文件返回 false（不误匹配同前缀目录）", () => {
		assert.equal(isInBaseFolder("content/album/x.md", "content/posts"), false);
		assert.equal(isInBaseFolder("content/posts2/x.md", "content/posts"), false);
		assert.equal(isInBaseFolder("x.md", "content/posts"), false);
	});

	it("空值表示不限制（整个库）", () => {
		assert.equal(isInBaseFolder("任意/路径/x.md", ""), true);
		assert.equal(isInBaseFolder("任意/路径/x.md", "   "), true);
	});

	it("首尾斜杠会被规范化", () => {
		assert.equal(isInBaseFolder("content/posts/x.md", "/content/posts/"), true);
	});
});

describe("shouldUpdateCategory", () => {
	const target = "前端";

	it("值已等于目标值时不写", () => {
		assert.equal(shouldUpdateCategory("前端", target, true), false);
	});

	it("覆盖开启时总是写", () => {
		assert.equal(shouldUpdateCategory("后端", target, true), true);
		assert.equal(shouldUpdateCategory("", target, true), true);
	});

	it("覆盖关闭时仅在为空时写", () => {
		assert.equal(shouldUpdateCategory("", target, false), true);
		assert.equal(shouldUpdateCategory("后端", target, false), false);
		assert.equal(shouldUpdateCategory(undefined, target, false), true);
	});
});
