import { App, Modal, Notice, SuggestModal, setIcon } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ImprovementOption, PromptHistoryItem } from "./types";
import { translate } from "./i18n/language-manager";

export class AIPromptModal extends SuggestModal<string> {
	plugin: AiAssistantPlugin;
	editor: any;

	constructor(
		app: App,
		plugin: AiAssistantPlugin,
		editor: any,
	) {
		super(app);
		this.plugin = plugin;
		this.editor = editor;
	}

	getSuggestions(query: string): string[] {
		const history = this.plugin.settings.promptHistory;
		
		if (query.length === 0) {
			// Show all history when no query
			return history.map((item: PromptHistoryItem) => item.text);
		} else {
			// Filter history based on query
			return history
				.filter((item: PromptHistoryItem) => item.text.toLowerCase().includes(query.toLowerCase()))
				.map((item: PromptHistoryItem) => item.text);
		}
	}

	renderSuggestion(prompt: string, el: HTMLElement) {
		const container = el.createEl("div", { cls: "vibe-writing-suggestion-item" });
		const textEl = container.createEl("div", { text: prompt });
		const removeIcon = container.createEl("span", { 
			cls: "vibe-writing-suggestion-remove-icon"
		});
		setIcon(removeIcon, "circle-x");

		removeIcon.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.plugin.removeFromPromptHistory(prompt);
			// Refresh suggestions
			this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		});
	}

	onChooseSuggestion(prompt: string, evt: MouseEvent | KeyboardEvent) {
		this.sendPrompt(prompt);
	}

	onNoSuggestion() {
		// Do nothing - let the user continue typing or press Enter
	}

	// Override to handle Enter key when no suggestions match
	selectSuggestion(value: string, evt: KeyboardEvent | MouseEvent) {
		if (evt instanceof KeyboardEvent && evt.key === 'Enter') {
			// Check if there are any suggestions
			const suggestions = this.getSuggestions(this.inputEl.value);
			if (suggestions.length === 0) {
				// No suggestions available - send current input as prompt
				const input = this.inputEl.value.trim();
				if (input) {
					this.sendPrompt(input);
					return;
				}
			}
		}
		// Use default behavior for suggestion selection
		super.selectSuggestion(value, evt);
	}

	onOpen() {
		super.onOpen();
		this.setPlaceholder(translate("placeholder.prompt-input"));
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select or send" },
			{ command: "esc", purpose: "Close" }
		]);
	}

	async sendPrompt(customPrompt?: string) {
		const prompt = customPrompt || this.inputEl.value.trim();
		if (!prompt) {
			new Notice("Please enter a prompt.");
			return;
		}

		this.inputEl.disabled = true;
		this.setPlaceholder("Processing...");

		try {
			this.plugin.build_api();
			if (!this.plugin.aiAssistant) {
				new Notice("Please configure your API settings first.");
				return;
			}

			// Add prompt to history
			this.plugin.addToPromptHistory(prompt);

			// Make the API call
			const messages = [
				{
					role: "user",
					content: prompt,
				},
			];

			const response = await this.plugin.aiAssistant.text_api_call(messages);

			if (response && this.editor) {
				// Insert AI response at cursor position wrapped in quote block with question
				const quoteBlock = `\n\n> [!quote]+ AI Response(shot chat)\n> **Q:** ${prompt.trim().replace(/\n/g, "\n> ")}\n> \n> **A:** ${response.trim().replace(/\n/g, "\n> ")}\n\n`;
				const cursor = this.editor.getCursor();
				this.editor.replaceRange(quoteBlock, cursor, cursor);
				
				new Notice("AI response inserted at cursor position.");
				this.close();
			} else {
				new Notice("No response from AI. Please try again.");
			}
		} catch (error) {
			console.error("AI API Error:", error);
			new Notice(`Error: ${error.message || "Failed to get AI response"}.`);
		} finally {
			// Re-enable input
			this.inputEl.disabled = false;
			this.setPlaceholder(translate("placeholder.prompt-input"));
			// Clear input for next prompt
			this.inputEl.value = "";
		}
	}
}

export class EditSuggestionModal extends Modal {
	plugin: AiAssistantPlugin;
	option: ImprovementOption;
	onSave: (updatedOption: ImprovementOption) => void;
	onDelete?: (optionId: string) => void;
	title: string;

	constructor(
		app: App,
		plugin: AiAssistantPlugin,
		option: ImprovementOption,
		onSave: (updatedOption: ImprovementOption) => void,
		onDelete?: (optionId: string) => void,
		title: string = "Edit Prompt",
	) {
		super(app);
		this.plugin = plugin;
		this.option = { ...option };
		this.onSave = onSave;
		this.onDelete = onDelete;
		this.title = title;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vibe-writing-modal");

		contentEl.createEl("h2", { text: translate("modal.edit-suggestion") });

		// Name field
		const nameContainer = contentEl.createDiv();
		nameContainer.createEl("label", { text: translate("ui.name") });
		const nameInput = nameContainer.createEl("input", {
			type: "text",
			value: this.option.name,
		});
		nameInput.addClass("vibe-writing-full-width");
		nameInput.addClass("vibe-writing-mb-10");

		// Description field
		const descContainer = contentEl.createDiv();
		descContainer.createEl("label", { text: translate("ui.description") });
		const descInput = descContainer.createEl("input", {
			type: "text",
			value: this.option.description,
		});
		descInput.addClass("vibe-writing-full-width");
		descInput.addClass("vibe-writing-mb-10");

		// Prompt field
		const promptContainer = contentEl.createDiv();
		promptContainer.createEl("label", { text: translate("ui.prompt") });
		const promptInput = promptContainer.createEl("textarea");
		promptInput.value = this.option.prompt || "";
		promptInput.addClass("vibe-writing-full-width");
		promptInput.addClass("vibe-writing-mb-20");
		promptInput.addClass("vibe-writing-prompt-textarea");

		// Buttons
		const buttonContainer = contentEl.createDiv();
		buttonContainer.addClass("vibe-writing-button-row");
		buttonContainer.addClass("vibe-writing-gap-10");

		// Delete button
		if (this.onDelete) {
			const deleteButton = buttonContainer.createEl("button", {
				text: translate("ui.delete"),
			});
			deleteButton.addClass("vibe-writing-btn");
			deleteButton.addClass("vibe-writing-btn-plain");
			deleteButton.onclick = () => {
				const confirmed = confirm(
					translate("confirm.delete-suggestion", {
						name: this.option.name,
					}),
				);
				if (confirmed && this.onDelete) {
					this.onDelete(this.option.id);
					this.close();
				}
			};
		}

		// Save button
		const saveButton = buttonContainer.createEl("button", {
			text: translate("ui.save"),
		});
		saveButton.addClass("vibe-writing-btn");
		saveButton.addClass("vibe-writing-btn-primary");

		saveButton.onclick = async () => {
			// Validate required fields
			const name = nameInput.value.trim();
			const description = descInput.value.trim();
			const prompt = promptInput.value.trim();

			if (!name) {
				new Notice(
					translate("validation.name-required") || "Name is required",
				);
				nameInput.focus();
				return;
			}

			if (!description) {
				new Notice(
					translate("validation.description-required") ||
						"Description is required",
				);
				descInput.focus();
				return;
			}

			if (!prompt) {
				new Notice(
					translate("validation.prompt-required") ||
						"Prompt is required",
				);
				promptInput.focus();
				return;
			}

			this.option.name = name;
			this.option.description = description;
			this.option.prompt = prompt;
			this.onSave(this.option);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
