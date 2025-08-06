# Vibe Writing

A powerful AI assistant plugin for Obsidian that helps elevate your writing efficiency and improve your writing skills. Vibe Writing integrates multiple AI providers to provide intelligent writing assistance directly within your Obsidian workspace.

## Features

- **Multi-AI Provider Support**: Works with OpenAI, Anthropic (Claude), and Qwen models
- **Writing Improvement**: AI-powered text enhancement and suggestions
- **Smart Selection**: Automatically captures and improves your text selections
- **Image Compression**: Compress images in your notes to save storage space
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
4. Configure image compression settings:
   - **Image Compression Quality**: Set compression quality (0.1-1.0)
   - **Maximum Image Width**: Set max width for compressed images
   - **Maximum Image Height**: Set max height for compressed images

## Usage

### AI Writing Improvement

1. Select any text in your note
2. Use the command palette (Ctrl/Cmd + P) and search for "AI: written improvement"
3. Choose from available improvement options
4. The AI will enhance your selected text

### Available Commands

- **AI: written improvement**: Improve selected text with AI assistance
- **Compress Images in Current Note**: Compress all images referenced in the current note

### Image Compression

1. Open any note that contains images
2. Use the command palette (Ctrl/Cmd + P) and search for "Compress Images in Current Note"
3. The plugin will automatically find and compress all images in the note
4. Images are compressed based on your configured quality and size settings
5. New compressed files are created with compression parameters in the filename
6. The note content is automatically updated to reference the new compressed images
7. Original images are preserved unchanged

**Filename Format**: `originalname_compressed_q80_max1920x1080_1280x720.jpg`
- `q80`: Quality setting (80%)
- `max1920x1080`: Maximum dimensions configured
- `1280x720`: Actual dimensions of compressed image

**Supported Image Formats**: JPG, JPEG, PNG, GIF, BMP, WebP (all converted to JPG)

**Compression Settings**:
- **Quality**: 0.1 (lowest) to 1.0 (highest quality)
- **Max Width**: Maximum width in pixels (default: 1920px)
- **Max Height**: Maximum height in pixels (default: 1080px)

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