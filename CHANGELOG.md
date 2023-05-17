# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.0.0-beta.9](#100-beta9---2023-05-08)
- [1.0.0-beta.8](#100-beta8---2023-03-09)
- [1.0.0-beta.7](#100-beta7---2023-03-08)
- [1.0.0-beta.6](#100-beta6---2023-03-04)
- [1.0.0-beta.5](#100-beta5---2023-03-04)
- [1.0.0-beta.4](#100-beta4---2023-02-22)
- [1.0.0-beta.3](#100-beta3---2023-02-21)
- [1.0.0-beta.2](#100-beta2---2023-02-19)
- [1.0.0-beta.1](#100-beta1---2023-02-15)

## [Unreleased][]
### Added
- Feedback: love/hate feedback can now be saved as tags (in addition to the online syncing). Tag is configurable; 'FEEDBACK' by default.
- User Recommendations: added Playlists recommendations for the user associated to the token (found at https://listenbrainz.org/user/[USERNAME]/recommendations/). For ex. Daily Jams, Top Discoveries of [YEAR], Top Missed Recordings of [YEAR], ... Automatically refreshed every 30 min or after clicking on the button (list is refreshed the next time the menu is opened).
- User Recommendations: daily jams are automatically enabled when the user sets the token, token is retrieved from other panels or by using a new menu entry at Playlists recommendations submenu. It's done by following ['troi-bot' user](https://community.metabrainz.org/t/would-you-like-to-test-drive-our-first-recommendations-feature/626352). Must only be done once.
### Changed
- YouTube: youtube searches are now cached (during the same session). i.e. matches are found much faster for tracks already searched.
- Feedback: report will also compare online values against the file tags (if available).
- Feedback: retrieving loved/hated tracks from libary will also output library tagged tracks (if available), without duplicates by MBID.
- UI: all reports are now formated as tabulated tables, making them easier to read.
### Removed
### Fixed

## [1.0.0-beta.9] - 2023-05-08
- YouTube: new option to look for not found tracks on library at YouTube when retrieving playlists. Requires 'foo_youtube' component installed. When links are loaded, the entire process is asynchronous and playlist filling may take some seconds. Track order is ensured in the process (contrary to other scripts relying on foobar path loading).
- Token: on first init, panel will try to retrieve user token from other panels (like [Playlist-Manager-SMP](https://github.com/regorxxx/Playlist-Manager-SMP)).
- Token: new menu entry to retrieve user token on demand from other panels (like [Playlist-Manager-SMP](https://github.com/regorxxx/Playlist-Manager-SMP)).
### Changed
- Playlists: pressing shift while clicking on any menu entry which creates a playlist will force tracks shuffling (instead of following the order given by ListenBrainz).
- Helpers: updated helpers.
- Console: menu entries are no longer logged to console after clicking.
- Console: multiple improvements when logging to file for FbMetadbHandle, FbMetadbHandleList, Error and unknown instances (totally irrelevant except for debug purposes).
### Removed
### Fixed
- ListenBrainz: workaround for windows caching of server requests (so sometimes data was not updated with changes on real time).
- Query fixes for track's title or artist having quotes.

## [1.0.0-beta.8] - 2023-03-09
### Added
### Changed
### Removed
### Fixed
- Crash when using drag n' drop if a button file was loaded (instead of using the toolbar), although this installation method is no longer supported.

## [1.0.0-beta.7] - 2023-03-08
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [1.0.0-beta.6] - 2023-03-04
### Added
### Changed
### Removed
### Fixed
- UI: png icons now use a dark-mode version (if available) or get inverted according to the button text color configuration.

## [1.0.0-beta.5] - 2023-03-04
### Added
### Changed
- UI: tweaked and unified buttons weight and margins, adjusted to scale set and DPI.
- UI: minor improvements to readme sub-folders names.
- UI: cursor now changes when over a button.
- UI: cursor now changes while performing buttons drag n' drop. It now clearly indicates when a move is allowed or it's outside the allowed range.
- UI: drag n' drop now only works when the mouse is over a button position. i.e. both the functionality and position rectangle are disabled if the mouse is not on a valid position. Previously moving the button to a blank part of the bar would have simply sent it to the first/last position for ex. This is disallowed now, which makes drag n' drop a bit more intuitive and offers an overall more cohesive experience. It also respects orientation and reflow settings.
- Internal code cleanup of menus.
### Removed
### Fixed
- UI: minor improvements to drag n drop behavior when mouse remains static and R. Click is released. Panel is redrawn immediately instead of waiting to move the mouse, current button remains hovered.
- UI: minor improvements to drag n drop behavior when R. Click menu is called in rapid succession. Panel is redrawn on the background now.
- Console: logging of null value not working properly (totally irrelevant except for debug purposes).

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

[Unreleased]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.9...HEAD
[1.0.0-beta.9]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.8...v1.0.0-beta.9
[1.0.0-beta.8]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.7...v1.0.0-beta.8
[1.0.0-beta.7]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.6...v1.0.0-beta.7
[1.0.0-beta.6]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.5...v1.0.0-beta.6
[1.0.0-beta.5]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.4...v1.0.0-beta.5
[1.0.0-beta.4]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/regorxxx/ListenBrainz-SMP/compare/3c4f2d0...v1.0.0-beta.1