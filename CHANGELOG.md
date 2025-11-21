# Change Log

All notable changes to the Pain Language VS Code Extension will be documented in this file.

## [0.2.0] - 2024

### Added
- **PML (Pain Markup Language) support**:
  - Syntax highlighting for `.pml` files
  - PML-specific language configuration (tab-based indentation, comments)
  - Support for PML syntax: keys, values, lists, strings, numbers, booleans, null
- **Custom file icons**:
  - Custom icons for `.pain` files (blue gradient with "P")
  - Custom icons for `.pml` files (green gradient with "PML")
  - File icon theme "Pain Language Icons" automatically applied
- Enhanced syntax highlighting with better support for:
  - Function and class definitions
  - Triple-quoted strings (doc comments)
  - Numeric literals (integers and floats)
  - Boolean and null literals
- Format on save support
- LSP trace output channel for debugging
- Improved language configuration with:
  - Triple-quoted string support
  - Better indentation rules
  - Word pattern matching
- Document range formatting provider
- Better error handling and user feedback

### Improved
- Syntax highlighting accuracy
- LSP integration stability
- Code completion context awareness
- Hover information display

### Fixed
- File watcher pattern for `.pain` files
- Format command error handling
- LSP server path detection

## [0.1.0] - Initial Release

### Added
- Basic syntax highlighting
- LSP integration (diagnostics, completion, hover)
- Language configuration
- Format document command
