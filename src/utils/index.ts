
export const stringRegex = {
	/** Match all strings whose first character is a space */
	leadingSpace: /^ +.*$/,
	/** Match all strings whose first character is bm */
	leadingBm: /^bm.*$/,
	/** Match all strings whose first character is cmd */
	leadingCmd: /^cmd.*$/,
}

export const FlowSearchPluginId = "flow-search:open-flow-search";

export const cmdFilterList = new Set<string>([
	// "command-palette:open",
	// "command-palette:close",
	// "command-palette:execute",
	"switcher:open",
	FlowSearchPluginId
])