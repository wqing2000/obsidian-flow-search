import "obsidian";

declare module "obsidian" {
	interface App {
		commands: CommandManager;
		internalPlugins: InternalPluginManager;
		plugins: PluginManager;
	}

	interface InternalPluginManager {
		getPlugin(id: string): InternalPlugin | null;
	}

	interface InternalPlugin {
		id: string;
		name: string;
		instance: Record<string, any>;
	}

	interface PluginManager {
		getPlugin(id: string): CommunityPlugin;
	}

	interface CommunityPlugin {
		id: string;
		name: string;
		instance: Record<string, any>;
		settings: Record<string, any>;
	}

	interface CommandManager {
		listCommands(): Command[];
		executeCommandById(id: string): boolean;
	}
}