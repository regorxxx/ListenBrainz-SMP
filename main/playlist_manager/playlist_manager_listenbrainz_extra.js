'use strict';
//31/07/24

/* global youTube:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globQuery:readable, globTags:readable, memoize:readable */
include('playlist_manager_listenbrainz.js');
/* global listenBrainz:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _open:readable, utf8:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _q:readable, _t:readable, _q:readable, _q:readable, _q:readable, module:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, sanitizeTagValIds:readable, sanitizeTagIds:readable, sanitizeQueryVal:readable, queryCombinations:readable, sanitizeTagTfo:readable */
include('..\\..\\helpers\\helpers_xxx_web.js');
/* global send:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('..\\..\\helpers-external\\easy-table-1.2.0\\table.js'); const Table = module.exports;

/**
 * Retrieves recommended tracks for user and creates a playlist with matches or YouTube Links
 *
 * @property
 * @name getRecommendedTracks
 * @kind method
 * @memberof listenBrainz
 * @param {string} user - User name
 * @param {{artist_type:string count:number offset:number}} params - artist_type: 'top'
 * @param {string} name - Title for the report
 * @param {string} token - ListenBrainz user token (does not need to match the user)
 * @param {Boolean} bYoutube - Retrieve YouTube links
 * @param {Boolean} bRandomize - Shuffle items at output
 * @param {?Object} parent - Button parent to switch animations
 * @returns {void}
 */
listenBrainz.getRecommendedTracks = function getRecommendedTracks(user, params, name, token, bYoutube = true, bRandomize = false, parent = null) {
	const mbids = [];
	const artistMBIDs = [];
	const tags = { TITLE: [], ARTIST: [] };
	let count = 0;
	parent && parent.switchAnimation('ListenBrainz data retrieval', true);
	return this.getRecommendedRecordings(user, params, token)
		.then((recommendations) => {
			recommendations.forEach((recording) => {
				mbids.push(recording.recording_mbid || '');
				tags.TITLE.push('');
				tags.ARTIST.push('');
			});
			count = mbids.length;
			const infoNames = ['recording_mbid', 'recording_name', 'artist_credit_name', 'artist_credit_mbids'];
			return this.lookupRecordingInfoByMBIDs(mbids, infoNames, token);
		})
		.then((info) => {
			parent && parent.switchAnimation('ListenBrainz data retrieval', false);
			if (['recording_mbid', 'recording_name', 'artist_credit_name'].every((tag) => Object.hasOwn(info, tag))) {
				for (let i = 0; i < count; i++) {
					if (mbids[i] === info.recording_mbid[i]) {
						if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
						if (info.artist_credit_name[i]) { tags.ARTIST[i] = info.artist_credit_name[i]; }
						if (info.artist_credit_mbids[i] && info.artist_credit_mbids[i].length) { artistMBIDs[i] = info.artist_credit_mbids[i]; }
					}
				}
			}
			const table = new Table;
			mbids.forEach((mbid, i) => {
				table.cell('Title', tags.TITLE[i]);
				table.cell('Artist', tags.ARTIST[i]);
				table.cell('MBID', mbid);
				table.newRow();
			});
			const report = name + ': ' + count + '\n\n' + table.toString();
			fb.ShowPopupMessage(report, 'ListenBrainz ' + name + ' ' + _p(user));
			const queryArr = mbids.map((mbid, i) => {
				const tagArr = ['TITLE', 'ARTIST']
					.map((key) => { return { key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i])) }; });
				const bMeta = tagArr.every((tag) => { return tag.val.length > 0; });
				if (!bMeta) { return; }
				const query = queryJoin(
					[
						bMeta ? tagArr.map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') : '',
						bMeta ? tagArr.slice(0, 2).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
						'MUSICBRAINZ_TRACKID IS ' + mbid
					].filter(Boolean)
					, 'OR'
				);
				return query;
			}).filter(Boolean);
			const libItems = fb.GetLibraryItems();
			const notFound = [];
			const items = queryArr.map((query, i) => {
				let itemHandleList = fb.GetQueryItemsCheck(libItems, query);
				if (!itemHandleList) {
					fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz');
					return;
				}
				// Filter
				if (itemHandleList.Count) {
					itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
					itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: true });
					return itemHandleList[0];
				}
				notFound.push({
					creator: tags.ARTIST[i],
					title: tags.TITLE[i],
					tags: {
						MUSICBRAINZ_TRACKID: mbids[i],
						MUSICBRAINZ_ALBUMARTISTID: (artistMBIDs[i] || [])[0],
						MUSICBRAINZ_ARTISTID: artistMBIDs[i] || []
					}
				});
				return null;
			});
			return { notFound, items };
		})
		.then(({ notFound, items }) => {
			if (notFound.length && bYoutube) {
				parent && parent.switchAnimation('YouTube Scrapping', true);
				// Send request in parallel every x ms and process when all are done
				return Promise.parallel(notFound, youTube.searchForYoutubeTrack, 5).then((results) => {
					let j = 0;
					const itemsLen = items.length;
					results.forEach((result) => {
						for (void (0); j <= itemsLen; j++) {
							if (result.status !== 'fulfilled') { break; }
							const link = result.value;
							if (!link || !link.length) { break; }
							if (!items[j]) {
								items[j] = link.url;
								break;
							}
						}
					});
					return items;
				})
					.finally(() => {
						parent && parent.switchAnimation('YouTube Scrapping', false);
					});
			} else {
				return items;
			}
		})
		.then((items) => {
			if (bRandomize) { items.shuffle(); }
			const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + name + ' ' + _p(user), true);
			plman.ClearPlaylist(idx);
			plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
			plman.ActivePlaylist = idx;
		})
		.finally(() => {
			if (parent && parent.isAnimationActive('ListenBrainz data retrieval')) { parent.switchAnimation('ListenBrainz data retrieval', false); }
		});
};

