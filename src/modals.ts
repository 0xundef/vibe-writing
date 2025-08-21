import { App, Modal, Notice } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ImprovementOption } from "./types";
import { translate } from "./i18n/language-manager";

export class AIPromptModal extends Modal {
	plugin: AiAssistantPlugin;
	selectedText: string;
	promptInput: HTMLInputElement;
	responseArea: HTMLTextAreaElement;

	constructor(
		app: App,
		plugin: AiAssistantPlugin,
		selectedText: string = "",
	) {
		super(app);
		this.plugin = plugin;
		this.selectedText = selectedText;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("vibe-writing-ai-prompt-modal");

		// Prompt field
		const promptContainer = contentEl.createDiv();
		this.promptInput = promptContainer.createEl("input", {
			type: "text",
			placeholder: translate("placeholder.prompt-input"),
		});
		// Apply classes instead of inline styles
		this.promptInput.addClass("vibe-writing-full-width");
		this.promptInput.addClass("vibe-writing-mb-10");

		// Response field
		const responseContainer = contentEl.createDiv();
		this.responseArea = responseContainer.createEl("textarea");
		// Apply classes instead of inline styles
		this.responseArea.addClass("vibe-writing-full-width");
		this.responseArea.addClass("vibe-writing-response-area");
		this.responseArea.addClass("vibe-writing-mb-10");
		this.responseArea.placeholder = translate("placeholder.ai-response");
		this.responseArea.readOnly = true;

		// Button container for better layout
		const buttonContainer = contentEl.createDiv();
		buttonContainer.addClass("vibe-writing-button-row");

		// Copy button
		const copyButton = buttonContainer.createEl("button", {
			text: translate("ui.copy"),
		});
		// Use class-based styling
		copyButton.addClass("vibe-writing-btn");
		copyButton.addClass("vibe-writing-btn-primary");

		// Copy button click handler
		copyButton.addEventListener("click", () => {
			this.copyResponse();
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
			new Notice(translate("notice.enter-prompt"));
			return;
		}

		// Show loading state
		this.promptInput.disabled = true;
		this.promptInput.placeholder = translate(
			"placeholder.generating-response",
		);

		try {
			// Build the prompt with selected text if available
			let fullPrompt = prompt;
			if (this.selectedText) {
				fullPrompt = `${prompt}\n\nSelected text:\n${this.selectedText}`;
			}

			// Build the API client
			this.plugin.build_api();
			if (!this.plugin.aiAssistant) {
				new Notice(translate("notice.api-not-configured"));
				return;
			}

			// Make the API call
			const messages = [
				{
					role: "user",
					content: fullPrompt,
				},
			];

			const response =
				await this.plugin.aiAssistant.text_api_call(messages);

			if (response) {
				this.displayResponse(response);
			} else {
				this.displayResponse(translate("message.no-response"));
			}
		} catch (error) {
			console.error("AI API Error:", error);
			this.displayResponse(
				`${translate("error.prefix")}: ${error.message || translate("error.failed-ai-response")}`,
			);
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

	copyResponse() {
		const responseText = this.responseArea.value.trim();
		if (!responseText) {
			new Notice(translate("placeholder.ai-response"));
			return;
		}

		// Copy to clipboard
		navigator.clipboard
			.writeText(responseText)
			.then(() => {
				new Notice(translate("notice.copied-to-clipboard"));
			})
			.catch((err) => {
				console.error("Failed to copy text: ", err);
				// Fallback for older browsers
				const textArea = document.createElement("textarea");
				textArea.value = responseText;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				new Notice(translate("notice.copied-to-clipboard"));
			});
	}

	displayResponse(response: string) {
		this.responseArea.value = response;
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

			// Remove JS hover styling; CSS will handle :hover
			// deleteButton.addEventListener('mouseenter', () => {...});
			// deleteButton.addEventListener('mouseleave', () => {...});

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
