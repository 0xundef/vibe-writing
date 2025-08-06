import {
	App,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	SuggestModal,
	TFile,
} from "obsidian";
import {
	AnthropicAssistant,
	OpenAIAssistant,
	QwenAssistant,
} from "./openai_api";
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
	suggestions: ImprovementOption[];
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
	suggestions: [],
};

interface ImprovementOption {
	id: string;
	name: string;
	description: string;
	prompt: string;
	hidden?: boolean;
}

class EditSuggestionModal extends Modal {
	plugin: AiAssistantPlugin;
	option: ImprovementOption;
	onSave: (updatedOption: ImprovementOption) => void;
	title: string;

	constructor(app: App, plugin: AiAssistantPlugin, option: ImprovementOption, onSave: (updatedOption: ImprovementOption) => void, title: string = "Edit Suggestion") {
		super(app);
		this.plugin = plugin;
		this.option = { ...option }; // Create a copy
		this.onSave = onSave;
		this.title = title;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("edit-suggestion-modal");

		contentEl.createEl("h2", { text: this.title });

		// Name field
		const nameContainer = contentEl.createDiv();
		nameContainer.createEl("label", { text: "Name:" });
		const nameInput = nameContainer.createEl("input", {
			type: "text",
			value: this.option.name,
		});
		nameInput.style.width = "100%";
		nameInput.style.marginBottom = "10px";

		// Description field
		const descContainer = contentEl.createDiv();
		descContainer.createEl("label", { text: "Description:" });
		const descInput = descContainer.createEl("input", {
			type: "text",
			value: this.option.description,
		});
		descInput.style.width = "100%";
		descInput.style.marginBottom = "10px";

		// Prompt field
		const promptContainer = contentEl.createDiv();
		promptContainer.createEl("label", { text: "Prompt:" });
		const promptInput = promptContainer.createEl("textarea");
		console.log("Option prompt:", this.option.prompt);
		// Set value after element creation
		promptInput.value = this.option.prompt || "";
		promptInput.style.width = "100%";
		promptInput.style.height = "150px";
		promptInput.style.marginBottom = "20px";
		console.log("Textarea value after setting:", promptInput.value);
		console.log("Textarea element:", promptInput);

		// Buttons
		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.gap = "10px";
		buttonContainer.style.justifyContent = "flex-end";

		const saveButton = buttonContainer.createEl("button", { text: "Save" });
		saveButton.onclick = async () => {
			this.option.name = nameInput.value;
			this.option.description = descInput.value;
			this.option.prompt = promptInput.value;
			this.onSave(this.option);
			this.close();
		};

		const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
		cancelButton.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ImprovementSuggester extends SuggestModal<ImprovementOption> {
	plugin: AiAssistantPlugin;
	options: ImprovementOption[];

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app);
		this.plugin = plugin;
		this.options = [];
	}

	async onOpen() {
		super.onOpen();
		// Load suggestions from settings
		this.options = this.plugin.settings.suggestions.filter(s => !s.hidden);

		// Trigger rendering after loading
		setTimeout(() => {
			if (this.inputEl) {
				this.inputEl.dispatchEvent(
					new Event("input", { bubbles: true }),
				);
			}
		}, 0);
	}

	getSuggestions(query: string): ImprovementOption[] {
		// Ensure options is initialized
		if (!this.options) {
			return [];
		}

		// If query is empty, show all options initially
		if (!query || query.trim() === "") {
			return this.options;
		}

		// Filter based on query
		return this.options.filter(
			(option) =>
				option.name.toLowerCase().includes(query.toLowerCase()) ||
				option.description.toLowerCase().includes(query.toLowerCase()),
		);
	}

	renderSuggestion(option: ImprovementOption, el: HTMLElement) {
		el.addClass("suggestion-item");
		
		// Create a container for the suggestion content
		const contentContainer = el.createDiv({ cls: "suggestion-content" });
		contentContainer.style.display = "flex";
		contentContainer.style.justifyContent = "space-between";
		contentContainer.style.alignItems = "center";
		contentContainer.style.width = "100%";
		
		// Left side: suggestion info
		const infoContainer = contentContainer.createDiv({ cls: "suggestion-info" });
		infoContainer.style.flex = "1";
		infoContainer.createEl("div", { text: option.name, cls: "suggestion-title" });
		infoContainer.createEl("small", {
			text: option.description,
			cls: "suggestion-note",
		});
		
		// Right side: edit button
		const editButton = contentContainer.createEl("button", {
			text: "edit",
			cls: "suggestion-edit-btn"
		});
		editButton.style.marginLeft = "10px";
		editButton.style.padding = "2px 8px";
		editButton.style.fontSize = "12px";
		editButton.style.backgroundColor = "var(--interactive-accent)";
		editButton.style.color = "var(--text-on-accent)";
		editButton.style.border = "none";
		editButton.style.borderRadius = "4px";
		editButton.style.cursor = "pointer";
		
		editButton.onclick = (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.openEditModal(option.id);
		};
	}
	
