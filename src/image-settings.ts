import { Setting } from "obsidian";
import type AiAssistantPlugin from "./main";

export class ImageSettingsManager {
	plugin: AiAssistantPlugin;

	constructor(plugin: AiAssistantPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Add image processing settings to the container
	 * @param containerEl - The container element to add settings to
	 */
	addImageSettings(containerEl: HTMLElement): void {
		// Image Folder setting
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

		// Image Compression Quality setting
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

		// Image Max Width setting
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

		// Image Max Height setting
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

	/**
	 * Add a section header for image settings
	 * @param containerEl - The container element to add the header to
	 */
	addImageSettingsHeader(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: "Image Processing Settings" });
	}
}