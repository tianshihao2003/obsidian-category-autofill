import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getTargetCategory,
	isEmptyCategory,
	isHiddenPath,
	isInBaseFolder,
	resolveTemplate,
	shouldUpdateCategory,
	todayString,
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

describe("todayString", () => {
	it("返回 YYYY-MM-DD 格式的本地日期", () => {
		assert.match(todayString(), /^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("resolveTemplate", () => {
	const ctx = { title: "我的新文章", category: "技术分享", date: "2026-08-15" };

	it("默认模板：五个属性类型正确", () => {
		const result = resolveTemplate(
			[
				"title: {{title}}",
				"published: {{date}}",
				"tags: []",
				"category: {{category}}",
				'description: ""',
			].join("\n"),
			ctx,
		);
		assert.deepEqual(result, {
			title: "我的新文章",
			published: "2026-08-15",
			tags: [],
			category: "技术分享",
			description: "",
		});
	});

	it("占位符：{{title}}/{{category}}/{{date}} 被替换", () => {
		const result = resolveTemplate("title: {{title}}\ncategory: {{category}}", ctx);
		assert.equal(result.title, "我的新文章");
		assert.equal(result.category, "技术分享");
	});

	it("字面量解析：布尔、数组、数字、引号字符串、普通字符串", () => {
		const result = resolveTemplate(
			[
				"draft: false",
				"pinned: true",
				"order: 3",
				'tags: ["a", "b"]',
				"empty: []",
				"'quoted': '值'",
				"plain: 随便写的文字",
			].join("\n"),
			ctx,
		);
		assert.equal(result.draft, false);
		assert.equal(result.pinned, true);
		assert.equal(result.order, 3);
		assert.deepEqual(result.tags, ["a", "b"]);
		assert.deepEqual(result.empty, []);
		assert.equal(result["quoted"], "值");
		assert.equal(result.plain, "随便写的文字");
	});

	it("无效行被跳过：空行、注释、无冒号、空键", () => {
		const result = resolveTemplate(
			["", "# 注释", "没有冒号的行", ": 空键", "ok: 1"].join("\n"),
			ctx,
		);
		assert.deepEqual(result, { ok: 1 });
	});

	it("重复键取最后一行", () => {
		const result = resolveTemplate("title: 第一个\n\ntitle: 第二个", ctx);
		assert.equal(result.title, "第二个");
	});

	it("未知占位符按字面字符串处理", () => {
		const result = resolveTemplate("note: {{unknown}}", ctx);
		assert.equal(result.note, "{{unknown}}");
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