	openEditModal(optionId: string) {
		const option = this.options.find(opt => opt.id === optionId);
		if (!option) return;
		const editModal = new EditSuggestionModal(
			this.app,
			this.plugin,
			option,
			async (updatedOption: ImprovementOption) => {
				// Update the option in the plugin settings
				const index = this.plugin.settings.suggestions.findIndex(opt => opt.id === updatedOption.id);
				if (index !== -1) {
					this.plugin.settings.suggestions[index] = updatedOption;
				}
				
				// Save settings
				await this.plugin.saveSettings();
				
				// Update the current options array for display
				this.options = this.plugin.settings.suggestions.filter(s => !s.hidden);
				
				// Refresh the suggester display
				if (this.inputEl) {
					this.inputEl.dispatchEvent(
						new Event("input", { bubbles: true }),
					);
				}
				
				new Notice(`Suggestion "${updatedOption.name}" updated successfully!`);
			}
		);
		editModal.open();
	}

	async onChooseSuggestion(
		option: ImprovementOption,
		evt: MouseEvent | KeyboardEvent,
	) {
		if (!this.plugin.lastSelection) {
			new Notice(
				"No previous selection found. Please select some text first.",
			);
			return;
		}

		try {
			// Update status to processing
			this.plugin.updateStatusBar("Processing...");
			
			// Set up timeout for the API call
			const timeoutMs = 30000; // 30 seconds timeout
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
			});
			
			const prompt = `${option.prompt}\n\n${this.plugin.lastSelection.text}`;
			console.log(prompt);
			
			// Race between API call and timeout
			const apiCallPromise = this.plugin.aiAssistant.text_api_call([
				{
					role: "user",
					content: prompt,
				},
			]);
			
			const answer = await Promise.race([apiCallPromise, timeoutPromise]);