/**
 * Parses the jsonl file from {@link https://github.com/kawaiiDango/pano-scrobbler Pano Scrobbler} and outputs a ListenBrainz compatible listens payload
 *
 * @property
 * @name parsePanoScrobblerJson
 * @kind method
 * @memberof listenBrainz
 * @param {string} file - File path
 * @param {{player:string; client:string; version:string;}} info
 * @param {('scrobble'|'love')} event
 * @returns {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]}
 */
listenBrainz.parsePanoScrobblerJson = function parsePanoScrobblerJson(file, info, event = 'scrobble') {
	if (_isFile(file)) {
		const listens = [];
		const text = _open(file, utf8);
		for (let line of text.split(/\r\n|\n\r|\n|\r/)) {
			/** @type {{timeHuman:string, timeMs:number, artist:string, track:string, album:string, albumArtist:string, durationMs:number, event:string}} */
			const scrobble = line ? JSON.parse(line) : null;
			if (scrobble) {
				switch (event.toLocaleLowerCase()) {
					case 'scrobble': {
						if (scrobble.event !== 'scrobble') { continue; }
						listens.push({
							listened_at: Math.round(scrobble.timeMs / 1000),
							track_metadata: {
								additional_info: {
									...(Object.hasOwn(scrobble, 'mediaPlayerName') ? { media_player: scrobble.mediaPlayerName } : {}),
									...(Object.hasOwn(scrobble, 'mediaPlayerVersion') ? { media_player_version: scrobble.mediaPlayerVersion } : {}),
									...(info && Object.hasOwn(info, 'client') ? { submission_client: info.client } : {}),
									...(info && Object.hasOwn(info, 'version') ? { submission_client_version: info.version } : {}),
									duration_ms: scrobble.durationMs
								},
								...(Object.hasOwn(scrobble, 'artist') ? { artist_name: scrobble.artist } : {}),
								...(Object.hasOwn(scrobble, 'track') ? { track_name: scrobble.track } : {}),
								...(Object.hasOwn(scrobble, 'album') ? { release_name: scrobble.album } : {})
							}
						});
						break;
					}
					case 'love': {
						if (scrobble.event !== 'love') { continue; }
						listens.push({
							track_metadata: {
								additional_info: {},
								...(Object.hasOwn(scrobble, 'artist') ? { artist_name: scrobble.artist } : {}),
								...(Object.hasOwn(scrobble, 'track') ? { track_name: scrobble.track } : {}),
								...(Object.hasOwn(scrobble, 'album') ? { release_name: scrobble.album } : {})
							}
						});
						break;
					}
				}
			}
		}
		return listens;
	}
	return null;
};

/**
 * Parses aListenBrainz listens payload and adds MBIDs to listens if missing (modifies original array). MBIDs are retrieved from library, using user's tracks.
 *
 * @property
 * @name findPayloadMBIDs
 * @kind method
 * @memberof listenBrainz
 * @param {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]} payload - Listenbrainz submit listen payload array
 * @returns {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]}
 */
