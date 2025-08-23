import { App, Notice, SuggestModal } from "obsidian";
import type AiAssistantPlugin from "./main";
import { ImprovementOption } from "./types";
import { EditSuggestionModal } from "./modals";
import { translate } from "./i18n/language-manager";

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
		this.options = this.plugin.settings.suggestions.filter(
			(s) => !s.hidden,
		);
		setTimeout(() => {
			if (this.inputEl) {
				this.inputEl.dispatchEvent(
					new Event("input", { bubbles: true }),
				);
			}
		}, 0);
	}

	getSuggestions(query: string): ImprovementOption[] {
		if (!this.options) {
			return [];
		}

		if (!query || query.trim() === "") {
			return this.options;
		}

		return this.options.filter(
			(option) =>
				option.name.toLowerCase().includes(query.toLowerCase()) ||
				option.description.toLowerCase().includes(query.toLowerCase()),
		);
	}

	renderSuggestion(option: ImprovementOption, el: HTMLElement) {
		el.addClass("suggestion-item");

		// Create a container for the suggestion content
		const contentContainer = el.createDiv({ cls: "vibe-writing-suggestion-content" });

		// Left side: suggestion info
		const infoContainer = contentContainer.createDiv({
			cls: "vibe-writing-suggestion-info",
		});
		// infoContainer.style.flex = "1";
		infoContainer.createEl("div", {
			text: option.name,
			cls: "suggestion-title",
		});
		infoContainer.createEl("small", {
			text: option.description,
			cls: "suggestion-note",
		});

		const editButton = contentContainer.createEl("button", {
			text: translate("ui.edit"),
			cls: "vibe-writing-suggestion-edit-btn",
		});

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
				const index = this.plugin.settings.suggestions.findIndex(
					(opt) => opt.id === deletedOptionId,
				);
				if (index !== -1) {
					const deletedOption =
						this.plugin.settings.suggestions[index];
					this.plugin.settings.suggestions.splice(index, 1);

					await this.plugin.saveSettings();

					this.options = this.plugin.settings.suggestions.filter(
						(s) => !s.hidden,
					);

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

		// Check if API is configured BEFORE making any API calls
		if (!this.plugin.aiAssistant) {
			new Notice("Please configure your API key in settings before using AI features.");
			this.plugin.updateStatusBar("Ready");
			return;
		}

		try {
			this.plugin.updateStatusBar("Processing...");

			const timeoutMs = 30000; // 30 seconds timeout
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(
					() => reject(new Error("Request timeout")),
					timeoutMs,
				);
			});

			const prompt = `${option.prompt}\n\n${this.plugin.lastSelection.text}`;
			const apiCallPromise = this.plugin.aiAssistant.text_api_call([
				{
					role: "user",
					content: prompt,
				},
			]);

			const answer = await Promise.race([apiCallPromise, timeoutPromise]);

			if (answer && this.plugin.lastSelection.editor) {
				this.plugin.lastAiResponse = answer.trim();
				const toggleQuoteBlock = `\n\n> [!quote]+ AI Response (${option.name})\n> ${answer.trim().replace(/\n/g, "\n> ")}`;
				const cursor = this.plugin.lastSelection.editor.getCursor();
				this.plugin.lastSelection.editor.replaceRange(
					toggleQuoteBlock,
					cursor,
					cursor,
				);
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
				this.plugin.updateStatusBar("Ready");
			} else {
				new Notice("Failed to get AI response. Please try again.");
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
			setTimeout(() => {
				this.plugin.updateStatusBar("Ready");
			}, 3000);
		}
	}
}