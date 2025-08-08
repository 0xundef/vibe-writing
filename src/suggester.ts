import { App, Notice, SuggestModal } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ImprovementOption } from "./types";
import { EditSuggestionModal } from "./modals";

export class ImprovementSuggester extends SuggestModal<ImprovementOption> {
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
		this.options = this.plugin.settings.suggestions.filter(
			(s) => !s.hidden,
		);

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
		const infoContainer = contentContainer.createDiv({
			cls: "suggestion-info",
		});
		infoContainer.style.flex = "1";
		infoContainer.createEl("div", {
			text: option.name,
			cls: "suggestion-title",
		});
		infoContainer.createEl("small", {
			text: option.description,
			cls: "suggestion-note",
		});

		// Right side: edit button
		const editButton = contentContainer.createEl("button", {
			text: "edit",
			cls: "suggestion-edit-btn",
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
		const option = this.options.find((opt) => opt.id === optionId);
		if (!option) return;
		const editModal = new EditSuggestionModal(
			this.app,
			this.plugin,
			option,
			async (updatedOption: ImprovementOption) => {
				// Update the option in the plugin settings
				const index = this.plugin.settings.suggestions.findIndex(
					(opt) => opt.id === updatedOption.id,
				);
				if (index !== -1) {
					this.plugin.settings.suggestions[index] = updatedOption;
				}

				// Save settings
				await this.plugin.saveSettings();

				// Update the current options array for display
				this.options = this.plugin.settings.suggestions.filter(
					(s) => !s.hidden,
				);

				// Refresh the suggester display
				if (this.inputEl) {
					this.inputEl.dispatchEvent(
						new Event("input", { bubbles: true }),
					);
				}

				new Notice(
					`Suggestion "${updatedOption.name}" updated successfully!`,
				);
			},
			async (deletedOptionId: string) => {
				// Remove the suggestion from plugin settings
				const index = this.plugin.settings.suggestions.findIndex(
					(opt) => opt.id === deletedOptionId,
				);
				if (index !== -1) {
					const deletedOption =
						this.plugin.settings.suggestions[index];
					this.plugin.settings.suggestions.splice(index, 1);

					// Save settings to persist the deletion
					await this.plugin.saveSettings();

					// Update the current options array for display
					this.options = this.plugin.settings.suggestions.filter(
						(s) => !s.hidden,
					);

					// Refresh the suggester display
					if (this.inputEl) {
						this.inputEl.dispatchEvent(
							new Event("input", { bubbles: true }),
						);
					}

					new Notice(
						`Suggestion "${deletedOption.name}" deleted successfully!`,
					);
				}
			},
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
				setTimeout(
					() => reject(new Error("Request timeout")),
					timeoutMs,
				);
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
				const toggleQuoteBlock = `\n\n> [!quote]+ AI Response (${option.name})\n> ${answer.trim().replace(/\n/g, "\n> ")}`;

				// Insert the toggle quote block at the current cursor position
				const cursor = this.plugin.lastSelection.editor.getCursor();
				this.plugin.lastSelection.editor.replaceRange(
					toggleQuoteBlock,
					cursor,
					cursor,
				);

				// Store the quote block range for potential deletion (including leading newlines)
				const quoteBlockStart = cursor;
				const quoteBlockLines = toggleQuoteBlock.split("\n");
				const quoteBlockEnd = {
					line: quoteBlockStart.line + quoteBlockLines.length - 1,
					ch: quoteBlockLines[quoteBlockLines.length - 1].length,
				};
				this.plugin.lastQuoteBlockRange = {
					from: quoteBlockStart,
					to: quoteBlockEnd,
					editor: this.plugin.lastSelection.editor,
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

			if (error.message === "Request timeout") {
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