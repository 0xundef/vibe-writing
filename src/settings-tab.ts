import { App, PluginSettingTab, Setting } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ALL_MODELS } from "./settings";

export class AiAssistantSettingTab extends PluginSettingTab {
	plugin: AiAssistantPlugin;

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "AI Assistant Settings" });

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("Enter your OpenAI API key")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.openAIapiKey)
					.onChange(async (value) => {
						this.plugin.settings.openAIapiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Anthropic API Key")
			.setDesc("Enter your Anthropic API key")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.anthropicApiKey)
					.onChange(async (value) => {
						this.plugin.settings.anthropicApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Qwen API Key")
			.setDesc("Enter your Qwen API key")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.qwenApiKey)
					.onChange(async (value) => {
						this.plugin.settings.qwenApiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Qwen Base URL")
			.setDesc("Enter your Qwen Base URL")
			.addText((text) =>
				text
					.setPlaceholder("Enter your Base URL")
					.setValue(this.plugin.settings.qwenBaseURL)
					.onChange(async (value) => {
						this.plugin.settings.qwenBaseURL = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Choose the AI model to use")
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