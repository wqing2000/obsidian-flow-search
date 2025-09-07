import { App, Plugin, PluginSettingTab, Setting, prepareFuzzySearch, debounce, Command } from 'obsidian';
import { FlowSearchModal } from './components/FlowSearchModal';
import { cmdFilterList } from './utils';

interface CommandConfig {
	disenabled: boolean;
}

interface FlowSearchPluginSettings {
	commands: Record<string, CommandConfig>;
}

const DEFAULT_SETTINGS: FlowSearchPluginSettings = {
	commands: {},
}

export default class FlowSearchPlugin extends Plugin {
	settings: FlowSearchPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-flow-search',
			name: 'Open Flow Search',
			callback: () => {
				new FlowSearchModal(this.app).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FlowSearchSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class FlowSearchSettingTab extends PluginSettingTab {
	plugin: FlowSearchPlugin;
	searchQuery = '';
	commandsContainerEl: HTMLDivElement | null = null;
	cmds: Command[] = [];

	constructor(app: App, plugin: FlowSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 配置说明
		containerEl.createEl("h2", { text: "命令配置" });
		containerEl.createEl("p", {
			text: "在这里可以为 Obsidian 命令设置 keyword 和是否禁用。" +
				"多个命令可以共享同一个 keyword。只有未禁用的命令才会显示在自定义面板中。",
		});

		// 分组容器
		const groupEl = containerEl.createDiv();
		groupEl.createEl("h3", { text: "所有命令" });
		groupEl.addClass("command-settings-group");

		const debounced = debounce((value: string) => {
			this.searchQuery = value;
			this._renderCommandList(); // 只刷新命令列表
		}, 300, true);

		new Setting(groupEl)
			.setName("搜索命令")
			.addText((text) => {
				text.setPlaceholder("输入id或名称过滤…")
					.setValue(this.searchQuery)
					.onChange(debounced);
			});

		const allCommands = this.app.commands.listCommands();
		this.cmds = allCommands.filter(cmd => !cmdFilterList.has(cmd.id)); // 过滤掉命令面板命令

		// 创建命令列表容器
		const cmdsContainerEl = containerEl.createDiv();
		cmdsContainerEl.addClass("commands-container");
		this.commandsContainerEl = cmdsContainerEl;

		this._renderCommandList();
	}

	private _renderCommandList(): void {
		if (!this.commandsContainerEl) return;
		const container = this.commandsContainerEl;
		container.empty();

		// 模糊搜索 (prepareFuzzySearch)
		let filtered = this.cmds;
		if (this.searchQuery.trim() !== "") {
			const fuzzySearch = prepareFuzzySearch(this.searchQuery);
			filtered = this.cmds
				.map((cmd) => {
					const nameMatch = fuzzySearch(cmd.name);
					const idMatch = fuzzySearch(cmd.id);
					const score = (nameMatch?.score ?? 0) + (idMatch?.score ?? 0);
					return { cmd, score };
				})
				.filter(x => x.score < 0)// 没匹配的排除
				.sort((a, b) => b.score - a.score)// 按匹配分数降序
				.map(x => x.cmd);
		}

		if (filtered.length === 0) return;

		filtered.forEach((cmd) => {
			const conf = this.plugin.settings.commands[cmd.id] ?? { disenabled: false };
			new Setting(container)
				.setName(cmd.name)
				.setDesc(`ID: ${cmd.id}`)
				.addToggle(toggle => {
					toggle.setValue(conf.disenabled)
						.onChange(async value => {
							this.plugin.settings.commands[cmd.id] = { ...conf, disenabled: value };
							await this.plugin.saveSettings();
						});
				});
		});
	}
}
