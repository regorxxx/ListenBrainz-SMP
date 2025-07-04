# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [2.3.0](#230---2024-10-09)
- [2.2.0](#220---2024-08-13)
- [2.1.0](#210---2024-07-30)
- [2.0.0](#200---2024-07-24)
- [1.7.0](#170---2024-03-21)
- [1.6.0](#160---2024-02-28)
- [1.5.0](#150---2023-12-08)
- [1.4.0](#140---2023-11-28)
- [1.3.0](#130---2023-11-24)
- [1.2.1](#121---2023-11-16)
- [1.2.0](#120---2023-11-15)
- [1.1.0](#110---2023-10-05)
- [1.0.4](#104---2023-09-25)
- [1.0.3](#103---2023-09-20)
- [1.0.2](#102---2023-09-14)
- [1.0.1](#101---2023-07-29)
- [1.0.0](#100---2023-07-28)
- [1.0.0-beta.11](#100-beta11---2023-06-29)
- [1.0.0-beta.10](#100-beta10---2023-06-27)
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
- Pano scrobbler: added folksonomy tags uploading, retrieved from genre and style tags.
- UI: toolbar tooltip now shows 'Shift + Win + R. Click' shortcut to open SMP/JSpliter panel menu (which works globally on any script and panel, at any position).
- Readmes: Ctrl + L. Click on any entry within 'Add button' submenu on toolbar now opens directly their associated readme (without actually adding the button).
- Playlists: added sorting method by name.
- Playlists: re-added 'Create daily jams' setting for playlists.
- Installation: new panel menu, accessed through 'Ctrl + Win + R. Click' (which works globally on any script and panel, at any position), used to export/import panel settings and any other associated data. These entries may be used to fully backup the panel data, help when moving between different JS components (JSplitter <-> SMP) or even foobar2000 installations,, without needing to manually backup the panel properties or other external files (like .json, etc.).
- Configuration: external files like world map database references are now exposed as a panel property.
### Changed
- Installation: added popup warnings when scripts are installed outside foobar2000 profile folder. These checks can be tweaked at globSettings.json.
- Installation: script may now be installed at any path within the foobar profile folder, no longer limited to '[FOOBAR PROFILE FOLDER]\scripts\SMP\xxx-scripts\' folder. Obviously it may still be installed at such place, which may be preferred if updating an older version.
- Installation: multiple improvements to path handling for portable and non-portable installations. By default scripts will always try to use only relative paths to the profile folder, so scripts will work without any change when exporting the profile to any other installation. This change obviously doesn't apply to already existing installations unless restoring defaults.
- [JSplitter (SMP)](https://foobar2000.ru/forum/viewtopic.php?t=6378&start=360) support for locked playlists.
- Playlists: submenus now show the letter or date of the playlist range, and not only the number of playlists. i.e. '00 - 10 [A - C]'.
- UI: unified script updates settings across all my scripts, look for 'Updates' submenu.
- Helpers: updated helpers.
- Helpers: general code cleanup on menus internal code. Please report any bug on extra separators or menu entries not working as expected.
### Removed
### Fixed
- API: wrong encoding of special chars '; , / ? : @ & = + $ #' for artist lookups.
- SMP Dynamic menu: fixed multiple errors on dynamic menus (un)registering.
- UI: '&' being displayed as '_' on tooltips.
- UI: memory leak due to wrong handling of icons in some cases (resulting on more than one file handle), in particular the MusicBrainz button icon.
- UI: multiple workarounds for rounded rectangles not being painted properly or producing crashes (SMP limitation).

## [2.3.0] - 2024-10-09
### Added
### Changed
- Configuration: changed the remove duplicates bias to prefer tracks containing 'BEST' within a 'TRACKDSP' tag.
- [JSplitter (SMP)](https://foobar2000.ru/forum/viewtopic.php?t=6378&start=360) support and ES2021 compatibility.
- Helpers: in case saving a file throws an error due to long paths (+255 chars) a warning popup will be shown.
- Helpers: updated helpers.
### Removed
### Fixed
- Feedback: fixed cache uploading at startup. Cache file was not updated after a successful upload, thus triggering feedback uploading multiple times (which had no consequence but refreshing the timestamp at server).

## [2.2.0] - 2024-08-13
### Added
- Similar artists: new entries to create a similar artists database in JSON equal to the one found at [Search by Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP) and tag files with the 10 most similar artists into 'SIMILAR ARTISTS LISTENBRAINZ' tag.
- YouTube: added support for 'MUSICBRAINZ_ALBUMARTISTID' and 'MUSICBRAINZ_ARTISTID' tags if available for user recommendations.
- Tags: similar artist tags may now be remapped (globally) at '[FOOBAR_PROFILE]\js_data\presets\global\globTags.json'.
### Changed
- User recommendations: changed the logic to just retrieve and use one of the 10 most similar users, instead of relying on an specific similarity threshold.
- Similar artists: in case less than 5 artists are retrieved, it will retry the lookup with a different algorithm which usually retrieves more results.
- UI: added a restore defaults option to every track recommendations entry.
- Helpers: updated helpers.
### Removed
- User recommendations: there is only a single option now (since ListenBrainz API dropped the other algorithms).
- Similar users: there is only a single option now (since ListenBrainz API dropped the other algorithms).
### Fixed
- UI: menu entries requiring a selection are now greyed out if there is no selection.
- API: updated with latest ListenBrainz API changes.

## [2.1.0] - 2024-07-30
### Added
### Changed
- Helpers: updated helpers.
### Removed
### Fixed

## [2.0.0] - 2024-07-24
### Added
- Pano Scrobbler: new importing options for [Pano Scrobbler](https://github.com/kawaiiDango/pano-scrobbler) local .jsonl files, which allows to save listens to a local file on the media device and upload them on demand. It also works for feedback (loved tracks). This may be used to track listens on DAPs and other media devices without internet connection or network problems (ListenBrainz syncing does not work on Android 7 and lower).
- Readmes: added readme for global settings found at 'foobar2000\js_data\presets\global' .json files.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for console logging to file. Disabled by default. Now this is a change from the previous behavior, where console was always logged to 'console.log' file at the [FOOBAR PROFILE FOLDER]. It can now be switched, but since it's probably not useful for most users is disabled by default.
### Changed
- Remove Duplicates: improved performance of duplicates removal in multiple places.
- Configuration: changed the remove duplicates bias to prefer lossless tracks with 16 bits per sample, 44.1 Khz sample rate and greater %DYNAMIC RANGE% values.
- UI: menu entries renaming and reorganization.
- Helpers: json button files are now saved with Windows EOL for compatibility improvements with Windows text editors.
- Helpers: updated helpers.
- Improved compatibility when running foobar2000 on drives without recycle bin.
### Removed
- Playlists: daily jams setting, since now it's always active in ListenBrainz. There is no need anymore to manually enable it.
### Fixed
- API: updated with latest ListenBrainz API changes.
- UI: tooltip cut to 50 chars per tag line.
- Configuration: .json files at 'foobar2000\js_data\presets\global' not being saved with the calculated properties based on user values from other files.
- Fixed possible crash handling web request while closing foobar2000. See [this](https://hydrogenaud.io/index.php/topic,121047.msg1044579.html#msg1044579), although current methods don't use 'WinHttp.WinHttpRequest.5.1' but 'Microsoft.XMLHTTP' which hasn't given any problems yet.

## [1.7.0] - 2024-03-21
### Added
- Feedback: new query filter (independent to the other filter already available) to find matched tracks when looking for loved/hated tracks. It may be used to discard specific releases by tags (like live versions or remasters).
- Feedback: new setting to switch track matching by MBID only or also use ARTIST/TITLE tags.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting for panel repaint debugging purpose. Disabled by default.
### Changed
- UI: minor menu entries renaming.
- UI: improved panel repaint routines to minimize resources usage.
### Removed
### Fixed

## [1.6.0] - 2024-02-28
### Added
- Playlists: playlists created by the user (in addition to recommendations) can now be imported. They are listed by name and can be sorted by name, creation or last modified date.
- Playlists: playlist exporting to user profile. Note this exporting option is different to the one found at [Playlist-Manager-SMP](https://github.com/regorxxx/Playlist-Manager-SMP) in one thing, the MBID is not saved anywhere (contrary to saving it on a playlist file), so there is no playlist tracking at all and exporting the same playlists multiple times will only update the playlist on the server (instead of creating a new one) as long as the playlist names are strictly equal.
- Playlists: playlist importing by MBID. This allows to import any playlist from any user, not just your own. Input allows the MBID or the link (which also contains the MBID).
- Configuration: added COMPOSER to the list of global tags.
- Configuration: added LOCALE LAST.FM to the list of global tags.
- Configuration: added integrity checks to global user settings files, found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\[...].json'. In particular queries are now check to ensure they are valid and will throw a popup at init otherwise. Other settings are check to ensure they contain valid values too.
- Configuration: expanded user configurable file at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json' with a new setting to output to console profiling logs at script init. They work globally. Disabled by default.
- Toolbar: new settings for text (or icon) position: left, right (default), top and bottom. These settings mimic CUI options at the buttons bar.
- Toolbar: new settings for text scale (now independent of button and icon scale).
- Toolbar: new settings for icon scale (now independent of button and text scale).
### Changed
- Configuration: changed the remove duplicates bias to prefer tracks with higher play-counts and positive feedback tag (love/hate).
- Helpers: updated helpers.
- Console: improved log file formatting on windows text editors which parse new lines only with CR+LF instead of LF.
- Code cleanup.
### Removed
### Fixed
- Playlist Recommendations: importing playlists did not retrieve all possible Youtube tracks in some cases.
- Track Recommendations: not retrieving any result due to API changes.
- Toolbar: buttons' size not restored back to normal height after disabling 'Full size buttons' without reloading the panel.
- Helpers: added missing helper.
- UI: wrong parsing of png masks on unix systems (currently, it only affected the ListenBrainz icon when changing the font color).
- Minor fixes.

## [1.5.0] - 2023-12-08
### Added
- Toolbar: now supports color for image icons (which are not drawn using fonts).
### Changed
- ListenBrainz icon now matches the button text color, instead of being only black or white.
- Helpers: updated helpers.
### Removed
### Fixed

## [1.4.0] - 2023-11-28
### Added
- Buttons bar: added compatibility with headless mode (for other buttons).
- UI: added setting to disable tooltip on all scripts. Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bTooltip'. By default tooltip is always shown. This setting will never be exposed within foobar, only at this file.
### Changed
- Helpers: updated helpers.
- Improved error messages about features not working related to OS checks (at startup) with tips and warnings.
### Removed
### Fixed

## [1.3.0] - 2023-11-24
### Added
- Buttons bar: new setting to enable asynchronous loading of buttons, now the default behavior.
### Changed
- Helpers: updated helpers.
- Console: reduced max log file size to 1 MB.
### Removed
### Fixed
- Auto-update: changed logic to check [Playlist Tools](https://github.com/regorxxx/Playlist-Tools-SMP/)'s buttons updates independently to the toolbar version, so mixed scripts versions no longer produce false negatives.

## [1.2.1] - 2023-11-16
### Added
### Changed
- Buttons bar: transparency input popup now has a description for the values.
### Removed
### Fixed
- Buttons bar: border setting was grayed out when the buttons color had been set.

## [1.2.0] - 2023-11-15
### Added
- Auto-update: added -optional- automatic checks for updates on script load; enabled by default. Compares version of current file against GitHub repository. Manual checking can also be found at the settings menu. For buttons within the toolbar every button will check for updates independently (although the toolbar menu has an entry for batch checking). Setting may also be globally switched at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bAutoUpdateCheck'. It will apply by default to any new installed script (previous scripts will still need to be manually configured to change them).
- Buttons bar: added some safe-checks to panel properties.
- Buttons bar: added custom button hover color and customization.
- Buttons bar: added custom offset for buttons along X/Y axis.
- Buttons bar: added full size mode for buttons, which will use full Width/Height according to Y/X orientation.
- Added setting to disable popups related to features not being supported by the OS (at startup). Found at '[FOOBAR PROFILE FOLDER]\js_data\presets\global\globSettings.json', by changing 'bPopupOnCheckSOFeatures'. By default popups are always shown. This setting will never be exposed within foobar, only at this file.
### Changed
- Configuration: improved user retrieval on mouse over button, limited to run once per 2500 ms.
- UI: toolbar's color menu entries now show the color name along the menu entry. 'none' equals to no color.
- Buttons bar: renamed background buttons to 'Use themed buttons', which depends on the windows theme.
- Helpers: updated helpers.
### Removed
- Configuration: unnecessary logging on mouse over button if no user was provided.
### Fixed
- Feedback: minor fix to cache reports when an upload throws an error.
- Crash without lastfm tools button also loaded.

## [1.1.0] - 2023-10-05
### Added
- Track Recommendations: tag remapping is now available (configuration) along customizable entries (advanced configuration) for 'Tracks recommendations'.
- Track Recommendations: new submenu at 'Tracks recommendations to get popular tracks by the chosen similar artist, like the one found at [Last.fm tools](https://github.com/regorxxx/Playlist-Tools-SMP).
### Changed
- Configuration: expanded user configurable files at '[FOOBAR PROFILE FOLDER]\js_data\presets\global' with new queries. File will be automatically updated with new values (maintaining the user settings).
- Configuration: improved the user configurable files update check for missing keys.
### Removed
### Fixed

## [1.0.4] - 2023-09-25
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [1.0.3] - 2023-09-20
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [1.0.2] - 2023-09-14
### Added
### Changed
- Helpers: updated helpers
### Removed
### Fixed

## [1.0.1] - 2023-07-29
### Added
### Changed
### Removed
### Fixed
- Configuration: some fixes for ALBUM ARTIST usage instead of ARTIST. To apply the change on existing installations, delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files.

## [1.0.0] - 2023-07-28
### Added
### Changed
- Configuration: ALBUM ARTIST is now used instead of ARTIST by default (on new installations). This ensures better compatibility with classical music, where the artist is the actual performer but the album artist is the original composer/artist. To apply the change on existing installations, delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files. Further configuration may be needed via menus.
- Helpers: updated helpers.
- Console: remove unnecessary logging retrieving user response.
### Removed
### Fixed
- Crash using recommended recordings by user.
- Fix for non [standard hyphen chars](https://jakubmarian.com/hyphen-minus-en-dash-and-em-dash-difference-and-usage-in-english/) on path names.

## [1.0.0-beta.11] - 2023-06-29
### Added
### Changed
### Removed
### Fixed
- Helpers: fixed incorrect warning about missing font.

## [1.0.0-beta.10] - 2023-06-27
### Added
- Feedback: love/hate feedback can now be saved as tags (in addition to the online syncing). Tag is configurable; 'FEEDBACK' by default.
- Playlists Recommendations: added Playlists recommendations for the user associated to the token (found at https://listenbrainz.org/user/[USERNAME]/recommendations/). For ex. Daily Jams, Top Discoveries of [YEAR], Top Missed Recordings of [YEAR], ... Automatically refreshed every 30 min or after clicking on the button (list is refreshed the next time the menu is opened).
- Playlists Recommendations: daily jams are automatically enabled when the user sets the token, token is retrieved from other panels or by using a new menu entry at Playlists recommendations submenu. It's done by following ['troi-bot' user](https://community.metabrainz.org/t/would-you-like-to-test-drive-our-first-recommendations-feature/626352). Must only be done once. This playlist is just a mix of music already listened to.
- Playlists Recommendations: added setting to only find matches by MBID. Greatly speedups the process of searching matches in library.
- Similar users: recommendations by similar users. A mix from the ones available at 'User recommendations' is chosen for a random similar user. Meant to discover similar music to the one you like.
- Track Recommendations: added entries to find similar artists or recordings to the focused track's artist. Also by multiple tags and folksonomy. Tracks output are preferred by higher rating and not live tracks (if possible). Delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files after installation.
- Track Recommendations: supports -full- tag retrieval from [WilB's Biography script](https://github.com/Wil-B/Biography). i.e. genres, styles, locale tags, etc. are added to the file tags on the submenus as available values. Bio tags state is displayed at tooltip, warning when tags are not found (usually requires some seconds).
- Track Recommendations: supports 'locale' tag retrieval from [World-Map-SMP](https://github.com/regorxxx/World-Map-SMP), independently of Bio panel. i.e. it looks at the local database for matches by artist (so it works even for artists not found by Bio panel, multi-value artists tags and artists manually tagged by user on the panel). Bio and World Map tag retrieval can coexist, duplicates are removed in any case.
- Track Recommendations: supports 'LASTFM_SIMILAR_ARTIST' tag retrieval from [foo_uie_biography](https://foobar2000.xrea.jp/?User+interface/UI+extension#kbe7a3bd), independently of Bio panel. Bio and foo_uie_biography tag retrieval can coexist, duplicates are removed in any case.
- Track Recommendations: supports 'SIMILAR ARTISTS SEARCHBYDISTANCE' tag retrieval from [Search by Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP), independently of Bio panel. Duplicates are removed in any case when merged with other similar artists tags. This tag must be pre-calculated, since it's retrieved from files or database, and its based on similar artists from your library (instead of charts/popularity/other people's listening habits).
- Forced query: added forced query to pre-filter library for all lookups. Greatly speedups the process of searching matches in library.
### Changed
- YouTube: YouTube searches are now cached (during the same session). i.e. matches are found much faster for tracks already searched.
- YouTube: YouTube searches now have 'MUSICBRAINZ_TRACKID', 'MUSICBRAINZ_ALBUMARTISTID', and 'MUSICBRAINZ_ARTISTID' tags if available.
- Feedback: report will also compare online values against the file tags (if available) and show total number of loved, hated and mismatched tracks.
- Feedback: retrieving loved/hated tracks from library will also output library tagged tracks (if available), without duplicates by MBID.
- Feedback: menu entries will be disabled when selection count is higher than the API recommendations.
- Feedback: in case sending feedback to server fails (usually due to rate limits), connection will be retried once a few ms later. Any error will be reported via console/popups.
- Feedback: only updates tracks on server if the current feedback differs, this way the timestamp does not get changed.
- Feedback: improvements when handling tracks without MBIDs.
- Feedback: when network is not available, feedback will be cached and send later -every 10 min- during the same session or on future sessions.
- Playlists: matches on library -for playlist creation- are now preferred by higher rating and not live tracks (if possible).
- Playlists: optimizations finding tracks on library.
- Playlists: standardized playlists names, similar to playlist created by [Last.fm-SMP](https://regorxxx.github.io/foobar2000-SMP.github.io/scripts/lastfm-smp/).
- Remove duplicates: when removing duplicates, tracks left for comparison are now preferred by default higher rating and not live tracks. Delete '[foobar_profile]\js_data\presets\global\globQuery.json' and '[foobar_profile]\foobar2000\js_data\presets\global\globTags.json' files after installation.
- ListenBrainz: key for the token is cached during the same session.
- ListenBrainz: user name is cached during same session.
- ListenBrainz: updated getFeedback method (with POST), without limits on data size.
- UI: all reports are now formatted as tabulated tables, making them easier to read.
- UI: tooltip now reports if user playlists recommendations are available and feedback for the selected track.
- UI: button is now animated during all asynchronous tasks (including daily jams retrieval).
### Removed
### Fixed
- Feedback: retrieval of tracks with feedback on server was incomplete due to API limits of number of items get per request. Now requests are paginated, untill all results are get.
- ListenBrainz: Lookup for missing MBIDs setting was not honored (always active).
- YouTube: rare errors parsing some titles/artists on YouTube.
- UI: tooltip flickering while pressing Shift/Ctrl over a button in icon-only mode.

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

[Unreleased]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v2.3.0...HEAD
[2.3.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.7.0...v2.0.0
[1.7.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.11...v1.0.0
[1.0.0-beta.11]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.10...v1.0.0-beta.11
[1.0.0-beta.10]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.9...v1.0.0-beta.10
[1.0.0-beta.9]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.8...v1.0.0-beta.9
[1.0.0-beta.8]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.7...v1.0.0-beta.8
[1.0.0-beta.7]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.6...v1.0.0-beta.7
[1.0.0-beta.6]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.5...v1.0.0-beta.6
[1.0.0-beta.5]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.4...v1.0.0-beta.5
[1.0.0-beta.4]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.3...v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.2...v1.0.0-beta.3
[1.0.0-beta.2]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0-beta.1...v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/regorxxx/ListenBrainz-SMP/compare/3c4f2d0...v1.0.0-beta.1