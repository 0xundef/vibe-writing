import { MarkdownView, Notice, Plugin, TFile, SuggestModal } from "obsidian";
import {
	AnthropicAssistant,
	OpenAIAssistant,
	QwenAssistant,
} from "./openai_api";
import {
	AiAssistantSettings,
	DEFAULT_SETTINGS,
	ImprovementOption,
} from "./types";
import { AIPromptModal, EditSuggestionModal } from "./modals";
import { ImprovementSuggester } from "./suggester";
import { AiAssistantSettingTab } from "./settings-tab";
import { translate, initializeLanguage } from "./i18n/language-manager";

export default class AiAssistantPlugin extends Plugin {
	settings: AiAssistantSettings;
	// Update the type declaration at the top of the class
	aiAssistant: OpenAIAssistant | null = null;
	lastSelection: { text: string; from: any; to: any; editor: any } | null =
		null;
	lastAiResponse: string | null = null;
	lastQuoteBlockRange: { from: any; to: any; editor: any } | null = null;
	statusBarItem: HTMLElement | null = null;

	build_api() {
		// Check if we have the necessary API key before building
		let hasValidKey = false;
		
		if (this.settings.modelName.includes("claude")) {
			hasValidKey = !!(this.settings.anthropicApiKey && this.settings.anthropicApiKey.trim() !== "");
			if (hasValidKey) {
				this.aiAssistant = new AnthropicAssistant(
					this.settings.openAIapiKey,
					this.settings.anthropicApiKey,
					this.settings.modelName,
					this.settings.maxTokens,
				);
			}
		} else if (this.settings.modelName.includes("qwen")) {
			hasValidKey = !!(this.settings.qwenApiKey && this.settings.qwenApiKey.trim() !== "");
			if (hasValidKey) {
				this.aiAssistant = new QwenAssistant(
					this.settings.openAIapiKey,
					this.settings.qwenApiKey,
					this.settings.modelName,
					this.settings.maxTokens,
					this.settings.qwenBaseURL,
				);
			}
		} else {
			hasValidKey = !!(this.settings.openAIapiKey && this.settings.openAIapiKey.trim() !== "");
			if (hasValidKey) {
				this.aiAssistant = new OpenAIAssistant(
					this.settings.openAIapiKey,
					this.settings.modelName,
					this.settings.maxTokens,
				);
			}
		}
		
		if (!hasValidKey) {
			this.aiAssistant = null;
		}
	}

