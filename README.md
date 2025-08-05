# Vibe Writing

A powerful AI assistant plugin for Obsidian that helps elevate your writing efficiency and improve your writing skills. Vibe Writing integrates multiple AI providers to provide intelligent writing assistance directly within your Obsidian workspace.

## Features

- **Multi-AI Provider Support**: Works with OpenAI, Anthropic (Claude), and Qwen models
- **Writing Improvement**: AI-powered text enhancement and suggestions
- **Smart Selection**: Automatically captures and improves your text selections
- **Flexible Configuration**: Customizable model settings and API configurations
- **Seamless Integration**: Works natively within Obsidian's interface

## Installation

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files to your Obsidian plugins folder: `<vault>/.obsidian/plugins/vibe-writing/`
3. Reload Obsidian or enable the plugin in Settings → Community Plugins

### From Obsidian Community Plugins

*Coming soon - plugin is currently in development*

## Configuration

1. Go to Settings → Community Plugins → Vibe Writing
2. Configure your API keys:
   - **OpenAI API Key**: For GPT models
   - **Anthropic API Key**: For Claude models  
   - **Qwen API Key**: For Qwen/DashScope models
3. Select your preferred model and adjust settings:
   - **Model Name**: Choose from available AI models
   - **Max Tokens**: Set the maximum number of tokens for responses
   - **Qwen Base URL**: Custom endpoint (default: Alibaba Cloud)

## Usage

### AI Writing Improvement

1. Select any text in your note
2. Use the command palette (Ctrl/Cmd + P) and search for "AI: written improvement"
3. Choose from available improvement options
4. The AI will enhance your selected text

### Available Commands

- **AI: written improvement**: Improve selected text with AI assistance

## Supported AI Models

The plugin supports various models from different providers:

- **OpenAI**: GPT-3.5, GPT-4, and other OpenAI models
- **Anthropic**: Claude models
- **Qwen**: Alibaba's Qwen models via DashScope

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/nilisnone/vibe-writing.git
cd vibe-writing

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── main.ts          # Main plugin file
├── openai_api.ts    # AI API integrations
└── settings.ts      # Plugin settings
```

## Requirements

- Obsidian v0.15.0 or higher
- Valid API key for at least one supported AI provider

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Author

Created by [Nilis None](https://github.com/nilisnone)

---

## Support the Project

If you find Vibe Writing helpful, consider supporting its development:

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-violet.png)](https://buymeacoffee.com/nilisnone)

Your support helps maintain and improve this plugin. Thank you! ☕