export interface Translations {
  // Commands
  'command.written-improvement': string;
  'command.compress-images': string;
  'command.new-prompt': string;
  'command.one-shot-chat': string;
  'command.replace-ai-response': string;
  'command.tidy-history': string;
  
  // Notices
  'notice.no-selection': string;
  'notice.name-prompt-empty': string;
  'notice.editor-not-available': string;
  'notice.text-replaced': string;
  'notice.no-markdown-view': string;
  'notice.no-file-open': string;
  'notice.no-images-found': string;
  'notice.ai-response-failed': string;
  'notice.request-timeout': string;
  'notice.error-occurred': string;
  'notice.ai-response-added': string;
  'notice.please-enter-prompt': string;
  'notice.generating-response': string;
  'notice.copied-to-clipboard': string;
  'notice.copy-failed': string;
  
  // UI Labels
  'ui.name': string;
  'ui.description': string;
  'ui.prompt': string;
  'ui.delete': string;
  'ui.save': string;
  'ui.copy': string;
  'ui.settings-title': string;
  'ui.edit': string;
  'ui.language': string;
  'ui.language-desc': string;
  
  // Placeholders
  'placeholder.enter-prompt': string;
  'placeholder.ai-response': string;
  'placeholder.prompt-input': string;
  'placeholder.api-key': string;
  'placeholder.base-url': string;
  'placeholder.max-tokens': string;
  'placeholder.img-folder': string;
  'placeholder.max-width': string;
  'placeholder.max-height': string;
  
  // Settings
  'settings.openai-key': string;
  'settings.openai-key-desc': string;
  'settings.anthropic-key': string;
  'settings.anthropic-key-desc': string;
  'settings.qwen-key': string;
  'settings.qwen-key-desc': string;
  'settings.qwen-base-url': string;
  'settings.qwen-base-url-desc': string;
  'settings.model-name': string;
  'settings.model-name-desc': string;
  'settings.language': string;
  'settings.language-desc': string;
  'error.prefix': string;
  'error.failed-ai-response': string;
  'message.no-response': string;
	'notice.enter-prompt': string;
	'notice.api-not-configured': string;
	'placeholder.generating-response': string;
	'settings.max-tokens': string;
  'settings.max-tokens-desc': string;
  'settings.img-folder': string;
  'settings.img-folder-desc': string;
  'settings.img-quality': string;
  'settings.img-quality-desc': string;
  'settings.img-max-width': string;
  'settings.img-max-width-desc': string;
  'settings.img-max-height': string;
  'settings.img-max-height-desc': string;
  
  // Confirmation
  'confirm.delete-suggestion': string;
  
  // Validation
  'validation.name-required': string;
  'validation.description-required': string;
  'validation.prompt-required': string;
  
  // Status
  'status.initializing': string;
  'status.ready': string;
  
  // Modal Titles
  'modal.edit-suggestion': string; // Keep the key name for consistency
  'modal.add-new-prompt': string;
  
  // Default Suggestions
  'suggestion.english-improvement.name': string;
  'suggestion.english-improvement.desc': string;
  'suggestion.english-improvement.prompt': string;
  
  // Additional Notices
  'notice.no-ai-response': string;
  'notice.prompt-added-success': string;
  
  // Settings Labels
  'settings.model': string;
  'settings.model-desc': string;
  'settings.image-compression-quality': string;
  'settings.image-compression-quality-desc': string;
  'settings.image-max-width': string;
  'settings.image-max-width-desc': string;
  'settings.image-max-height': string;
  'settings.image-max-height-desc': string;
}