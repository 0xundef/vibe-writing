import {
	DEFAULT_IMAGE_MODEL,
	DEFAULT_OAI_IMAGE_MODEL,
	DEFAULT_MAX_TOKENS,
} from "./settings";

export interface AiAssistantSettings {
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
	imageCompressionQuality: number;
	imageMaxWidth: number;
	imageMaxHeight: number;
}

export const DEFAULT_SETTINGS: AiAssistantSettings = {
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
	imageCompressionQuality: 0.8,
	imageMaxWidth: 1920,
	imageMaxHeight: 1080,
};

export interface ImprovementOption {
	id: string;
	name: string;
	description: string;
	prompt: string;
	hidden?: boolean;
}