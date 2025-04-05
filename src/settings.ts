import { PluginSettingTab, Setting, debounce, normalizePath, TFolder, FuzzySuggestModal } from 'obsidian';
import type { App } from 'obsidian';

import type ParaWorkflower from 'main';
import type { PluginSettings } from './types';

export const DEFAULT_SETTINGS: PluginSettings = {
	projectsPath: '1-Projects',
	useFolderStructure: false,
	areasPath: '2-Areas',
	useCompanionDir: true,
	resourcesPath: '3-Resources',
	archivePath: '4-Archive',

	templatesFolder: 'Templates',
	projectTemplateName: 'Project Template',
	areaTemplateName: 'Area Template',
	resourceTemplateName: 'Resource Template',
};

// Helper function to get all folders in the vault
function getAllFolders(app: App): string[] {
	const folders: string[] = [];
	
	function recurseFolder(folder: TFolder): void {
		// Add the current folder path
		folders.push(folder.path);
		
		// Recursively process subfolders
		folder.children.forEach(child => {
			if (child instanceof TFolder) {
				recurseFolder(child);
			}
		});
	}
	
	// Start with the root folder
	if (app.vault.getRoot()) {
		recurseFolder(app.vault.getRoot());
	}
	
	// Sort folders alphabetically
	return folders.sort();
}

// Modal for fuzzy searching folders
class FolderSuggestModal extends FuzzySuggestModal<string> {
	currentValue: string;
	onChoose: (folderPath: string) => void;
	folders: string[];
	
	constructor(app: App, currentValue: string, onChoose: (folderPath: string) => void) {
		super(app);
		this.currentValue = currentValue;
		this.onChoose = onChoose;
		this.folders = getAllFolders(this.app);
		
		// Set placeholder text
		this.setPlaceholder("Type to search for folders...");
		
		// Allow creating new folders if they don't exist
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select folder" },
			{ command: "Esc", purpose: "Cancel" }
		]);
	}
	
	getItems(): string[] {
		return this.folders;
	}
	
	getItemText(folderPath: string): string {
		return folderPath;
	}
	
	onChooseItem(folderPath: string, evt: MouseEvent | KeyboardEvent): void {
		this.onChoose(folderPath);
	}
	
	// Add support for creating new folders if input doesn't match existing folders
	onClose() {
		const value = this.inputEl.value;
		if (value && !this.folders.includes(value) && this.currentValue !== value) {
			this.onChoose(normalizePath(value));
		}
	}
}

export class SettingTab extends PluginSettingTab {
	plugin: ParaWorkflower;

	constructor(app: App, plugin: ParaWorkflower) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Helper method to create a searchable folder setting
	createSearchableFolderSetting(containerEl: HTMLElement, name: string, desc: string, 
		currentValue: string, defaultValue: string, 
		onChange: (value: string) => Promise<void>) {
		
		const setting = new Setting(containerEl)
			.setName(name)
			.setDesc(desc);
		
			// Create a button that opens the folder search modal
		setting.addButton(button => {
			button
				.setButtonText(currentValue || defaultValue)
				.setClass("para-folder-path")
				.onClick(() => {
					// Open the fuzzy search modal for folder selection
					const modal = new FolderSuggestModal(
						this.app,
						currentValue,
						async (newFolderPath) => {
							// Update button text
							button.setButtonText(newFolderPath);
							// Save the new value
							await onChange(newFolderPath);
						}
					);
					modal.open();
				});
		});
		
		return setting;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

			// PARA Folders Section
		containerEl.createEl('h3', { text: 'PARA Folder Structure' });
		
		// Projects folder with searchable dropdown
		this.createSearchableFolderSetting(
			containerEl,
			'Projects folder',
			'Where to place your projects?',
			this.plugin.settings.projectsPath,
			DEFAULT_SETTINGS.projectsPath,
			async (value) => {
				this.plugin.settings.projectsPath = value;
				await this.plugin.saveSettings();
			}
		);

		// Areas folder with searchable dropdown
		this.createSearchableFolderSetting(
			containerEl,
			'Areas folder',
			'Where to place your areas?',
			this.plugin.settings.areasPath,
			DEFAULT_SETTINGS.areasPath,
			async (value) => {
				this.plugin.settings.areasPath = value;
				await this.plugin.saveSettings();
			}
		);

		// Resources folder with searchable dropdown
		this.createSearchableFolderSetting(
			containerEl,
			'Resources folder',
			'Where to place your resources?',
			this.plugin.settings.resourcesPath,
			DEFAULT_SETTINGS.resourcesPath,
			async (value) => {
				this.plugin.settings.resourcesPath = value;
				await this.plugin.saveSettings();
			}
		);

		// Archive folder with searchable dropdown
		this.createSearchableFolderSetting(
			containerEl,
			'Archive folder',
			'Where to place your archived files?',
			this.plugin.settings.archivePath,
			DEFAULT_SETTINGS.archivePath,
			async (value) => {
				this.plugin.settings.archivePath = value;
				await this.plugin.saveSettings();
			}
		);

		// Templates Section - add a divider
		containerEl.createEl('hr');
		containerEl.createEl('h3', { text: 'Templates' });

		// Templates folder with searchable dropdown
		this.createSearchableFolderSetting(
			containerEl,
			'Templates folder',
			'Where to find your templates?',
			this.plugin.settings.templatesFolder,
			DEFAULT_SETTINGS.templatesFolder,
			async (value) => {
				this.plugin.settings.templatesFolder = value;
				await this.plugin.saveSettings();
			}
		);

		new Setting(containerEl).setName('Project template name')
			.setDesc('Name of the project template file (without extension)')
			.addText((text) => text
				.setPlaceholder(DEFAULT_SETTINGS.projectTemplateName)
				.setValue(this.plugin.settings.projectTemplateName)
				.onChange(
					debounce(async (value) => {
						this.plugin.settings.projectTemplateName = value;
						await this.plugin.saveSettings();
					}, 500)
				)
			);

		new Setting(containerEl).setName('Area template name')
			.setDesc('Name of the area template file (without extension)')
			.addText((text) => text
				.setPlaceholder(DEFAULT_SETTINGS.areaTemplateName)
				.setValue(this.plugin.settings.areaTemplateName)
				.onChange(
					debounce(async (value) => {
						this.plugin.settings.areaTemplateName = value;
						await this.plugin.saveSettings();
					}, 500)
				)
			);

		new Setting(containerEl).setName('Resource template name')
			.setDesc('Name of the resource template file (without extension)')
			.addText((text) => text
				.setPlaceholder(DEFAULT_SETTINGS.resourceTemplateName)
				.setValue(this.plugin.settings.resourceTemplateName)
				.onChange(
					debounce(async (value) => {
						this.plugin.settings.resourceTemplateName = value;
						await this.plugin.saveSettings();
					}, 500)
				)
			);
			
		// Additional Options Section
		containerEl.createEl('hr');
		containerEl.createEl('h3', { text: 'Additional Options' });
		
		new Setting(containerEl).setName('Use folder structure for projects')
			.setDesc('Create project folders instead of using single project file.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.useFolderStructure)
				.onChange(async (value) => {
					this.plugin.settings.useFolderStructure = value;
					await this.plugin.saveSettings();
					this.display();
				})
			);
			
		new Setting(containerEl).setName('Enable area companion folder')
			.setDesc('Folder name `_<name_of_area>` which contains directly related notes to this area.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.useCompanionDir)
				.onChange(async (value) => {
					this.plugin.settings.useCompanionDir = value;
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
