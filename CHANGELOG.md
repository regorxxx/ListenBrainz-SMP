# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.0.0-beta.4](#100-beta4---2023-02-22)
- [1.0.0-beta.3](#100-beta3---2023-02-21)
- [1.0.0-beta.2](#100-beta2---2023-02-19)
- [1.0.0-beta.1](#100-beta1---2023-02-15)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

## [1.0.0-beta.4] - 2023-02-22
### Added
- UI: default fonts (buttons, icons, toolbar text and tooltip) may now be changed at '[foobar profile]\js_data\presets\global\globFonts.json'.
### Changed
- UI: improved compatibility with some fonts under Unix systems (using Wine). Sometimes weird chars appeared on menu entries.
### Removed
### Fixed

## [1.0.0-beta.3] - 2023-02-21
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed
- Buttons: properties were sometimes reset/mixed/not saved properly moving buttons using the 'Change buttons position' menu. It worked fine using drag n' drop though.

## [1.0.0-beta.2] - 2023-02-19
### Added
- UI: added settings for buttons color (the border and filling).
- UI: added settings for buttons transparency (the filling).
### Changed
- UI: enhanced colors and shading for buttons on mouse over/down when using custom toolbar color modes, etc.
- UI: pressing Ctrl resets selected setting on buttons bar colors submenu.
- Helpers: updated helpers
### Removed
### Fixed
- Buttons: fixed 'Restore default buttons' entry crash (not needed anymore since there are no more 'default buttons'), now replaced with 'Restore all buttons' (which simply restores back default settings for every button).
- Readmes: added missing 'Toolbar' readme.

## [1.0.0-beta.1] - 2023-02-15
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.4...HEAD
[1.0.0-beta.4]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/regorxxx/ListenBrainz-SMP/compare/3c4f2d0...v1.0.0-beta.1