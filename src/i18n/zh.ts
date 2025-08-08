import { Translations } from './types';

export const zh: Translations = {
  // Commands
  'command.written-improvement': '写作改进',
  'command.compress-images': '压缩当前笔记中的图片',
  'command.new-prompt': '新建提示',
  'command.one-shot-chat': '单次对话',
  'command.replace-ai-response': '替换为上次AI回复',
  
  // Notices
  'notice.no-selection': '未找到之前的选择。请先选择一些文本。',
  'notice.name-prompt-empty': '名称和提示不能为空！',
  'notice.editor-not-available': '编辑器不可用。',
  'notice.text-replaced': '文本已替换为AI回复！',
  'notice.no-markdown-view': '未找到活动的markdown视图。',
  'notice.no-file-open': '当前没有打开的文件。',
  'notice.no-images-found': '在当前笔记中未找到图片。',
  'notice.ai-response-failed': '获取AI回复失败。请重试。',
  'notice.request-timeout': 'AI请求超时。请重试。',
  'notice.error-occurred': '改进文本时发生错误。',
  'notice.ai-response-added': '已使用{option}添加AI回复！',
  'notice.please-enter-prompt': '请输入提示',
  'notice.generating-response': '正在生成回复...',
  
  // UI Labels
  'ui.name': '名称：',
  'ui.description': '描述：',
  'ui.prompt': '提示：',
  'ui.delete': '删除',
  'ui.save': '保存',
  'ui.settings-title': 'AI助手设置',
  'ui.edit': '编辑',
  'ui.language': '语言',
  'ui.language-desc': '选择界面语言',
  
  // Placeholders
  'placeholder.enter-prompt': '在此输入您的提示...',
  'placeholder.ai-response': 'AI回复将在此显示...',
  'placeholder.prompt-input': '在此输入您的提示...',
  'placeholder.api-key': '输入您的API密钥',
  'placeholder.base-url': '输入您的基础URL',
  'placeholder.max-tokens': '1000',
  'placeholder.img-folder': 'AiAssistant/Assets',
  'placeholder.max-width': '1920',
  'placeholder.max-height': '1080',
  
  // Settings
  'settings.openai-key': 'OpenAI API密钥',
  'settings.openai-key-desc': '输入您的OpenAI API密钥',
  'settings.anthropic-key': 'Anthropic API密钥',
  'settings.anthropic-key-desc': '输入您的Anthropic API密钥',
  'settings.qwen-key': 'Qwen API密钥',
  'settings.qwen-key-desc': '输入您的Qwen API密钥',
  'settings.qwen-base-url': 'Qwen基础URL',
  'settings.qwen-base-url-desc': '输入您的Qwen基础URL',
  'settings.model-name': '模型名称',
  'settings.model-name-desc': '选择要使用的AI模型',
  'settings.max-tokens': '最大令牌数',
  'settings.max-tokens-desc': 'AI回复的最大令牌数',
  'settings.img-folder': '图片文件夹',
  'settings.img-folder-desc': '存储压缩图片的文件夹',
  'settings.img-quality': '图片压缩质量',
  'settings.img-quality-desc': '压缩图片的质量(0.1-1.0)',
  'settings.img-max-width': '最大图片宽度',
  'settings.img-max-width-desc': '压缩图片的最大宽度',
  'settings.img-max-height': '最大图片高度',
  'settings.img-max-height-desc': '压缩图片的最大高度',
  
  // Confirmation
  'confirm.delete-suggestion': '确定要删除建议 "{name}" 吗？',
  
  // Status
  'status.initializing': '初始化中...',
  'status.ready': '就绪',
  
  // Modal Titles
  'modal.edit-suggestion': '编辑建议',
  'modal.add-new-prompt': '添加新提示',
  
  // Default Suggestions
  'suggestion.english-improvement.name': '英语简单改进',
  'suggestion.english-improvement.desc': '拼写和语法纠正',
  'suggestion.english-improvement.prompt': '帮我纠正文本，只关注拼写和语法，将纠正后的文本格式化为markdown，\n最初我会发送给你文本"This is an fish"，你应该返回纠正后的文本"This is ~~an~~ a fish"，这是markdown格式的拼写纠正。\n"I like to eat 冰棍"，你应该返回纠正后的文本"I like to eat ~~冰棍~~ popsicle /ˈpɑːp.sɪ.kəl/"，音标用两个斜杠包围。\n如果没有拼写或语法错误，只需返回原文本。\n如果有语法错误，你应该返回markdown格式的纠正文本。\n注意：不要添加任何额外信息，直接返回纠正后的文本。\n需要纠正的文本：',
  
  // Additional Notices
  'notice.no-ai-response': '没有可用的AI响应。请先生成AI响应。',
  'notice.prompt-added-success': '新提示 "{name}" 添加成功！',
  
  // Settings Labels
  'settings.model': '模型',
	'settings.model-desc': '选择要使用的AI模型',
	'settings.language': '语言',
	'settings.language-desc': '选择界面语言',
	'error.prefix': '错误',
	'error.failed-ai-response': '获取AI响应失败',
	'message.no-response': '未收到AI响应',
	'notice.enter-prompt': '请输入提示',
	'notice.api-not-configured': 'API客户端未配置。请检查您的设置。',
	'placeholder.generating-response': '正在生成响应...',
	'settings.image-compression-quality': '图片压缩质量',
  'settings.image-compression-quality-desc': '图片压缩质量 (0.1 - 1.0)',
  'settings.image-max-width': '图片最大宽度',
  'settings.image-max-width-desc': '压缩图片的最大宽度',
  'settings.image-max-height': '图片最大高度',
  'settings.image-max-height-desc': '压缩图片的最大高度',
};