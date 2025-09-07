import { App, Command, Notice, TFile, FuzzySuggestModal, renderResults, FuzzyMatch } from 'obsidian';
import { stringRegex, cmdFilterList } from '../utils';


/** Alfred 风格搜索 Modal，样式与 Obsidian 命令面板一致 */
export class FlowSearchModal extends FuzzySuggestModal<Command> {
	selectedIdx = 0;
	allNotes: TFile[] = [];
	appCommands: Command[] = [];
	/** 插件内筛选后的列表 */
	flowSearchCommands: Command[] = [];

	constructor(app: App) {
		super(app);
		this.setPlaceholder("Search commands…");
		this.emptyStateText = "No matching commands";

		this.appCommands = this._getObsidianListCommands();
		this.flowSearchCommands = this._getCommands(this.appCommands);
	}

	getItems(): Command[] {
		const query = this.inputEl.value;

		if (stringRegex.leadingSpace.test(query)) {
			this._executeCommandById("switcher:open");
		}
		// if (stringRegex.leadingCmd.test(query)) {
		// 	this._executeCommandById("command-palette:open");
		// }

		return this.flowSearchCommands;
	}

	getItemText(item: Command): string {
		return item.name + `__${item.id}`;
	}

	renderSuggestion(match: FuzzyMatch<Command>, el: HTMLElement) {
		const titleEl = el.createDiv();
		renderResults(titleEl, match.item.name, match.match);

		const idEl = el.createEl('small');
		const offset = -(match.item.name.length + 1);
		renderResults(idEl, `${match.item.id}`, match.match, offset);
	}

	onChooseItem(item: Command, evt: MouseEvent | KeyboardEvent) {
		const isCheckMode = typeof item.checkCallback === 'function';
		const callback = isCheckMode
			? item.checkCallback
			: item?.callback;

		//@ts-ignore
		const isSuccess = typeof callback === 'function' ? callback() : false;

		if (isCheckMode && !isSuccess) {
			console.log("Chosen Command", item);
			// 如果有 checkCallback，则说明是需要检查的命令，执行后给出反馈
			new Notice(`运行结果：${isSuccess ? '成功' : '失败'}`);
		}
	}

	private _getCommands(commands: Command[]): Command[] {
		const cmds = commands?.filter(cmd => !cmdFilterList.has(cmd.id)); // 过滤掉命令面板命令

		const flowSearchConf = this._getCommunityPluginById("flow-search").settings;
		const { commands: flowSearchCommands } = flowSearchConf;

		return cmds.filter((cmd) => {
			const conf = flowSearchCommands[cmd.id];
			return conf?.disenabled ? false : true;
		});
	}

	/** Get obsidian commands list */
	private _getObsidianListCommands(): Command[] {
		return this.app.commands.listCommands();
	}

	// private _getObsidianCoreCommands() {
	// 	const { recentCommands, options } = this._getInternalPluginById("command-palette").instance;
	// 	const { pinned } = options;

	// 	return {
	// 		recentCommands,
	// 		pinned
	// 	}
	// }

	private _executeCommandById(id: string) {
		this.close();
		this.app.commands.executeCommandById(id);
	}

	private _getInternalPluginById(id: string) {
		return this.app.internalPlugins.getPlugin(id);
	}

	private _getCommunityPluginById(id: string) {
		return this.app.plugins.getPlugin(id);
	}
}