listenBrainz.findPayloadMBIDs = function findPayloadMBIDs(payload) {
	let libItems;
	const findTrack = memoize((title, artist, album, releaseId, artistId, trackId) => {
		const query = queryJoin(
			[
				title || typeof title === 'string' && title.length > 0
					? '"$stricmp(' + sanitizeTagIds('%TITLE%') + ',' + sanitizeTagTfo(sanitizeTagValIds(title)) + ')" IS 1'
					: '',
				artist || typeof artist === 'string' && artist.length > 0
					? globTags.artist + ' IS ' + sanitizeTagTfo(artist) +
					' OR ' +
					globTags.artist + ' IS ' + sanitizeTagTfo(artist).replace(/ \/ /gi, ', ')
					: '',
				album || typeof album === 'string' && album.length > 0
					? '%ALBUM% IS ' + sanitizeTagTfo(album)
					: '',
				releaseId
					? '%MUSICBRAINZ_RELEASETRACKID% IS ' + releaseId
					: '',
				...(artistId && artistId.length
					? queryCombinations(artistId, 'MUSICBRAINZ_ARTISTID', 'AND')
					: []
				),
				trackId
					? '%MUSICBRAINZ_TRACKID% IS ' + trackId
					: '',
				'%MUSICBRAINZ_RELEASETRACKID% PRESENT OR %MUSICBRAINZ_ARTISTID% PRESENT OR %MUSICBRAINZ_TRACKID% PRESENT'
			].filter(Boolean),
			'AND'
		);
		if (!query) { return null; }
		if (!libItems) { libItems = fb.GetLibraryItems(); }
		const handleList = fb.GetQueryItemsCheck(libItems, query, true);
		if (handleList && handleList.Count) {
			const biasTF = fb.TitleFormat(globQuery.remDuplBias);
			handleList.OrderByFormat(biasTF, -1);
			return handleList[0];
		}
		return null;
	});
	for (let listen of payload) {
		const meta = listen.track_metadata;
		const metaIds = meta.additional_info;
		const bRelease = Object.hasOwn(metaIds, 'release_mbid');
		const bArtist = Object.hasOwn(metaIds, 'artist_mbids');
		const bRecording = Object.hasOwn(metaIds, 'recording_mbid');
		if (!bRelease || !bArtist || !bRecording) {
			const handle = findTrack(meta.track_name, meta.artist_name, meta.release_name, metaIds.release_mbid, metaIds.artist_mbids || [], metaIds.recording_mbid);
			if (handle) {
				const tags = fb.TitleFormat('[%MUSICBRAINZ_RELEASETRACKID%]|[%MUSICBRAINZ_ARTISTID%]|[%MUSICBRAINZ_TRACKID%]').EvalWithMetadb(handle).split('|');
				if (!bRelease && tags[0] && tags[0] !== '.') { metaIds.release_mbid = tags[0]; }
				if (!bArtist && tags[1] && tags[1] !== '.') { metaIds.artist_mbids = tags[1].split(', '); }
				if (!bRecording && tags[2] && tags[2] !== '.') { metaIds.recording_mbid = tags[2]; }
			}
		}
	}
	return payload;
};

/**
 * Parses aListenBrainz listens payload and adds MBIDs to listens if missing (modifies original array). MBIDs are retrieved from library, using user's tracks.
 *
 * @property
 * @name findPayloadMBIDs
 * @kind method
 * @memberof listenBrainz
 * @param {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]} payload - Listenbrainz submit listen payload
 * @param {string} token
 * @param {('listen'|'scrobble'|'love')} event
 * @returns {Promise.<{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]>}
 */
listenBrainz.processPayload = async function processPayload(payload, token, event = 'listen') {
	let processed;
	switch (event.toLocaleLowerCase()) {
		case 'scrobble':
		case 'listen': processed = payload; break;
		case 'love': {
			for (let listen of payload) {
				processed = [];
				const metaIds = listen.track_metadata.additional_info;
				if (Object.hasOwn(metaIds, 'recording_mbid')) {
					processed.push({ recording_mbid: metaIds.recording_mbid, score: 1 });
				} else {
					const result = await this.lookupMBIDs([[[listen.track_metadata.artist_name]], [[listen.track_metadata.track_name]]], token);
					if (result[0]) { processed.push({ recording_mbid: result[0], score: 1 }); }
				}
			}
			break;
		}
	}
	return Promise.resolve(processed);
};

listenBrainz.submitListens = async function submitListens(payload, token) {
	const chunks = payload.chunk(this.MAX_LISTENS_PER_REQUEST);
	const rate = 50;
	return Promise.serial(chunks, (chunk, i) => {
		const data = {
			listen_type: 'import',
			payload: chunk
		};
		return send({
			method: 'POST',
			URL: 'https://api.listenbrainz.org/1/submit-listens',
			requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
			body: JSON.stringify(data)
		}).then(
			(resolve) => {
				console.log('submitListens: (chunk '+ i + ') ' + resolve);
				if (resolve) {
					const response = JSON.parse(resolve);
					if (response.status === 'ok') { return true; }
					console.log('submitListens: (chunk '+ i + ') ' + response.status + ' ' + response.responseText);
				}
				return false;
			},
			(reject) => {
				console.log('submitListens: (chunk '+ i + ') ' + reject.status + ' ' + reject.responseText);
				return false;
			}
		);
	}, rate)
		.then((results) => {
			return results.every(Boolean);
		}, () => {
			return false;
		});
};