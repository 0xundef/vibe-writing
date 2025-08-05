import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	SuggestModal,
	TFile,
} from "obsidian";
import { AnthropicAssistant, OpenAIAssistant, QwenAssistant } from "./openai_api";
import {
	ALL_MODELS,
	DEFAULT_IMAGE_MODEL,
	DEFAULT_OAI_IMAGE_MODEL,
	DEFAULT_MAX_TOKENS,
} from "./settings";

interface AiAssistantSettings {
	mySetting: string;
	openAIapiKey: string;
	anthropicApiKey: string;
	qwenApiKey: string;
	qwenBaseURL: string;
	modelName: string;
	imageModelName: string;
	maxTokens: number;
	replaceSelection: boolean;
	imgFolder: string;
	language: string;
	imageCompressionQuality: number;
	imageMaxWidth: number;
	imageMaxHeight: number;
}

const DEFAULT_SETTINGS: AiAssistantSettings = {
	mySetting: "default",
	openAIapiKey: "",
	anthropicApiKey: "",
	qwenApiKey: "",
	qwenBaseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
	modelName: DEFAULT_OAI_IMAGE_MODEL,
	imageModelName: DEFAULT_IMAGE_MODEL,
	maxTokens: DEFAULT_MAX_TOKENS,
	replaceSelection: true,
	imgFolder: "AiAssistant/Assets",
	language: "",
	imageCompressionQuality: 0.8,
	imageMaxWidth: 1920,
	imageMaxHeight: 1080,
};

interface ImprovementOption {
	id: string;
	name: string;
	description: string;
	prompt: string;
}

class ImprovementSuggester extends SuggestModal<ImprovementOption> {
	plugin: AiAssistantPlugin;
	options: ImprovementOption[];

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app);
		this.plugin = plugin;
		this.options = [
			{
				id: "general",
				name: "General Improvement",
				description: "Improve clarity, grammar, and overall quality",
				prompt: "Please revise and improve the following text while maintaining its original meaning and intent. Focus on clarity, grammar, and overall quality:"
			},
			{
				id: "formal",
				name: "Make More Formal",
				description: "Convert to formal, professional tone",
				prompt: "Please rewrite the following text in a more formal and professional tone while maintaining its original meaning:"
			},
			{
				id: "casual",
				name: "Make More Casual",
				description: "Convert to casual, conversational tone",
				prompt: "Please rewrite the following text in a more casual and conversational tone while maintaining its original meaning:"
			},
			{
				id: "concise",
				name: "Make More Concise",
				description: "Shorten while keeping key information",
				prompt: "Please make the following text more concise and to the point while preserving all important information:"
			},
			{
				id: "detailed",
				name: "Add More Detail",
				description: "Expand with additional context and examples",
				prompt: "Please expand the following text with more detail, context, and examples while maintaining its core message:"
			},
			{
				id: "academic",
				name: "Academic Style",
				description: "Convert to academic writing style",
				prompt: "Please rewrite the following text in an academic style with proper citations format and scholarly tone:"
			}
		];
	}

	getSuggestions(query: string): ImprovementOption[] {
		return this.options.filter(option =>
			option.name.toLowerCase().includes(query.toLowerCase()) ||
			option.description.toLowerCase().includes(query.toLowerCase())
		);
	}

	renderSuggestion(option: ImprovementOption, el: HTMLElement) {
		el.createEl("div", { text: option.name, cls: "suggestion-title" });
		el.createEl("small", { text: option.description, cls: "suggestion-note" });
	}

	async onChooseSuggestion(option: ImprovementOption, evt: MouseEvent | KeyboardEvent) {
		if (!this.plugin.lastSelection) {
			new Notice("No previous selection found. Please select some text first.");
			return;
		}

		try {
			const prompt = `${option.prompt}\n\n${this.plugin.lastSelection.text}`;
			
			const answer = await this.plugin.aiAssistant.text_api_call([
				{
					role: "user",
					content: prompt,
				},
			]);

			if (answer && this.plugin.lastSelection.editor) {
				// Replace the previous selection with the improved text
				this.plugin.lastSelection.editor.replaceRange(
					answer.trim(),
					this.plugin.lastSelection.from,
					this.plugin.lastSelection.to
				);
				new Notice(`Text improved using ${option.name}!`);
			} else {
				new Notice("Failed to improve text. Please try again.");
			}
		} catch (error) {
			console.error("Error improving text:", error);
			new Notice("Error occurred while improving text.");
		}
	}
}

export default class AiAssistantPlugin extends Plugin {
	settings: AiAssistantSettings;
	aiAssistant: OpenAIAssistant;
	lastSelection: { text: string; from: any; to: any; editor: any } | null = null;

