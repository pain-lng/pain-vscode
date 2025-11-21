# Pain Language VS Code Extension

VS Code extension for Pain programming language - a high-performance, Python-like language for numerical computing and machine learning.

## Features

- ✅ **Syntax Highlighting** - Full syntax highlighting for Pain language and PML (Pain Markup Language)
- ✅ **Custom File Icons** - Beautiful custom icons for `.pain` and `.pml` files
- ✅ **PML Support** - Syntax highlighting for `.pml` files with support for:
  - Keys, values, lists, maps
  - Strings (quoted and unquoted), numbers, booleans, null
  - Comments and tab-based indentation
- ✅ **LSP Integration** - Language Server Protocol support with:
  - Real-time diagnostics and error checking
  - Code completion with context awareness
  - Hover information with function signatures and documentation
  - Support for standard library functions
- ✅ **Formatting** - Code formatting with format on save support
- ✅ **Language Configuration** - Smart indentation, bracket matching, and auto-closing pairs
- ✅ **Documentation Support** - Hover tooltips show doc comments from source code

## Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Pain Language"
4. Click Install

### Manual Installation

1. Download the latest `.vsix` file from [Releases](https://github.com/pain-lng/pain-vscode/releases)
2. Open VS Code
3. Go to Extensions view
4. Click the `...` menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/pain-lng/pain-vscode.git
cd pain-vscode
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run compile
```

4. Run in VS Code:
   - Open `pain-vscode` folder in VS Code
   - Press F5 to open Extension Development Host
   - Open a `.pain` file to test

### Building LSP Server

The extension requires the `pain-lsp` executable. Build it first:

```bash
# From Pain compiler workspace root
cargo build --package pain-lsp

# Or for release
cargo build --release --package pain-lsp
```

The extension will automatically detect the LSP server in:
- `target/debug/pain-lsp` (development)
- `target/release/pain-lsp` (release)
- Or use `pain.lsp.path` setting to specify custom path

## Configuration

### Settings

- `pain.lsp.path` - Path to Pain LSP server executable (leave empty for auto-detection)
- `pain.format.enable` - Enable format on save (default: `true`)
- `pain.lsp.trace` - Trace LSP communication (`off`, `messages`, `verbose`)

### Usage

1. Open a `.pain` or `.pml` file
2. The extension will automatically:
   - Provide syntax highlighting
   - For `.pain` files: Show diagnostics (errors and warnings), offer code completion (Ctrl+Space), display hover information (hover over functions), format code on save (if enabled)
   - For `.pml` files: Provide syntax highlighting for PML markup

## Building and Packaging

### Prerequisites

1. Create the extension icon:
   - The extension requires `resources/icon.png` (128x128 pixels)
   - You can convert `resources/icon.svg` to PNG using any image editor
   - See `resources/README.md` for instructions

2. Install packaging tool:
```bash
npm install -g @vscode/vsce
```

### Build

```bash
# Compile TypeScript
npm run compile

## Requirements

- VS Code 1.75.0 or higher
- Pain LSP server (built from [pain-lng/pain](https://github.com/pain-lng/pain))

## Contributing

Contributions are welcome! Please see the [main Pain repository](https://github.com/pain-lng/pain) for contribution guidelines.

## License

MIT License - see LICENSE file for details
