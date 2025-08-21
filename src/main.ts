import {
	MarkdownView,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import {
	AnthropicAssistant,
	OpenAIAssistant,
	QwenAssistant,
} from "./openai_api";
import { AiAssistantSettings, DEFAULT_SETTINGS, ImprovementOption } from "./types";
import { AIPromptModal, EditSuggestionModal } from "./modals";
import { ImprovementSuggester } from "./suggester";
import { AiAssistantSettingTab } from "./settings-tab";
import { translate, initializeLanguage } from "./i18n/language-manager";

export default class AiAssistantPlugin extends Plugin {
	settings: AiAssistantSettings;
	aiAssistant: OpenAIAssistant;
	lastSelection: { text: string; from: any; to: any; editor: any } | null =
		null;
	lastAiResponse: string | null = null;
	lastQuoteBlockRange: { from: any; to: any; editor: any } | null = null;
	statusBarItem: HTMLElement | null = null;

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
		// Remove debug console.log
		
		try {
			await this.loadSettings();
		
			// Initialize language manager
			initializeLanguage(this.settings.language);
		
			// Initialize suggestions if empty
			if (
				!this.settings.suggestions ||
				this.settings.suggestions.length === 0
			) {
				this.settings.suggestions = this.getDefaultSuggestions();
				await this.saveSettings();
			}
			// Remove the orphaned object literal completely (lines 70-80)
			
			this.build_api();
			// Also remove this console.log for production
			// Line 83 - Remove this debug log:
			// console.log("✅ AI Assistant Plugin: API client built successfully");
			
			// Add status bar item
			this.statusBarItem = this.addStatusBarItem();
			this.updateStatusBar(translate('status.initializing'));
	
			// Set to ready after initialization
			setTimeout(() => {
				this.updateStatusBar(translate('status.ready'));
			}, 100);
	
			// Add command to improve previous selection with suggester
			this.addCommand({
				id: "ai-written",
				name: translate('command.written-improvement'),
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(
							translate('notice.no-selection'),
						);
						return;
					}
	
					// Open suggester modal to choose improvement type
					const suggester = new ImprovementSuggester(this.app, this);
					suggester.open();
				},
			});
	
			// Add command to compress images
			// this.addCommand({
			// 	id: "compress-image",
			// 	name: translate('command.compress-images'),
			// 	callback: async () => {
			// 		await this.compressImagesInCurrentNote();
			// 	},
			// });
	
			// Add command to create new prompt
			this.addCommand({
				id: "new-prompt",
				name: translate('command.new-prompt'),
				callback: async () => {
					// Create a new empty prompt option
					const newOption: ImprovementOption = {
						id: Date.now().toString(), // Simple ID generation
						name: "",
						description: "",
						prompt: "",
					};
	
					// Open edit modal for the new prompt
					const editModal = new EditSuggestionModal(
						this.app,
						this,
						newOption,
						async (updatedOption: ImprovementOption) => {
							// Only save if name and prompt are not empty
							if (
								updatedOption.name.trim() &&
								updatedOption.prompt.trim()
							) {
								this.settings.suggestions.push(updatedOption);
								await this.saveSettings();
								new Notice(
									translate('notice.prompt-added-success', { name: updatedOption.name }),
								);
							} else {
								new Notice(translate('notice.name-prompt-empty'));
							}
						},
						undefined, // No delete callback for new prompts
						translate('modal.add-new-prompt'),
					);
					editModal.open();
				},
			});
	
			// Add command to open edit modal
			this.addCommand({
				id: "one-shot-chat",
				name: translate('command.one-shot-chat'),
				callback: async () => {
					const activeView =
						this.app.workspace.getActiveViewOfType(MarkdownView);
					let initialContent = "";
	
					// If there's a text selection, use it as initial content
					if (activeView && activeView.editor) {
						const selection = activeView.editor.getSelection();
						if (selection) {
							initialContent = selection;
						}
					}
	
					const aiModal = new AIPromptModal(
						this.app,
						this,
						initialContent,
					);
					aiModal.open();
				},
			});
	
			// Add command to replace original text with last AI response
			this.addCommand({
				id: "replace-with-ai",
				name: translate('command.replace-ai-response'),
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(
							translate('notice.no-selection'),
						);
						return;
					}
	
					if (!this.lastAiResponse) {
						new Notice(
							translate('notice.no-ai-response'),
						);
						return;
					}
	
					if (!this.lastSelection.editor) {
						new Notice(translate('notice.editor-not-available'));
						return;
					}
	
					// First delete the quote block if it exists
					if (
						this.lastQuoteBlockRange &&
						this.lastQuoteBlockRange.editor
					) {
						this.lastQuoteBlockRange.editor.replaceRange(
							"",
							this.lastQuoteBlockRange.from,
							this.lastQuoteBlockRange.to,
						);
						// Clear the quote block range after deletion
						this.lastQuoteBlockRange = null;
					}
	
					// Then replace the original text with the AI response
					this.lastSelection.editor.replaceRange(
						this.lastAiResponse,
						this.lastSelection.from,
						this.lastSelection.to,
					);
	
					// Calculate the end position of the newly inserted text
					const newTextEnd = {
						line:
							this.lastSelection.from.line +
							this.lastAiResponse.split("\n").length -
							1,
						ch:
							this.lastAiResponse.split("\n").length === 1
								? this.lastSelection.from.ch +
									this.lastAiResponse.length
								: this.lastAiResponse.split("\n").pop()
										?.length || 0,
					};
	
					// Select the newly inserted text to highlight it
					this.lastSelection.editor.setSelection(
						this.lastSelection.from,
						newTextEnd,
					);
	
					new Notice("Text replaced with AI response!");
				},
			});
	
			// Register event to capture text selections
			this.registerDomEvent(document, "selectionchange", () => {
				this.captureSelection();
			});
	
			this.addSettingTab(new AiAssistantSettingTab(this.app, this));
	
			console.log(
				"🎉 AI Assistant Plugin: Successfully loaded with all commands and settings!",
			);
		} catch (error) {
			console.error("❌ AI Assistant Plugin: Failed to load", error);
			throw error;
		}
	}

	onunload() {
		// Remove: console.log("🔌 AI Assistant Plugin: Unloaded!");
		// Add any cleanup code if needed
	}

	updateStatusBar(status: string) {
		if (this.statusBarItem) {
			this.statusBarItem.setText(`Vibe Writing: ${status}`);

			// Add visual styling based on status
			this.statusBarItem.removeClass(
				"vibe-writing-ready",
				"vibe-writing-processing",
				"vibe-writing-error",
			);
			if (status === "Ready") {
				this.statusBarItem.addClass("vibe-writing-ready");
			} else if (
				status.includes("Processing") ||
				status.includes("Initializing")
			) {
				this.statusBarItem.addClass("vibe-writing-processing");
			} else if (status.includes("Error") || status.includes("Timeout")) {
				this.statusBarItem.addClass("vibe-writing-error");
			}
		}
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

	getDefaultSuggestions(): ImprovementOption[] {
		return [
			{
				id: "general",
				name: translate('suggestion.english-improvement.name'),
				description: translate('suggestion.english-improvement.desc'),
				prompt: translate('suggestion.english-improvement.prompt'),
			},
		];
	}

	captureSelection() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.editor) {
			return;
		}

		const editor = activeView.editor;
		const selection = editor.getSelection();

		if (selection && selection.trim().length > 0) {
			const from = editor.getCursor("from");
			const to = editor.getCursor("to");

			this.lastSelection = {
				text: selection,
				from: from,
				to: to,
				editor: editor,
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

		let content = await this.app.vault.read(file);
		const imageRegex = /!\[\[([^\]]+\.(jpg|jpeg|png|gif|bmp|webp))\]\]/gi;
		const matches = Array.from(content.matchAll(imageRegex));

		if (matches.length === 0) {
			new Notice("No images found in the current note.");
			return;
		}

		let compressedCount = 0;
		const totalImages = matches.length;
		const replacements: { original: string; compressed: string }[] = [];

		new Notice(`Found ${totalImages} images. Starting compression...`);

		for (const match of matches) {
			const imagePath = match[1];
			try {
				const imageFile =
					this.app.vault.getAbstractFileByPath(imagePath);
				if (imageFile instanceof TFile) {
					const compressedPath = await this.compressImage(imageFile);
					if (compressedPath) {
						compressedCount++;
						replacements.push({
							original: imagePath,
							compressed: compressedPath,
						});
					}
				}
			} catch (error) {
				console.error(`Error compressing image ${imagePath}:`, error);
			}
		}

		// Update note content with new compressed image paths
		for (const replacement of replacements) {
			content = content.replace(
				new RegExp(
					`!\\[\\[${replacement.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]`,
					"g",
				),
				`![[${replacement.compressed}]]`,
			);
		}

		// Save updated content
		if (replacements.length > 0) {
			await this.app.vault.modify(file, content);
		}

		new Notice(
			`Compression complete! ${compressedCount}/${totalImages} images compressed.`,
		);
	}

	async compressImage(file: TFile): Promise<string | null> {
		try {
			const arrayBuffer = await this.app.vault.readBinary(file);
			const originalSize = arrayBuffer.byteLength;

			// Create image element
			const img = new Image();
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				console.error("Could not get canvas context");
				return null;
			}

			return new Promise((resolve) => {
				img.onload = async () => {
					// Calculate new dimensions
					let { width, height } = this.calculateNewDimensions(
						img.width,
						img.height,
						this.settings.imageMaxWidth,
						this.settings.imageMaxHeight,
					);

					// Set canvas dimensions
					canvas.width = width;
					canvas.height = height;

					// Draw and compress
					ctx.drawImage(img, 0, 0, width, height);

					// Convert to blob
					canvas.toBlob(
						async (blob) => {
							if (!blob) {
								resolve(null);
								return;
							}

							const compressedSize = blob.size;

							// Only save if compression actually reduced file size
							if (compressedSize < originalSize) {
								// Generate new filename with compression parameters
								const quality = Math.round(
									this.settings.imageCompressionQuality * 100,
								);
								const maxDim = `${this.settings.imageMaxWidth}x${this.settings.imageMaxHeight}`;
								const actualDim = `${width}x${height}`;

								const fileExtension = file.extension;
								const baseName = file.basename;
								const newFileName = `${baseName}_compressed_q${quality}_max${maxDim}_${actualDim}.jpg`;
								const newFilePath = file.path.replace(
									file.name,
									newFileName,
								);

								const compressedArrayBuffer =
									await blob.arrayBuffer();
								await this.app.vault.createBinary(
									newFilePath,
									compressedArrayBuffer,
								);

								const savedBytes =
									originalSize - compressedSize;
								const savedPercentage = (
									(savedBytes / originalSize) *
									100
								).toFixed(1);
								console.log(
									`Compressed ${file.name} -> ${newFileName}: ${this.formatBytes(savedBytes)} saved (${savedPercentage}%)`,
								);
								resolve(newFilePath);
							} else {
								console.log(
									`Skipped ${file.name}: no size reduction achieved`,
								);
								resolve(null);
							}
						},
						"image/jpeg",
						this.settings.imageCompressionQuality,
					);
				};

				img.onerror = () => {
					console.error(`Failed to load image: ${file.name}`);
					resolve(null);
				};

				// Create blob URL from array buffer
				const blob = new Blob([arrayBuffer]);
				img.src = URL.createObjectURL(blob);
			});
		} catch (error) {
			console.error(`Error compressing ${file.name}:`, error);
			return null;
		}
	}

	calculateNewDimensions(
		originalWidth: number,
		originalHeight: number,
		maxWidth: number,
		maxHeight: number,
	): { width: number; height: number } {
		if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
			return { width: originalWidth, height: originalHeight };
		}

		const widthRatio = maxWidth / originalWidth;
		const heightRatio = maxHeight / originalHeight;
		const ratio = Math.min(widthRatio, heightRatio);

		return {
			width: Math.round(originalWidth * ratio),
			height: Math.round(originalHeight * ratio),
		};
	}

	formatBytes(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
}
