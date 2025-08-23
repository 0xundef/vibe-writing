import { App, Modal, Notice } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ImprovementOption } from "./types";
import { translate } from "./i18n/language-manager";

export class AIPromptModal extends Modal {
	plugin: AiAssistantPlugin;
	editor: any;
	promptInput: HTMLInputElement;

	constructor(
		app: App,
		plugin: AiAssistantPlugin,
		editor: any,
	) {
		super(app);
		this.plugin = plugin;
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vibe-writing-ai-prompt-modal");

		// Title
		const title = contentEl.createEl("h2", {
			text: translate("command.one-shot-chat"),
		});
		title.addClass("vibe-writing-mb-10");

		// Prompt field
		const promptContainer = contentEl.createDiv();
		this.promptInput = promptContainer.createEl("input", {
			type: "text",
			placeholder: translate("placeholder.prompt-input"),
		});
		// Apply classes instead of inline styles
		this.promptInput.addClass("vibe-writing-full-width");
		this.promptInput.addClass("vibe-writing-mb-10");

		// Button container
		const buttonContainer = contentEl.createDiv();
		buttonContainer.addClass("vibe-writing-button-row");

		// Send button
		const sendButton = buttonContainer.createEl("button", {
			text: "Send",
		});
		sendButton.addClass("vibe-writing-btn");
		sendButton.addClass("vibe-writing-btn-primary");

		// Send button click handler
		sendButton.addEventListener("click", () => {
			this.sendPrompt();
		});

		// Focus the input
		setTimeout(() => {
			this.promptInput.focus();
		}, 100);

		// Handle keyboard shortcuts
		this.promptInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.sendPrompt();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				this.close();
			}
		});
	}

	async sendPrompt() {
		const prompt = this.promptInput.value.trim();
		if (!prompt) {
			new Notice("Please enter a prompt.");
			return;
		}

		this.promptInput.disabled = true;
		this.promptInput.placeholder = translate(
			"placeholder.generating-response",
		);

		try {
			this.plugin.build_api();
			if (!this.plugin.aiAssistant) {
				new Notice("Please configure your API settings first.");
				return;
			}

			// Make the API call
			const messages = [
				{
					role: "user",
					content: prompt,
				},
			];

			const response = await this.plugin.aiAssistant.text_api_call(messages);

			if (response && this.editor) {
				// Insert AI response at cursor position wrapped in code block
				const codeBlock = `\n\n\`\`\`\n${response.trim()}\n\`\`\`\n\n`;
				const cursor = this.editor.getCursor();
				this.editor.replaceRange(codeBlock, cursor, cursor);
				
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
			this.promptInput.disabled = false;
			this.promptInput.placeholder = translate(
				"placeholder.prompt-input",
			);
			// Clear input for next prompt
			this.promptInput.value = "";
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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
		title: string = "Edit Prompt", // Changed from "Edit Suggestion"
	) {
		super(app);
		this.plugin = plugin;
		this.option = { ...option }; // Create a copy
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

		// Delete button with plain styling (if available)
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

		// Save button with accent styling
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