	build_api() {
		if (this.settings.modelName.includes("claude")) {
			this.aiAssistant = new AnthropicAssistant(
				this.settings.openAIapiKey,
				this.settings.anthropicApiKey,
				this.settings.modelName,
				this.settings.maxTokens,
			);
		} else if (this.settings.modelName.includes("qwen")) {
			this.aiAssistant = new QwenAssistant(
				this.settings.openAIapiKey,
				this.settings.qwenApiKey,
				this.settings.modelName,
				this.settings.maxTokens,
				this.settings.qwenBaseURL,
			);
		} else {
			this.aiAssistant = new OpenAIAssistant(
				this.settings.openAIapiKey,
				this.settings.modelName,
				this.settings.maxTokens,
			);
		}
	}

	async onload() {
		console.log("🚀 AI Assistant Plugin: Starting to load...");
		
		try {
			await this.loadSettings();
			console.log("✅ AI Assistant Plugin: Settings loaded successfully", {
				modelName: this.settings.modelName,
				imageModelName: this.settings.imageModelName,
				maxTokens: this.settings.maxTokens,
				hasOpenAIKey: !!this.settings.openAIapiKey,
				hasAnthropicKey: !!this.settings.anthropicApiKey,
				hasQwenKey: !!this.settings.qwenApiKey,
				qwenBaseURL: this.settings.qwenBaseURL
			});
			
			this.build_api();
			console.log("✅ AI Assistant Plugin: API client built successfully");

			// Add command to improve previous selection with suggester
			this.addCommand({
				id: "ai-written",
				name: "AI: written improvement",	
				callback: async () => {
					if (!this.lastSelection) {
						new Notice("No previous selection found. Please select some text first.");
						return;
					}

					// Open suggester modal to choose improvement type
			const suggester = new ImprovementSuggester(this.app, this);
			suggester.open();
		},
	});

			// Add command to compress images
			this.addCommand({
				id: "compress-images",
				name: "Compress Images in Current Note",
				callback: async () => {
					await this.compressImagesInCurrentNote();
				},
			});

			// Register event to capture text selections
			this.registerDomEvent(document, 'selectionchange', () => {
				this.captureSelection();
			});

			this.addSettingTab(new AiAssistantSettingTab(this.app, this));
			
			console.log("🎉 AI Assistant Plugin: Successfully loaded with all commands and settings!");
		} catch (error) {
			console.error("❌ AI Assistant Plugin: Failed to load", error);
			throw error;
		}
	}

	onunload() {
		console.log("👋 AI Assistant Plugin: Unloading plugin...");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	captureSelection() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.editor) {
			return;
		}

		const editor = activeView.editor;
		const selection = editor.getSelection();
		
		if (selection && selection.trim().length > 0) {
			const from = editor.getCursor('from');
			const to = editor.getCursor('to');
			
			this.lastSelection = {
				text: selection,
				from: from,
				to: to,
				editor: editor
			};
		}
	}

	async compressImagesInCurrentNote() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("No active markdown view found.");
			return;
		}

		const file = activeView.file;
		if (!file) {
			new Notice("No file is currently open.");
			return;
		}

		const content = await this.app.vault.read(file);
		const imageRegex = /!\[\[([^\]]+\.(jpg|jpeg|png|gif|bmp|webp))\]\]/gi;
		const matches = Array.from(content.matchAll(imageRegex));

		if (matches.length === 0) {
			new Notice("No images found in the current note.");
			return;
		}

		let compressedCount = 0;
		const totalImages = matches.length;

		new Notice(`Found ${totalImages} images. Starting compression...`);

		for (const match of matches) {
			const imagePath = match[1];
			try {
				const imageFile = this.app.vault.getAbstractFileByPath(imagePath);
				if (imageFile instanceof TFile) {
					const compressed = await this.compressImage(imageFile);
					if (compressed) {
						compressedCount++;
					}
				}
			} catch (error) {
				console.error(`Error compressing image ${imagePath}:`, error);
			}
		}

		new Notice(`Compression complete! ${compressedCount}/${totalImages} images compressed.`);
	}

	async compressImage(file: TFile): Promise<boolean> {
		try {
			const arrayBuffer = await this.app.vault.readBinary(file);
			const originalSize = arrayBuffer.byteLength;

			// Create image element
			const img = new Image();
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				console.error('Could not get canvas context');
				return false;
			}

			return new Promise((resolve) => {
				img.onload = async () => {
					// Calculate new dimensions
					let { width, height } = this.calculateNewDimensions(
						img.width,
						img.height,
						this.settings.imageMaxWidth,
						this.settings.imageMaxHeight
					);

					// Set canvas dimensions
					canvas.width = width;
					canvas.height = height;

					// Draw and compress
					ctx.drawImage(img, 0, 0, width, height);

					// Convert to blob
					canvas.toBlob(async (blob) => {
						if (!blob) {
							resolve(false);
							return;
						}

						const compressedSize = blob.size;
						
						// Only save if compression actually reduced file size
						if (compressedSize < originalSize) {
							const compressedArrayBuffer = await blob.arrayBuffer();
							await this.app.vault.modifyBinary(file, compressedArrayBuffer);
							
							const savedBytes = originalSize - compressedSize;
							const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(1);
							console.log(`Compressed ${file.name}: ${this.formatBytes(savedBytes)} saved (${savedPercentage}%)`);
							resolve(true);
						} else {
							console.log(`Skipped ${file.name}: no size reduction achieved`);
							resolve(false);
						}
					}, 'image/jpeg', this.settings.imageCompressionQuality);
				};

				img.onerror = () => {
					console.error(`Failed to load image: ${file.name}`);
					resolve(false);
				};

				// Create blob URL from array buffer
				const blob = new Blob([arrayBuffer]);
				img.src = URL.createObjectURL(blob);
			});
		} catch (error) {
			console.error(`Error compressing ${file.name}:`, error);
			return false;
		}
	}

	calculateNewDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
		if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
			return { width: originalWidth, height: originalHeight };
		}

		const widthRatio = maxWidth / originalWidth;
		const heightRatio = maxHeight / originalHeight;
		const ratio = Math.min(widthRatio, heightRatio);

		return {
			width: Math.round(originalWidth * ratio),
			height: Math.round(originalHeight * ratio)
		};
	}

	formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

