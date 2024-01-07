'use strict';
//07/01/24

/* global youTube:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globQuery:readable, globTags:readable */
include('playlist_manager_listenbrainz.js');
/* global listenBrainz:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _q:readable, _t:readable, _q:readable, _q:readable, _q:readable, module:readable,  */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, sanitizeTagValIds:readable, sanitizeTagIds:readable, sanitizeQueryVal:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicatesV2:readable */
include('..\\..\\helpers-external\\easy-table-1.2.0\\table.js'); const Table = module.exports;

listenBrainz.getRecommendedTracks = function getRecommendedTracks(user, params /* {artist_type, count, offset} */, name, token, bYoutube = true, bRandomize = false, parent = null) {
	const mbids = [];
	const tags = {TITLE: [], ARTIST: []};
	let count = 0;
	parent && parent.switchAnimation('ListeBrainz data retrieval', true);
	return this.getRecommendedRecordings(user, params, token)
		.then((recommendations) => {
			recommendations.forEach((recording) => {
				mbids.push(recording.recording_mbid || '');
				tags.TITLE.push('');
				tags.ARTIST.push('');
			});
			count = mbids.length;
			const infoNames = ['recording_mbid', 'recording_name', 'artist_credit_name'];
			return this.lookupRecordingInfoByMBIDs(mbids, infoNames, token);
		})
		.then((info) => {
			parent && parent.switchAnimation('ListeBrainz data retrieval', false);
			if (['recording_mbid', 'recording_name', 'artist_credit_name'].every((tag) => Object.hasOwn(info, tag))) {
				for (let i = 0; i < count; i++) {
					if (mbids[i] === info.recording_mbid[i]) {
						if (info.recording_name[i]) {tags.TITLE[i] = info.recording_name[i];}
						if (info.artist_credit_name[i]) {tags.ARTIST[i] = info.artist_credit_name[i];}
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
					.map((key) => {return {key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i]))};});
				const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
				if (!bMeta) {return;}
				const query = queryJoin(
					[
						bMeta ? tagArr.map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') : '',
						bMeta ? tagArr.slice(0, 2).map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
						'MUSICBRAINZ_TRACKID IS ' + mbid
					].filter(Boolean)
					, 'OR'
				);
				return query;
			}).filter(Boolean);
			const libItems = fb.GetLibraryItems();
			const notFound = [];
			const items = queryArr.map((query, i) => {
				let itemHandleList;
				try {itemHandleList = fb.GetQueryItems(libItems, query);} // Sanity check
				catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
				// Filter
				if (itemHandleList.Count) {
					itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false});
					itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : true});
					return itemHandleList[0];
				}
				notFound.push({creator: tags.ARTIST[i], title: tags.TITLE[i], tags: {MUSICBRAINZ_TRACKID: mbids[i]}});
				return null;
			});
			return {notFound, items};
		})
		.then(({notFound, items}) => {
			if (notFound.length && bYoutube) {
				parent && parent.switchAnimation('YouTube Scrapping', true);
				// Send request in parallel every x ms and process when all are done
				return Promise.parallel(notFound, youTube.searchForYoutubeTrack, 5).then((results) => {
					let j = 0;
					const itemsLen = items.length;
					results.forEach((result) => {
						for (void(0); j <= itemsLen; j++) {
							if (result.status !== 'fulfilled') {break;}
							const link = result.value;
							if (!link || !link.length) {break;}
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
			if (bRandomize) {items.shuffle();}
			const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + name + ' ' + _p(user), true);
			plman.ClearPlaylist(idx);
			plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
			plman.ActivePlaylist = idx;
		})
		.finally(() => {
			if (parent && parent.isAnimationActive('ListeBrainz data retrieval')) {parent.switchAnimation('ListeBrainz data retrieval', false);}
		});
};