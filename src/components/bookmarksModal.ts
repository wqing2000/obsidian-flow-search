// @ts-nocheck
import { App, Command, Notice, TFile, SuggestModal, renderResults, FuzzyMatch } from 'obsidian';
import { stringRegex, cmdFilterList } from '../utils';

function collectBookmarks(items: any[], result: any[] = []) {
	for (const item of items) {
		if (item.type === "file") {
			result.push(item);
		} else if (item.type === "group" && item.children) {
			collectBookmarks(item.children, result);
		}
	}
	return result;
}

const convertBookmarks = (bmList: Record<string, any>, _this): any[] => {
	return Object.values(bmList).map(bm => {
		const symbols = Object.getOwnPropertySymbols(bm);
		const parentSymbol = symbols.find(
			sym => sym.description === 'parent'
		) as symbol;

		return {
			...bm,
			parent: bm[parentSymbol],
			id: `bm:${bm.path}`,
			name: bm.name || bm.path,
			title: bm.name || bm.path,
			checkCallback: () => {
				const file = _this.app.vault.getAbstractFileByPath(bm.path);
				if (file instanceof TFile) {
					_this.app.workspace.openLinkText(bm.path, '', false);
					return true;
				}
				return false;
			}
		}
	});
}

export class BookmarksModal extends SuggestModal<any> {
	constructor(app: App) {
		super(app);
	}

	getItems(): any[] {
		const bmPlugin = this.app.internalPlugins.getPluginById("bookmarks");
		if (bmPlugin) {
			const bmList = collectBookmarks(bmPlugin.instance.bookmarks);
			return convertBookmarks(bmPlugin.instance.bookmarkLookup, this);
		}

		if (stringRegex.leadingBm.test(query)) {
			const list = this._getBookmarksList();
			console.log("bm 列表:", list);
			return list;
		}
		return [];
	}

	getItemText(item: any): string {
		return item.name;
	}

	renderSuggestion(match: FuzzyMatch<any>, el: HTMLElement) {
		const query = this.inputEl.value;
		const titleEl = el.createDiv();
		renderResults(titleEl, match.item.title, match.match);

		if (stringRegex.leadingBm.test(query)) {
			// const list = this.getBookmarksList();
			// console.log("bm 列表:", list);
			console.log('花红花火花红花火和');
			const titleEl = el.createDiv();
			renderResults(titleEl, match.item.name, match.match);
			return;
		}

		// Only render the matches in the author name.  
		const authorEl = el.createEl('small');
		const offset = -(match.item.title.length + 1);
		renderResults(authorEl, match.item.parent?.name || '', match.match, offset);
	}

	onChooseItem(item: any, evt: MouseEvent | KeyboardEvent) {
		if (item.checkCallback) {
			const success = item.checkCallback();
			if (success) {
				new Notice(`Opened bookmark: ${item.title}`);
			} else {
				new Notice(`Failed to open bookmark: ${item.title}`);
			}
		}
	}


	private _getBookmarksList(): any[] {
		const bmPlugin = this.app.internalPlugins.getPluginById("bookmarks");
		if (bmPlugin) {
			return convertBookmarks(bmPlugin.instance.bookmarkLookup, this);
		}
		return [];
	}
}