class AiAssistantSettingTab extends PluginSettingTab {
	plugin: AiAssistantPlugin;

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Settings for my AI assistant." });

		new Setting(containerEl).setName("OpenAI API Key").addText((text) =>
			text
				.setPlaceholder("Enter OpenAI key here")
				.setValue(this.plugin.settings.openAIapiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAIapiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl).setName("Anthropic API Key").addText((text) =>
			text
				.setPlaceholder("Enter Anthropic key here")
				.setValue(this.plugin.settings.anthropicApiKey)
				.onChange(async (value) => {
					this.plugin.settings.anthropicApiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl).setName("Qwen API Key").addText((text) =>
			text
				.setPlaceholder("Enter Qwen/DashScope API key here")
				.setValue(this.plugin.settings.qwenApiKey)
				.onChange(async (value) => {
					this.plugin.settings.qwenApiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl)
			.setName("Qwen Base URL")
			.setDesc("Custom endpoint for Qwen models (leave default for Alibaba Cloud)")
			.addText((text) =>
				text
					.setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1")
					.setValue(this.plugin.settings.qwenBaseURL)
					.onChange(async (value) => {
						this.plugin.settings.qwenBaseURL = value || "https://dashscope.aliyuncs.com/compatible-mode/v1";
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);
		containerEl.createEl("h3", { text: "Text Assistant" });

		containerEl.createEl("h3", { text: "Image Compression" });

		new Setting(containerEl)
			.setName("Image Compression Quality")
			.setDesc("Quality of compressed images (0.1 = lowest quality, 1.0 = highest quality)")
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 1.0, 0.1)
					.setValue(this.plugin.settings.imageCompressionQuality)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.imageCompressionQuality = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Maximum Image Width")
			.setDesc("Maximum width for compressed images (pixels)")
			.addText((text) =>
				text
					.setPlaceholder("1920")
					.setValue(this.plugin.settings.imageMaxWidth.toString())
					.onChange(async (value) => {
						const intValue = parseInt(value);
						if (!intValue || intValue <= 0) {
							new Notice("Error: Please enter a valid positive number for max width");
						} else {
							this.plugin.settings.imageMaxWidth = intValue;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Maximum Image Height")
			.setDesc("Maximum height for compressed images (pixels)")
			.addText((text) =>
				text
					.setPlaceholder("1080")
					.setValue(this.plugin.settings.imageMaxHeight.toString())
					.onChange(async (value) => {
						const intValue = parseInt(value);
						if (!intValue || intValue <= 0) {
							new Notice("Error: Please enter a valid positive number for max height");
						} else {
							this.plugin.settings.imageMaxHeight = intValue;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Model Name")
			.setDesc("Select your model")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(ALL_MODELS)
					.setValue(this.plugin.settings.modelName)
					.onChange(async (value) => {
						this.plugin.settings.modelName = value;
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);

		new Setting(containerEl)
			.setName("Max Tokens")
			.setDesc("Select max number of generated tokens")
			.addText((text) =>
				text
					.setPlaceholder("Max tokens")
					.setValue(this.plugin.settings.maxTokens.toString())
					.onChange(async (value) => {
						const int_value = parseInt(value);
						if (!int_value || int_value <= 0) {
							new Notice("Error while parsing maxTokens ");
						} else {
							this.plugin.settings.maxTokens = int_value;
							await this.plugin.saveSettings();
							this.plugin.build_api();
						}
					}),
			);

		const div = containerEl.createDiv({ cls: "coffee-container" });
		div.createEl("a", {
			href: "https://buymeacoffee.com/nilisnone",
		}).createEl("img", {
			attr: {
				src: "https://cdn.buymeacoffee.com/buttons/v2/default-violet.png",
			},
			cls: "coffee-button-img",
		});
	}
}
