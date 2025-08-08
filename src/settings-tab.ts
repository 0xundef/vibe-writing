import { App, PluginSettingTab, Setting } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ALL_MODELS } from "./settings";
import { translate, setLanguage, getAvailableLanguages } from "./i18n/language-manager";

export class AiAssistantSettingTab extends PluginSettingTab {
	plugin: AiAssistantPlugin;

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: translate('ui.settings-title') });

		// Language setting
		new Setting(containerEl)
			.setName(translate('settings.language'))
			.setDesc(translate('settings.language-desc'))
			.addDropdown((dropdown) => {
				const languages = getAvailableLanguages();
				languages.forEach((lang) => {
					dropdown.addOption(lang.code, lang.name);
				});
				dropdown
					.setValue(this.plugin.settings.language || 'en')
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
						setLanguage(value);
						// Refresh the settings tab to show updated translations
						this.display();
					});
			});

		new Setting(containerEl)
			.setName(translate('settings.openai-key'))
			.setDesc(translate('settings.openai-key-desc'))
			.addText((text) =>
				text
					.setPlaceholder(translate('placeholder.api-key'))
					.setValue(this.plugin.settings.openAIapiKey)
					.onChange(async (value) => {
						this.plugin.settings.openAIapiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(translate('settings.anthropic-key'))
			.setDesc(translate('settings.anthropic-key-desc'))
			.addText((text) =>
				text
					.setPlaceholder(translate('placeholder.api-key'))
					.setValue(this.plugin.settings.anthropicApiKey)
					.onChange(async (value) => {
						this.plugin.settings.anthropicApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(translate('settings.qwen-key'))
			.setDesc(translate('settings.qwen-key-desc'))
			.addText((text) =>
				text
					.setPlaceholder(translate('placeholder.api-key'))
					.setValue(this.plugin.settings.qwenApiKey)
					.onChange(async (value) => {
						this.plugin.settings.qwenApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(translate('settings.qwen-base-url'))
			.setDesc(translate('settings.qwen-base-url-desc'))
			.addText((text) =>
				text
					.setPlaceholder(translate('placeholder.base-url'))
					.setValue(this.plugin.settings.qwenBaseURL)
					.onChange(async (value) => {
						this.plugin.settings.qwenBaseURL = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(translate('settings.model'))
			.setDesc(translate('settings.model-desc'))
			.addDropdown((dropdown) => {
				Object.entries(ALL_MODELS).forEach(([key, value]) => {
					dropdown.addOption(key, value);
				});
				dropdown
					.setValue(this.plugin.settings.modelName)
					.onChange(async (value) => {
						this.plugin.settings.modelName = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Max Tokens")
			.setDesc("Maximum number of tokens to generate")
			.addText((text) =>
				text
					.setPlaceholder("1000")
					.setValue(this.plugin.settings.maxTokens.toString())
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							this.plugin.settings.maxTokens = numValue;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Image Folder")
			.setDesc("Folder to save compressed images")
			.addText((text) =>
				text
					.setPlaceholder("AiAssistant/Assets")
					.setValue(this.plugin.settings.imgFolder)
					.onChange(async (value) => {
						this.plugin.settings.imgFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image Compression Quality")
			.setDesc("Quality for image compression (0.1 - 1.0)")
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 1.0, 0.1)
					.setValue(this.plugin.settings.imageCompressionQuality)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.imageCompressionQuality = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image Max Width")
			.setDesc("Maximum width for compressed images")
			.addText((text) =>
				text
					.setPlaceholder("1920")
					.setValue(this.plugin.settings.imageMaxWidth.toString())
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							this.plugin.settings.imageMaxWidth = numValue;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Image Max Height")
			.setDesc("Maximum height for compressed images")
			.addText((text) =>
				text
					.setPlaceholder("1080")
					.setValue(this.plugin.settings.imageMaxHeight.toString())
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							this.plugin.settings.imageMaxHeight = numValue;
							await this.plugin.saveSettings();
						}
					}),
			);
	}
}