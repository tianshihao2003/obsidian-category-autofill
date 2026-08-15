import { Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder } from "obsidian";
import type { App } from "obsidian";
import { getTargetCategory, shouldUpdateCategory } from "./logic.ts";

interface CategoryAutofillSettings {
	overwriteExisting: boolean;
}

const DEFAULT_SETTINGS: CategoryAutofillSettings = {
	overwriteExisting: true,
};

/** 防抖时间（毫秒）：同一路径在此窗口内的重复事件只处理一次。 */
const DEBOUNCE_MS = 200;

type UpdateResult = "updated" | "skipped" | "failed";

export default class CategoryAutofillPlugin extends Plugin {
	settings: CategoryAutofillSettings = DEFAULT_SETTINGS;

	/** 防抖队列：路径 -> 待执行定时器。 */
	private pending = new Map<string, number>();

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.vault.on("create", (file) => this.handleCreate(file)),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) =>
				this.handleRename(file, oldPath),
			),
		);

		this.addSettingTab(new CategoryAutofillSettingTab(this.app, this));

		this.addCommand({
			id: "fill-all-categories",
			name: "自动填充 category（全库）",
			callback: () => {
				void this.runBatch();
			},
		});
	}

	onunload() {
		for (const timer of this.pending.values()) {
			window.clearTimeout(timer);
		}
		this.pending.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** 计算该文件的 category 目标值；需要跳过时返回 null。 */
	private targetFor(file: TFile): string | null {
		if (file.extension !== "md") return null;
		const parent = file.parent;
		if (!parent) return null;
		return getTargetCategory(file.path, parent.name, parent.isRoot());
	}

	/** 当前 category 值（来自元数据缓存；仅用于避免无意义写入的预判）。 */
	private currentCategory(file: TFile): unknown {
		return this.app.metadataCache.getFileCache(file)?.frontmatter?.category;
	}

	/**
	 * 唯一的写入入口：事件监听与批量命令共用。
	 * 预判（缓存值）用于跳过无意义写入；回调内二次判断兜底缓存过期的情况。
	 */
	async updateCategory(file: TFile): Promise<UpdateResult> {
		const target = this.targetFor(file);
		if (target === null) return "skipped";

		if (
			!shouldUpdateCategory(
				this.currentCategory(file),
				target,
				this.settings.overwriteExisting,
			)
		) {
			return "skipped";
		}

		try {
			let changed = false;
			await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
				if (
					shouldUpdateCategory(
						frontmatter.category,
						target,
						this.settings.overwriteExisting,
					)
				) {
					frontmatter.category = target;
					changed = true;
				}
			});
			return changed ? "updated" : "skipped";
		} catch (error) {
			console.error(`[category-autofill] 处理 ${file.path} 失败：`, error);
			return "failed";
		}
	}

	/** 防抖调度：同一路径的重复事件合并为一次处理。 */
	private schedule(path: string, action: () => void) {
		const existing = this.pending.get(path);
		if (existing !== undefined) {
			window.clearTimeout(existing);
		}
		const timer = window.setTimeout(() => {
			this.pending.delete(path);
			action();
		}, DEBOUNCE_MS);
		this.pending.set(path, timer);
	}

	private handleCreate(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		this.schedule(file.path, () => {
			void this.updateCategory(file);
		});
	}

	private handleRename(file: TAbstractFile, _oldPath: string) {
		if (file instanceof TFile) {
			this.schedule(file.path, () => {
				void this.updateCategory(file);
			});
			return;
		}
		if (file instanceof TFolder) {
			// 文件夹重命名：其下所有文件的父文件夹名已变，逐个更新。
			this.schedule(`dir:${file.path}`, () => {
				for (const markdownFile of this.filesUnder(file.path)) {
					void this.updateCategory(markdownFile);
				}
			});
		}
	}

	private filesUnder(folderPath: string): TFile[] {
		return this.app.vault
			.getMarkdownFiles()
			.filter((f) => f.path.startsWith(`${folderPath}/`));
	}

	/** 全库批量命令（Task 4 中挂到 addCommand）。 */
	async runBatch() {
		const files = this.app.vault.getMarkdownFiles();
		let updated = 0;
		let skipped = 0;
		let failed = 0;

		for (const file of files) {
			const result = await this.updateCategory(file);
			if (result === "updated") updated += 1;
			else if (result === "skipped") skipped += 1;
			else failed += 1;
		}

		new Notice(
			`category 填充完成：更新 ${updated} 个 / 跳过 ${skipped} 个 / 失败 ${failed} 个`,
		);
	}
}

class CategoryAutofillSettingTab extends PluginSettingTab {
	private plugin: CategoryAutofillPlugin;

	constructor(app: App, plugin: CategoryAutofillPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("覆盖已有的 category 值")
			.setDesc(
				"开启时总是把 category 同步为文件夹名；关闭时只在 category 为空时填充。",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.overwriteExisting)
					.onChange(async (value) => {
						this.plugin.settings.overwriteExisting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
