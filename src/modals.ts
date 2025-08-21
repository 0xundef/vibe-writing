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
		contentEl.addClass("ai-prompt-modal");

		// Prompt field
		const promptContainer = contentEl.createDiv();
		this.promptInput = promptContainer.createEl("input", {
			type: "text",
			placeholder: translate('placeholder.prompt-input'),
		});
		this.promptInput.style.width = "100%";
		this.promptInput.style.marginBottom = "10px";

		// Response field
		const responseContainer = contentEl.createDiv();
		this.responseArea = responseContainer.createEl("textarea");
		this.responseArea.style.width = "100%";
		this.responseArea.style.height = "200px";
		this.responseArea.style.marginBottom = "10px";
		this.responseArea.style.resize = "vertical";
		this.responseArea.placeholder = translate('placeholder.ai-response');
		this.responseArea.readOnly = true;

		// Button container for better layout
		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "flex-end";
		buttonContainer.style.marginTop = "10px";

		// Copy button
		const copyButton = buttonContainer.createEl("button", {
			text: translate('ui.copy'),
		});
		copyButton.style.padding = "8px 16px";
		copyButton.style.fontSize = "14px";
		copyButton.style.backgroundColor = "var(--interactive-accent)";
		copyButton.style.color = "var(--text-on-accent)";
		copyButton.style.border = "none";
		copyButton.style.borderRadius = "6px";
		copyButton.style.cursor = "pointer";
		copyButton.style.fontWeight = "500";
		copyButton.style.transition = "opacity 0.2s";

		// Hover effect
		copyButton.addEventListener("mouseenter", () => {
			copyButton.style.opacity = "0.8";
		});
		copyButton.addEventListener("mouseleave", () => {
			copyButton.style.opacity = "1";
		});

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
			new Notice(translate('notice.enter-prompt'));
			return;
		}

		// Show loading state
		this.promptInput.disabled = true;
		this.promptInput.placeholder = translate('placeholder.generating-response');

		try {
			// Build the prompt with selected text if available
			let fullPrompt = prompt;
			if (this.selectedText) {
				fullPrompt = `${prompt}\n\nSelected text:\n${this.selectedText}`;
			}

			// Build the API client
			this.plugin.build_api();
			if (!this.plugin.aiAssistant) {
				new Notice(
					translate('notice.api-not-configured'),
				);
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
				this.displayResponse(translate('message.no-response'));
			}
		} catch (error) {
			console.error("AI API Error:", error);
			this.displayResponse(
				`${translate('error.prefix')}: ${error.message || translate('error.failed-ai-response')}`,
			);
		} finally {
			// Re-enable input
			this.promptInput.disabled = false;
			this.promptInput.placeholder = translate('placeholder.prompt-input');
			// Clear input for next prompt
			this.promptInput.value = "";
		}
	}

	copyResponse() {
		const responseText = this.responseArea.value.trim();
		if (!responseText) {
			new Notice(translate('placeholder.ai-response'));
			return;
		}

		// Copy to clipboard
		navigator.clipboard.writeText(responseText).then(() => {
			new Notice(translate('notice.copied-to-clipboard'));
		}).catch((err) => {
			console.error('Failed to copy text: ', err);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = responseText;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			new Notice(translate('notice.copied-to-clipboard'));
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
		title: string = "Edit Suggestion",
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
		contentEl.addClass("edit-suggestion-modal");

		contentEl.createEl("h2", { text: translate('modal.edit-suggestion') });

		// Name field
		const nameContainer = contentEl.createDiv();
		nameContainer.createEl("label", { text: translate('ui.name') });
		const nameInput = nameContainer.createEl("input", {
			type: "text",
			value: this.option.name,
		});
		nameInput.style.width = "100%";
		nameInput.style.marginBottom = "10px";

		// Description field
		const descContainer = contentEl.createDiv();
		descContainer.createEl("label", { text: translate('ui.description') });
		const descInput = descContainer.createEl("input", {
			type: "text",
			value: this.option.description,
		});
		descInput.style.width = "100%";
		descInput.style.marginBottom = "10px";

		// Prompt field
		const promptContainer = contentEl.createDiv();
		promptContainer.createEl("label", { text: translate('ui.prompt') });
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
		buttonContainer.style.justifyContent = "space-between";

		// Left side - Delete button (if onDelete callback provided)
		const leftButtonContainer = buttonContainer.createDiv();
		if (this.onDelete) {
			const deleteButton = leftButtonContainer.createEl("button", {
				text: translate('ui.delete'),
			});
			deleteButton.style.backgroundColor = "var(--interactive-accent)";
			deleteButton.style.color = "var(--text-on-accent)";
			deleteButton.onclick = () => {
				// Confirm deletion
				const confirmed = confirm(
					translate('confirm.delete-suggestion', { name: this.option.name }),
				);
				if (confirmed && this.onDelete) {
					this.onDelete(this.option.id);
					this.close();
				}
			};
		}

		// Right side - Save button
		const rightButtonContainer = buttonContainer.createDiv();
		rightButtonContainer.style.display = "flex";
		rightButtonContainer.style.gap = "10px";

		const saveButton = rightButtonContainer.createEl("button", {
			text: translate('ui.save'),
		});
		saveButton.onclick = async () => {
			this.option.name = nameInput.value;
			this.option.description = descInput.value;
			this.option.prompt = promptInput.value;
			this.onSave(this.option);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}