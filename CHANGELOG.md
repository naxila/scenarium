# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7-alpha] - 2024-12-11

### Fixed
- **Media Group with Inline Buttons**: Fixed inline keyboard not showing when sending media groups with `inlineActions`
  - Telegram API doesn't support `reply_markup` parameter for `sendMediaGroup` method
  - Workaround implemented: When sending media group (2+ attachments) with `inlineActions`, caption is now sent as a separate message with inline keyboard
  - Media group is sent without caption, immediately followed by caption message with buttons
  - Single attachment messages work as before with caption and buttons together
  - This ensures inline buttons are always visible when using multiple attachments

### Improved
- **Detailed Logging**: Added comprehensive debug logging for `inlineActions` processing in `SendMessageAction`
  - Logs original and processed `inlineActions` arrays with full JSON structure
  - Logs created inline keyboard structure for debugging
  - Helps troubleshooting button-related issues

## [0.1.6-alpha] - 2024-12-10

### Fixed
- **Media Group Handling**: Fixed video duplication issue in media groups by adding deduplication logic based on `message_id`
  - Prevents the same video from being added twice when processing media groups
  - Added logging to track video and document processing in media groups
  - Same fix applied to all media types (photos, videos, documents)
- **Media Group with Inline Buttons**: Fixed inline keyboard not showing when sending media groups
  - Telegram API doesn't support `reply_markup` for `sendMediaGroup` method
  - Workaround: When sending media group with `inlineActions`, caption is now sent as a separate message with inline keyboard
  - Media group is sent without caption, followed by caption message with buttons
  - This ensures buttons are always visible when using multiple attachments

### Improved
- **Detailed Logging**: Added comprehensive debug logging for `inlineActions` processing in `SendMessageAction`
  - Logs original and processed `inlineActions` arrays
  - Logs created inline keyboard structure
  - Helps debugging button-related issues

## [0.1.5-alpha] - 2024-12-10

### Added
- **Full Context Object Interpolation**: Support for interpolating entire context objects (`{{params}}`, `{{data}}`, `{{env}}`, `{{local}}`) in addition to their properties
  - When a string contains ONLY a single context object interpolation (e.g., `"{{params}}"`), the entire object is returned instead of being converted to a string
  - Works in all scenarios: Navigate action params, Dump function, SendMessage attachments, etc.
  - Makes it possible to pass all parameters at once: `"params": "{{params}}"` instead of listing each field individually

### Fixed
- **Interpolation System**: Fixed context object lookup to return the object itself when interpolating `{{params}}`, `{{data}}`, `{{env}}`, or `{{local}}` without properties
- Previously, `{{params}}` would look for a variable named "params" inside `context.params` (resulting in undefined)
- Now correctly returns the entire `context.params` object when appropriate

### Improved
- Better support for dynamic parameter passing between menu items
- Simplified scenario syntax - no need to explicitly list all parameter fields when passing data
- Enhanced debugging capabilities with Dump function now able to display entire context objects

## [0.1.4-alpha] - 2024-12-07

### Added
- **Navigate Action**: Added `params` parameter (object) that passes data to menu item context, accessible via `{{params.key}}` interpolation
- **SendMessage Action**:
  - `attachments` array support (replaces single `attachment`) - supports media groups for multiple files
  - `replyKeyboard` as structured object with `buttons`, `resizeKeyboard`, `oneTimeKeyboard`, and `onSent` callback
  - `onSent` callback for reply keyboard buttons - actions executed when button is pressed, with `value` accessible via `{{replyKeyboardValue}}`
  - `url` support for inline buttons (opens external pages when `onClick` is not defined)
  - `clearKeyboard` parameter (defaults to `true`) - clears reply keyboard when no other keyboard is specified
- **RequestInput Action**:
  - `allowAttachments` parameter - enables attachment support, stored in `key_attachments` array
  - Enhanced attachment metadata - returns rich objects with `type`, `fileId`, `fileUniqueId`, `fileName`, `mimeType`, `fileSize`, `width`, `height`, `duration` (where applicable)
  - Improved text extraction from `caption` when sending attachments with text
- Documentation updates for all new features in both English and Russian

### Fixed
- Fixed text not being saved when sending attachments with text in `RequestInput`
- Fixed reply keyboard not clearing when `SendMessage` is called from menu items
- Fixed caching bug with reply keyboard actions (deep copy of `onSent` to prevent mutation)
- Fixed keyboard clearing logic to respect Telegram API limitations (cannot send `inline_keyboard` and `remove_keyboard` simultaneously)

### Improved
- Better keyboard management - `clearKeyboard` defaults to `true` for cleaner UX
- Enhanced attachment handling with full metadata support
- Improved documentation with examples and API limitation notes

## [0.1.3-alpha] - 2024-10-23

### Added
- **Switch Function**: New multi-way conditional logic function with `value` parameter and array of `cases` (each with `match` and `result`). `result` can be any type (primitive, function, action, or array).
- **CombineArrays Function**: New function that takes an `arrays` parameter (array of arrays) and returns a single array containing all items from input arrays. Ignores `null` values.
- **ArraySize Function**: New function that takes a `value` (array) and returns an integer representing the number of elements.
- **DateFormat Function**: New function that takes a `date` (string like "2025-10-22T00:15:51.163Z") and a `format` string, returning a formatted date string.
- **Compare Function**: New function that takes `value1`, `value2` (numbers), and an `operator` (more, moreThanOrEquals, equals, less, lessThanOrEquals), returning `true` or `false`.
- Documentation for all new functions in both English and Russian
- Links to new function documentation in the sidebar

### Fixed
- Fixed processing of action arrays in `onSuccess` and `onFailure` callbacks in `RequestApiAction.ts`
- Fixed `null` value handling in action arrays to prevent breaking
- Fixed function evaluation within `inlineActions` to work correctly
- Fixed array processing in `CombineArrays` and other functions to ignore `null` values

### Improved
- Enhanced error handling for function evaluation
- Better support for nested action processing
- Improved documentation structure and navigation

## [0.1.2-alpha] - 2024-10-22

### Added
- Analytics interface improvements
- Enhanced bot wrapper functionality

## [0.1.1-alpha] - 2024-10-22

### Added
- Initial analytics support
- Bot service enhancements

## [0.1.0-alpha] - 2024-10-22

### Added
- Initial release
- Core bot functionality
- Scenario processing
- Basic actions and functions