	async onload() {
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
			this.build_api();
			// Add status bar item
			this.statusBarItem = this.addStatusBarItem();
			this.updateStatusBar(translate("status.initializing"));

			// Set to ready after initialization
			setTimeout(() => {
				this.updateStatusBar(translate("status.ready"));
			}, 100);

			// Add command to improve previous selection with suggester
			this.addCommand({
				id: "ai-written",
				name: translate("command.written-improvement"),
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(translate("notice.no-selection"));
						return;
					}

					// Open suggester modal to choose improvement type
					const suggester = new ImprovementSuggester(this.app, this);
					suggester.open();
				},
			});

			// Add command to create new prompt
			this.addCommand({
				id: "new-prompt",
				name: translate("command.new-prompt"),
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
									translate("notice.prompt-added-success", {
										name: updatedOption.name,
									}),
								);
							} else {
								new Notice(
									translate("notice.name-prompt-empty"),
								);
							}
						},
						undefined, // No delete callback for new prompts
						translate("modal.add-new-prompt"),
					);
					editModal.open();
				},
			});

			// Add command for simplified one-shot chat
			this.addCommand({
				id: "one-shot-chat",
				name: translate("command.one-shot-chat"),
				callback: async () => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView || !activeView.editor) {
						new Notice("No active markdown view found.");
						return;
					}
			
					const aiModal = new AIPromptModal(
						this.app,
						this,
						activeView.editor,
					);
					aiModal.open();
				},
			});
			
			// Add command to tidy history (remove all AI response quote blocks)
			this.addCommand({
				id: "tidy-history",
				name: translate("command.tidy-history"),
				callback: async () => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView || !activeView.editor) {
						new Notice("No active markdown view found.");
						return;
					}
					
					const editor = activeView.editor;
					const content = editor.getValue();
					const lines = content.split('\n');
					
					let removedCount = 0;
					let i = 0;
					
					// Process lines to find and remove AI response quote blocks
					while (i < lines.length) {
						const line = lines[i];
						
						// Check if this line starts an AI response quote block
						if (line.match(/^>\s*\[!quote\]\+?\s*AI Response/)) {
							const startIndex = i;
							
							// Find the end of the quote block
							while (i < lines.length && (lines[i].startsWith('>') || lines[i].trim() === '')) {
								i++;
							}
							
							// Remove the quote block lines
							lines.splice(startIndex, i - startIndex);
							i = startIndex;
							removedCount++;
						} else {
							i++;
						}
					}
					
					// Update the editor content
					if (removedCount > 0) {
						editor.setValue(lines.join('\n'));
						new Notice(`Removed ${removedCount} AI response quote block(s).`);
					} else {
						new Notice("No AI response quote blocks found.");
					}
				},
			});
			
			// Add command to replace original text with last AI response
			this.addCommand({
				id: "replace-with-ai",
				name: translate("command.replace-ai-response"),
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(translate("notice.no-selection"));
						return;
					}

					if (!this.lastAiResponse) {
						new Notice(translate("notice.no-ai-response"));
						return;
					}

					if (!this.lastSelection.editor) {
						new Notice(translate("notice.editor-not-available"));
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

			// Add command to set default AI response note
			this.addCommand({
				id: "set-default-ai-note",
				name: "Set default note for AI responses",
				callback: async () => {
					const modal = new FileSuggesterModal(this.app, this);
					modal.open();
				},
			});

			// Register event to capture text selections
			this.registerDomEvent(document, "selectionchange", () => {
				this.captureSelection();
			});

			this.addSettingTab(new AiAssistantSettingTab(this.app, this));


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

	addToPromptHistory(prompt: string) {
		const trimmedPrompt = prompt.trim();
		if (!trimmedPrompt) return;

		const history = this.settings.promptHistory;
		const existingIndex = history.findIndex(item => item.text === trimmedPrompt);

		if (existingIndex !== -1) {
			// Update existing prompt
			history[existingIndex].usageCount++;
			history[existingIndex].lastUsed = Date.now();
		} else {
			// Add new prompt
			history.push({
				text: trimmedPrompt,
				usageCount: 1,
				lastUsed: Date.now()
			});
		}

		// Sort by usage count (most used first)
		history.sort((a, b) => b.usageCount - a.usageCount);

		// Save settings
		this.saveSettings();
	}

	removeFromPromptHistory(prompt: string) {
		const trimmedPrompt = prompt.trim();
		if (!trimmedPrompt) return;

		const history = this.settings.promptHistory;
		const index = history.findIndex(item => item.text === trimmedPrompt);

		if (index !== -1) {
			history.splice(index, 1);
			this.saveSettings();
		}
	}

	getDefaultSuggestions(): ImprovementOption[] {
		return [
			{
				id: "general",
				name: translate("suggestion.english-improvement.name"),
				description: translate("suggestion.english-improvement.desc"),
				prompt: translate("suggestion.english-improvement.prompt"),
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
								
								resolve(newFilePath);
							} else {
								
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

	splitRightAndOpenNote(file: TFile) {
		const workspace = this.app.workspace;
		const activeLeaf = workspace.getActiveViewOfType(MarkdownView)?.leaf;
		
		if (activeLeaf) {
			// Split right from the active leaf
			const newLeaf = workspace.createLeafBySplit(activeLeaf, 'vertical');
			// Open the specified file in the new leaf
			if (newLeaf) {
				newLeaf.openFile(file);
			}
		} else {
			// Fallback: just open the file in a new leaf
			workspace.getLeaf('split', 'vertical').openFile(file);
		}
	}

	setDefaultAiResponseNote(file: TFile) {
		this.settings.defaultAiResponseNote = file.path;
		this.saveSettings();
		new Notice(`Default AI response note set to: ${file.basename}`);
		
		// Also split right and open the note
		this.splitRightAndOpenNote(file);
	}
}

class FileSuggesterModal extends SuggestModal<TFile> {
	plugin: AiAssistantPlugin;

	constructor(app: any, plugin: AiAssistantPlugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder("Type to search for a note...");
	}

	getSuggestions(query: string): TFile[] {
		const files = this.app.vault.getMarkdownFiles();
		return files.filter((file: TFile) => 
			file.basename.toLowerCase().includes(query.toLowerCase())
		).slice(0, 10);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.createEl("div", { text: file.basename });
		el.createEl("small", { text: file.path, cls: "suggestion-note" });
	}

	onChooseSuggestion(file: TFile): void {
		this.plugin.setDefaultAiResponseNote(file);
		this.close();
	}
}
