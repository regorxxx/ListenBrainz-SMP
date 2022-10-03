# ListenBrainz-SMP
# -WIP BETA: no release yet, missing docs and wiki but fully functional-
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/ListenBrainz-SMPP/overview/main)
[![Codacy Badge][codacy_badge]](https://www.codacy.com/gh/regorxxx/ListenBrainz-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/ListenBrainz-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/ListenBrainz-SMP)  
An implementation of [ListenBrainz](https://listenbrainz.org/) for [foobar2000](https://www.foobar2000.org) using [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel), which allows to retrieve/set feedback for tracks within foobar2000 library and create playlists based on user or site-wide recommendations statistics.

![LB_2](https://user-images.githubusercontent.com/83307074/193407659-ca6891dc-f359-4bf4-b792-3462ffae1b11.gif)

## Features
- Love/Hate tracks. Or clear any feedback set.
- Find loved/hated tracks from server on library. [*]
- Create playlist fron Top Listens, either by user or site-wide. [*]
- Create playlist based on user's recommedations: 'Top artist', 'Similar artist', 'Raw recommendations'. [*]
- Requires an [user token](https://listenbrainz.org/profile/).

[*] Involves content resolution by Artist, Title or Recording MBID. Displays found matches.

## To send listens on playback
Listens sync is not managed by this script. It's recommended to use [foo_listenbrainz2](https://github.com/phw/foo_listenbrainz2).

### Compatible with (toolbar)
 1. [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP): creates intelligent "spotify-like" playlist using high-level data from tracks and computing their similarity using genres/styles.
 2. [Playlist-Tools-SMP](https://github.com/regorxxx/Playlist-Tools-SMP): Offers different pre-defefined examples for intelligent playlist creation.
 3. [Device-Priority-SMP](https://github.com/regorxxx/Device-Priority-SMP): Automatic output device selection.

![LB_1](https://user-images.githubusercontent.com/83307074/193407662-92a43011-c3cb-4473-b9cf-7da5780fbec1.gif)

## Installation
See [_TIPS and INSTALLATION (txt)](https://github.com/regorxxx/ListenBrainz-SMP/blob/main/_TIPS%20and%20INSTALLATION.txt) and the [Wiki](https://github.com/regorxxx/ListenBrainz-SMP/wiki/Installation).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/ListenBrainz-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/1677d2b0dee54548bf44614fcf808529
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/ListenBrainz-SMP/badge/main
