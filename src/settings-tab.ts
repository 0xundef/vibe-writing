import { App, PluginSettingTab, Setting } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ALL_MODELS } from "./settings";
import { translate } from "./i18n/language-manager"; // Remove setLanguage and getAvailableLanguages
import { ImageSettingsManager } from "./image-settings";

export class AiAssistantSettingTab extends PluginSettingTab {
	plugin: AiAssistantPlugin;
	private imageSettingsManager: ImageSettingsManager;

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.imageSettingsManager = new ImageSettingsManager(plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: translate('ui.settings-title') });

		// Model Configuration Section
		containerEl.createEl("h3", { text: "Model configuration" }); // Line 25

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

		// Add Base URI setting
		new Setting(containerEl)
			.setName("Base URI")
			.setDesc("Base URI for API requests (leave empty for default)")
			.addText((text) =>
				text
					.setPlaceholder("https://api.openai.com/v1")
					.setValue(this.plugin.settings.qwenBaseURL || "")
					.onChange(async (value) => {
						this.plugin.settings.qwenBaseURL = value;
						await this.plugin.saveSettings();
					}),
			);

		// Add API Key setting
		new Setting(containerEl)
			.setName("API Key")
			.setDesc("API key for the selected model")
			.addText((text) =>
				text
					.setPlaceholder("Enter your API key")
					.setValue(this.plugin.settings.openAIapiKey || this.plugin.settings.anthropicApiKey || this.plugin.settings.qwenApiKey || "")
					.onChange(async (value) => {
						// Update the appropriate API key based on selected model
						if (this.plugin.settings.modelName.includes("claude")) {
							this.plugin.settings.anthropicApiKey = value;
						} else if (this.plugin.settings.modelName.includes("qwen")) {
							this.plugin.settings.qwenApiKey = value;
						} else {
							this.plugin.settings.openAIapiKey = value;
						}
						await this.plugin.saveSettings();
					}),
			);

		// Image Processing Settings (optional - uncomment to enable)
		// this.imageSettingsManager.addImageSettingsHeader(containerEl);
		// this.imageSettingsManager.addImageSettings(containerEl);

		// Support Section
		containerEl.createEl("h3", { text: "Support the project" }); // Line 98

		const supportDesc = containerEl.createEl("p", {
			text: "If you find Vibe Writing helpful, consider supporting its development:",
			cls: "vibe-writing-support-desc",
		});

		const coffeeContainer = containerEl.createDiv({ cls: "vibe-writing-coffee-container" });
		const coffeeLink = coffeeContainer.createEl("a", {
			href: "https://buymeacoffee.com/0xundef",
			attr: { target: "_blank", rel: "noopener" },
		});
		coffeeLink.createEl("img", {
			attr: {
				src: "https://cdn.buymeacoffee.com/buttons/v2/default-violet.png",
				alt: "Buy Me A Coffee"
			},
			cls: "vibe-writing-coffee-button-img"
		});

		// Add thank you message
		const thankYouMsg = containerEl.createEl("p", {
			text: "Your support helps maintain and improve this plugin. Thank you! ☕",
			cls: "vibe-writing-thank-you-msg",
		});
		thankYouMsg.style.textAlign = "center";
		thankYouMsg.style.marginTop = "10px";
		thankYouMsg.style.color = "var(--text-muted)";
		thankYouMsg.style.fontSize = "0.9em";
	}
}