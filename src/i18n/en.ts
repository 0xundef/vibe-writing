import { Translations } from './types';

export const en: Translations = {
  // Commands
  'command.written-improvement': 'Written improvement',
  'command.compress-images': 'Compress Image in Current Note',
  'command.new-prompt': 'New prompt',
  'command.one-shot-chat': 'One shot chat',
  'command.replace-ai-response': 'Replace with last AI response',
  
  // Notices
  'notice.no-selection': 'No previous selection found. Please select some text first.',
  'notice.name-prompt-empty': 'Name and prompt cannot be empty!',
  'notice.editor-not-available': 'Editor not available.',
  'notice.text-replaced': 'Text replaced with AI response!',
  'notice.no-markdown-view': 'No active markdown view found.',
  'notice.no-file-open': 'No file is currently open.',
  'notice.no-images-found': 'No images found in the current note.',
  'notice.ai-response-failed': 'Failed to get AI response. Please try again.',
  'notice.request-timeout': 'AI request timed out. Please try again.',
  'notice.error-occurred': 'Error occurred while improving text.',
  'notice.ai-response-added': 'AI response added using {option}!',
  'notice.please-enter-prompt': 'Please enter a prompt',
  'notice.generating-response': 'Generating response...',
  'notice.copied-to-clipboard': 'Response copied to clipboard!',
  
  // UI Labels
  'ui.name': 'Name:',
  'ui.description': 'Description:',
  'ui.prompt': 'Prompt:',
  'ui.delete': 'Delete',
  'ui.save': 'Save',
  'ui.copy': 'Copy',
  'ui.settings-title': 'AI Assistant Settings',
  'ui.edit': 'edit',
  'ui.language': 'Language',
  'ui.language-desc': 'Select interface language',
  
  // Placeholders
  'placeholder.enter-prompt': 'Enter your prompt here...',
  'placeholder.ai-response': 'AI response will appear here...',
	'placeholder.prompt-input': 'Enter your prompt here...',
	'placeholder.api-key': 'Enter your API key',
  'placeholder.base-url': 'Enter your Base URL',
  'placeholder.max-tokens': '1000',
  'placeholder.img-folder': 'AiAssistant/Assets',
  'placeholder.max-width': '1920',
  'placeholder.max-height': '1080',
  
  // Settings
  'settings.openai-key': 'OpenAI API Key',
  'settings.openai-key-desc': 'Enter your OpenAI API key',
  'settings.anthropic-key': 'Anthropic API Key',
  'settings.anthropic-key-desc': 'Enter your Anthropic API key',
  'settings.qwen-key': 'Qwen API Key',
  'settings.qwen-key-desc': 'Enter your Qwen API key',
  'settings.qwen-base-url': 'Qwen Base URL',
  'settings.qwen-base-url-desc': 'Enter your Qwen Base URL',
  'settings.model-name': 'Model Name',
  'settings.model-name-desc': 'Select the AI model to use',
  'settings.max-tokens': 'Max Tokens',
  'settings.max-tokens-desc': 'Maximum number of tokens for AI responses',
  'settings.img-folder': 'Image Folder',
  'settings.img-folder-desc': 'Folder to store compressed images',
  'settings.img-quality': 'Image Compression Quality',
  'settings.img-quality-desc': 'Quality of compressed images (0.1-1.0)',
  'settings.img-max-width': 'Max Image Width',
  'settings.img-max-width-desc': 'Maximum width for compressed images',
  'settings.img-max-height': 'Max Image Height',
  'settings.img-max-height-desc': 'Maximum height for compressed images',
  
  // Confirmation
  'confirm.delete-suggestion': 'Are you sure you want to delete the suggestion "{name}"?',
  
  // Status
  'status.initializing': 'Initializing...',
  'status.ready': 'Ready',
  
  // Modal Titles
  'modal.edit-suggestion': 'Edit Prompt', // Changed from 'Edit Suggestion'
  'modal.add-new-prompt': 'Add New Prompt',
  
  // Default Suggestions
  'suggestion.english-improvement.name': 'English Simple improvement',
  'suggestion.english-improvement.desc': 'Typo and grammar correction',
  'suggestion.english-improvement.prompt': 'Help me to correct text, just focus on typo and grammar, format the corrected text as markdown,\ninitially I will send you text "This is an fish", you should return the corrected text "This is ~~an~~ a fish", which is a typo correction in markdown format.\n"I like to eat 冰棍 " , you should return the corrected text "I like to eat ~~冰棍~~ popsicle /ˈpɑːp.sɪ.kəl/", the phonetic symbol is wrapped by two slashes.\nIf there is no typo or grammar error, just return the original text.\nIf there is a grammar error, you should return the corrected text in markdown format.\nCaution: Do not add any extra information, just return the corrected text directly.\nThe text need to be corrected:',
  
  // Additional Notices
  'notice.no-ai-response': 'No AI response available. Please generate an AI response first.',
  'notice.prompt-added-success': 'New prompt "{name}" added successfully!',
  
  // Settings Labels
  'settings.model': 'Model',
	'settings.model-desc': 'Select the AI model to use',
	'settings.language': 'Language',
	'settings.language-desc': 'Select the interface language',
	'error.prefix': 'Error',
	'error.failed-ai-response': 'Failed to get AI response',
	'message.no-response': 'No response received from AI',
	'notice.enter-prompt': 'Please enter a prompt',
	'notice.api-not-configured': 'API client not configured. Please check your settings.',
	'placeholder.generating-response': 'Generating response...',
	'settings.image-compression-quality': 'Image Compression Quality',
  'settings.image-compression-quality-desc': 'Quality for image compression (0.1 - 1.0)',
  'settings.image-max-width': 'Image Max Width',
  'settings.image-max-width-desc': 'Maximum width for compressed images',
  'settings.image-max-height': 'Image Max Height',
  'settings.image-max-height-desc': 'Maximum height for compressed images',
};