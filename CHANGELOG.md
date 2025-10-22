# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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