			if (answer && this.plugin.lastSelection.editor) {
			// Store the AI response for potential replacement
			this.plugin.lastAiResponse = answer.trim();
			
			// Create a toggle quote block with the AI response
			const toggleQuoteBlock = `\n\n> [!quote]+ AI Response (${option.name})\n> ${answer.trim().replace(/\n/g, '\n> ')}`;
			
			// Insert the toggle quote block at the current cursor position
			const cursor = this.plugin.lastSelection.editor.getCursor();
			this.plugin.lastSelection.editor.replaceRange(
				toggleQuoteBlock,
				cursor,
				cursor,
			);
			
			// Store the quote block range for potential deletion (including leading newlines)
			const quoteBlockStart = cursor;
			const quoteBlockLines = toggleQuoteBlock.split('\n');
			const quoteBlockEnd = {
				line: quoteBlockStart.line + quoteBlockLines.length - 1,
				ch: quoteBlockLines[quoteBlockLines.length - 1].length
			};
			this.plugin.lastQuoteBlockRange = {
				from: quoteBlockStart,
				to: quoteBlockEnd,
				editor: this.plugin.lastSelection.editor
			};
			
			new Notice(`AI response added using ${option.name}!`);
			// Update status to ready
			this.plugin.updateStatusBar("Ready");
		} else {
			new Notice("Failed to get AI response. Please try again.");
			// Update status to ready even on failure
			this.plugin.updateStatusBar("Ready");
		}
		} catch (error) {
			console.error("Error improving text:", error);
			
			if (error.message === 'Request timeout') {
				new Notice("AI request timed out. Please try again.");
				this.plugin.updateStatusBar("Timeout");
			} else {
				new Notice("Error occurred while improving text.");
				this.plugin.updateStatusBar("Error");
			}
			
			// Reset to ready after 3 seconds
			setTimeout(() => {
				this.plugin.updateStatusBar("Ready");
			}, 3000);
		}
	}
}

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
		console.log("🚀 AI Assistant Plugin: Starting to load...");

		try {
			await this.loadSettings();
			
			// Initialize suggestions if empty
			if (!this.settings.suggestions || this.settings.suggestions.length === 0) {
				this.settings.suggestions = this.getDefaultSuggestions();
				await this.saveSettings();
			}
			console.log(
				"✅ AI Assistant Plugin: Settings loaded successfully",
				{
					modelName: this.settings.modelName,
					imageModelName: this.settings.imageModelName,
					maxTokens: this.settings.maxTokens,
					hasOpenAIKey: !!this.settings.openAIapiKey,
					hasAnthropicKey: !!this.settings.anthropicApiKey,
					hasQwenKey: !!this.settings.qwenApiKey,
					qwenBaseURL: this.settings.qwenBaseURL,
				},
			);

			this.build_api();
		console.log(
			"✅ AI Assistant Plugin: API client built successfully",
		);

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar("Initializing...");
		
		// Set to ready after initialization
		setTimeout(() => {
			this.updateStatusBar("Ready");
		}, 100);

			// Add command to improve previous selection with suggester
			this.addCommand({
				id: "ai-written",
				name: "Written improvement",
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(
							"No previous selection found. Please select some text first.",
						);
						return;
					}

					// Open suggester modal to choose improvement type
					const suggester = new ImprovementSuggester(this.app, this);
					suggester.open();
				},
			});

			// Add command to create new prompt
			this.addCommand({
				id: "add-new-prompt",
				name: "Add new prompt",
				callback: async () => {
					// Create a new empty prompt option
					const newOption: ImprovementOption = {
						id: Date.now().toString(), // Simple ID generation
						name: "",
						description: "",
						prompt: ""
					};

					// Open edit modal for the new prompt
					const editModal = new EditSuggestionModal(
						this.app,
						this,
						newOption,
						async (updatedOption: ImprovementOption) => {
							// Only save if name and prompt are not empty
							if (updatedOption.name.trim() && updatedOption.prompt.trim()) {
								this.settings.suggestions.push(updatedOption);
								await this.saveSettings();
								new Notice(`New prompt "${updatedOption.name}" added successfully!`);
							} else {
								new Notice("Name and prompt cannot be empty!");
							}
						},
						"Add New Prompt"
					);
					editModal.open();
				},
			});

			// Add command to replace original text with last AI response
			this.addCommand({
				id: "replace-with-ai",
				name: "Replace with last AI response",
				callback: async () => {
					if (!this.lastSelection) {
						new Notice(
							"No previous selection found. Please select some text first.",
						);
						return;
					}

					if (!this.lastAiResponse) {
						new Notice(
							"No AI response available. Please generate an AI response first.",
						);
						return;
					}

					if (!this.lastSelection.editor) {
						new Notice("Editor not available.");
						return;
					}

					// First delete the quote block if it exists
					if (this.lastQuoteBlockRange && this.lastQuoteBlockRange.editor) {
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
						line: this.lastSelection.from.line + this.lastAiResponse.split('\n').length - 1,
						ch: this.lastAiResponse.split('\n').length === 1 
							? this.lastSelection.from.ch + this.lastAiResponse.length
							: this.lastAiResponse.split('\n').pop()?.length || 0
					};
					
					// Select the newly inserted text to highlight it
					this.lastSelection.editor.setSelection(
						this.lastSelection.from,
						newTextEnd
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
		console.log("🔌 AI Assistant Plugin: Unloaded!");
	}

	updateStatusBar(status: string) {
		if (this.statusBarItem) {
			this.statusBarItem.setText(`Vibe Writing: ${status}`);
			
			// Add visual styling based on status
			this.statusBarItem.removeClass('vibe-writing-ready', 'vibe-writing-processing', 'vibe-writing-error');
			if (status === 'Ready') {
				this.statusBarItem.addClass('vibe-writing-ready');
			} else if (status.includes('Processing') || status.includes('Initializing')) {
				this.statusBarItem.addClass('vibe-writing-processing');
			} else if (status.includes('Error') || status.includes('Timeout')) {
				this.statusBarItem.addClass('vibe-writing-error');
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
				name: "General Improvement",
				description: "Improve clarity, grammar, and overall quality",
				prompt: "Please revise and improve the following text while maintaining its original meaning and intent. Focus on clarity, grammar, and overall quality:",
			},
			{
				id: "formal",
				name: "Make More Formal",
				description: "Convert to formal, professional tone",
				prompt: "Please rewrite the following text in a more formal and professional tone while maintaining its original meaning:",
			},
			{
				id: "casual",
				name: "Make More Casual",
				description: "Convert to casual, conversational tone",
				prompt: "Please rewrite the following text in a more casual and conversational tone while maintaining its original meaning:",
			},
			{
				id: "concise",
				name: "Make More Concise",
				description: "Shorten while keeping key information",
				prompt: "Please make the following text more concise and to the point while preserving all important information:",
			},
			{
				id: "detailed",
				name: "Add More Detail",
				description: "Expand with additional context and examples",
				prompt: "Please expand the following text with more detail, context, and examples while maintaining its core message:",
			},
			{
				id: "academic",
				name: "Academic Style",
				description: "Convert to academic writing style",
				prompt: "Please rewrite the following text in an academic writing style with appropriate scholarly tone and structure:",
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
			.setDesc(
				"Custom endpoint for Qwen models (leave default for Alibaba Cloud)",
			)
			.addText((text) =>
				text
					.setPlaceholder(
						"https://dashscope.aliyuncs.com/compatible-mode/v1",
					)
					.setValue(this.plugin.settings.qwenBaseURL)
					.onChange(async (value) => {
						this.plugin.settings.qwenBaseURL =
							value ||
							"https://dashscope.aliyuncs.com/compatible-mode/v1";
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);
		containerEl.createEl("h3", { text: "Text Assistant" });

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
