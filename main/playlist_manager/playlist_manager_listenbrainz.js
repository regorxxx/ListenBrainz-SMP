'use strict';
//19/12/22

include('..\\..\\helpers\\helpers_xxx_basic_js.js');
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
include('..\\..\\helpers\\helpers_xxx_tags.js');
include('..\\..\\helpers\\helpers_xxx_web.js');
const SimpleCrypto = require('..\\helpers-external\\SimpleCrypto-js\\SimpleCrypto.min');
var regExListenBrainz = /^(https:\/\/(listenbrainz|musicbrainz).org\/)|(recording)|(playlist)|\//g;

const listenBrainz = {};

/*
	Helpers
*/
listenBrainz.getMBIDs = async function getMBIDs(handleList, token, bLookupMBIDs = true) {
	const tags = getTagsValuesV3(handleList, ['MUSICBRAINZ_TRACKID'], true).flat();
	// Try to retrieve missing MBIDs
	const missingIds = tags.multiIndexOf('');
	const missingCount = missingIds.length;
	if (bLookupMBIDs && missingCount) {
		const missingHandleList = new FbMetadbHandleList(missingIds.map((idx) => {return handleList[idx];}));
		const missingMBIDs = await this.lookupMBIDs(missingHandleList, token);
		if (missingMBIDs.length) {
			missingMBIDs.forEach((mbid, i) => {
				const idx = missingIds[i];
				tags[idx] = mbid;
			});
		}
	}
	return tags;
}

/*
	Playlists
*/
// Post new playlist using the playlist file as reference and provides a new MBID
// Note posting multiple times the same playlist file will create different entities
// Use sync to edit already exported playlists
listenBrainz.exportPlaylist = async function exportPlaylist(pls /*{name, nameId, path}*/, root = '', token, bLookupMBIDs = true) {
	const bUI = pls.extension === '.ui';
	// Create new playlist and check paths
	const handleList = !bUI ? getHandlesFromPlaylist(pls.path, root, true) : getHandleFromUIPlaylists([pls.nameId], false); // Omit not found
	const mbid = (await this.getMBIDs(handleList, token, bLookupMBIDs)).filter(Boolean);
	const missingCount = handleList.Count - mbid.length;
	if (missingCount) {console.log('Warning: some tracks don\'t have MUSICBRAINZ_TRACKID tag. Omitted ' + missingCount + ' tracks on exporting');}
	const track = mbid.map((tag) => {return {identifier: 'https://musicbrainz.org/recording/' + tag};});
	const data = { // JSPF playlist with minimum data
		playlist: {
			extension: {
				'https://musicbrainz.org/doc/jspf#playlist': {
					'public': true
				}
			},
			title: pls.name,
			track,	
		}
	};
	return send({
		method: 'POST', 
		URL: 'https://api.listenbrainz.org/1/playlist/create',
		requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
		body: JSON.stringify(data)
	}).then(
		(resolve) => {
			console.log('exportPlaylist: ' + resolve);
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.playlist_mbid && response.playlist_mbid.length) {
					console.log('Playlist URL: ' + this.getPlaylistURL(response));
					return response.playlist_mbid;
				}
				return '';
			}
			return '';
		},
		(reject) => {
			console.log('exportPlaylist: ' + reject.status + ' ' + reject.responseText);
			return '';
		}
	);
}

// Delete all tracks on online playlist and then add all tracks again using the playlist file as reference
// Easier than single edits, etc.
listenBrainz.syncPlaylist = function syncPlaylist(pls /*{name, nameId, path, playlist_mbid}*/, root = '', token, bLookupMBIDs = true) {
	if (!pls.playlist_mbid || !pls.playlist_mbid.length) {return '';}
	const data = {
		index: 0,
		count: Number.MAX_VALUE
	};
	const bUI = pls.extension === '.ui';
	// Create new playlist and check paths
	const handleList = !bUI ? getHandlesFromPlaylist(pls.path, root, true) : getHandleFromUIPlaylists([pls.nameId], false); // Omit not found
	return send({
		method: 'POST', 
		URL: 'https://api.listenbrainz.org/1/playlist/' + pls.playlist_mbid + '/item/delete',
		requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
		body: JSON.stringify(data)
	}).then(
		(resolve) => { // After deleted all online tracks, add all offline tracks
			console.log('syncPlaylist: ' + resolve);
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.status === 'ok') {
					if (handleList.Count) {
						return this.addPlaylist(pls, handleList, void(0), token, bLookupMBIDs);
					} else {
						console.log('Playlist URL: ' + this.getPlaylistURL(pls));
						return pls.playlist_mbid;
					}
				}
				return '';
			}
			return '';
		},
		async (reject) => { // If the online playlist was already empty, let's simply add the new tracks
			console.log('syncPlaylist: ' + reject.status + ' ' + reject.responseText);
			if (reject.responseText.length) {
				const response = JSON.parse(reject.responseText);
				if (response.error === 'Failed to deleting recordings from the playlist. Please try again.') { // Playlist file was empty
					const jspf = await importPlaylist(pls, token);
					if (jspf.playlist.track.length === 0) {
						if (handleList.Count) {
							return this.addPlaylist(pls, handleList, void(0), token, bLookupMBIDs);
						} else {
							console.log('Playlist URL: ' + this.getPlaylistURL(pls));
							return pls.playlist_mbid;
						}
					}
				} else if (response.code === 404 && response.error === ('Cannot find playlist: ' + pls.playlist_mbid)) { // Playlist file had a MBID not found on server
					return this.exportPlaylist(pls, root, token);
				}
				return '';
			}
			return '';
		}
	);
}

// Add handleList to given online playlist
listenBrainz.addPlaylist = async function addPlaylist(pls /*{name, playlist_mbid}*/, handleList, offset, token, bLookupMBIDs = true) {
	if (!pls.playlist_mbid || !pls.playlist_mbid.length) {return '';}
	if (!handleList || !handleList.Count) {return pls.playlist_mbid;}
	const tags = getTagsValuesV3(handleList, ['MUSICBRAINZ_TRACKID'], true).flat();
	const mbid = (await this.getMBIDs(handleList, token, bLookupMBIDs)).filter(Boolean);
	const missingCount = handleList.Count - mbid.length;
	if (missingCount) {console.log('Warning: some tracks don\'t have MUSICBRAINZ_TRACKID tag. Omitted ' + missingCount + ' tracks on exporting');}
	const track = mbid.map((tag) => {return {identifier: 'https://musicbrainz.org/recording/' + tag};});
	// TODO slice handleList into parts to not reach max tracks count on server
	const data = { // JSPF playlist with minimum data
		playlist: {
			extension: {
				'https://musicbrainz.org/doc/jspf#playlist': {
					'public': true
				}
			},
			title: pls.name,
			track,	
		}
	};
	return send({
		method: 'POST', 
		URL: 'https://api.listenbrainz.org/1/playlist/' + pls.playlist_mbid + '/item/add' + (typeof offset !== 'undefined' ? '/' + offset : ''),
		requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
		body: JSON.stringify(data)
	}).then(
		(resolve) => {
			console.log('addPlaylist: ' + resolve);
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.status === 'ok') {
					console.log('Playlist URL: ' + this.getPlaylistURL(pls));
					return pls.playlist_mbid;
				}
				return '';
			}
			return '';
		},
		(reject) => {
			console.log('addPlaylist: ' + reject.status + ' ' + reject.responseText);
			return '';
		}
	);
}

// Import playlist metadata and track list from online playlist
listenBrainz.importPlaylist = function importPlaylist(pls /*{playlist_mbid}*/, token) {
	if (!pls.playlist_mbid || !pls.playlist_mbid.length) {return false;}
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/playlist/' + pls.playlist_mbid + '?fetch_metadata=true',
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			if (resolve) { // Ensure it matches the ID
				const jspf = JSON.parse(resolve);
				if (jspf && jspf.playlist && jspf.playlist.identifier && pls.playlist_mbid === jspf.playlist.identifier.replace(regExListenBrainz, '')) {
					console.log('importPlaylist: ' + JSON.stringify({creator: jspf.playlist.creator, identifier: jspf.playlist.identifier}));
					return jspf;
				}
			}
			console.log('importPlaylist: unknown error');
			return null;
		},
		(reject) => {
			console.log('importPlaylist: ' + reject.status + ' -> ' + reject.responseText);
			return null;
		}
	);
}

listenBrainz.importUserPlaylists = async function importUserPlaylists(user) {
	if (!checkLBToken()) {return false;}
	let bDone = false;
	const jspf = await this.retrieveUserPlaylists(user, this.decryptToken({lBrainzToken: list.properties.lBrainzToken[1], bEncrypted: list.properties.lBrainzEncrypt[1]}));
	if (jsfpArr && jsfpArr.length) {
		const delay = setInterval(delayAutoUpdate, list.autoUpdateDelayTimer);
		jsfpArr.forEach((jspf) => {
			const handleList = this.contentResolver(jspf);
			if (handleList) {
				const playlistName = jspf.playlist.title;
				const playlistPath = list.playlistsPath + sanitize(playlistName) + list.playlistsExtension;
				const backPath = playlistPath + '.back';
				if (_isFile(playlistPath)) {
					let answer = WshShell.Popup('There is a playlist with same name/path.\nDo you want to overwrite it?.', 0, window.Name, popup.question + popup.yes_no);
					if (answer === popup.no) {return false;}
					_renameFile(playlistPath, backPath);
				}
				const useUUID = list.optionsUUIDTranslate();
				const playlistNameId = playlistName + (list.bUseUUID ? nextId(useUUID, false) : '');
				const category = list.categoryState.length === 1 && list.categoryState[0] !== list.categories(0) ? list.categoryState[0] : '';
				const tags = ['ListenBrainz'];
				if (list.bAutoLoadTag) {oPlaylistTags.push('bAutoLoad');}
				if (list.bAutoLockTag) {oPlaylistTags.push('bAutoLock');}
				if (list.bMultMenuTag) {oPlaylistTags.push('bMultMenu');}
				if (list.bAutoCustomTag) {list.autoCustomTag.forEach((tag) => {if (! new Set(oPlaylistTags).has(tag)) {oPlaylistTags.push(tag);}});}	
				bDone = savePlaylist({handleList, playlistPath, ext: list.playlistsExtension, playlistName, category, tags, playlist_mbid, useUUID, bBOM: list.bBOM});
				// Restore backup in case something goes wrong
				if (!bDone) {console.log('Failed saving playlist: ' + playlistPath); _deleteFile(playlistPath); _renameFile(backPath, playlistPath);}
				else if (_isFile(backPath)) {_deleteFile(backPath);}
				if (bDone && plman.FindPlaylist(playlistNameId) !== -1) {sendToPlaylist(handleList, playlistNameId);}
			}
		});
		clearInterval(delay);
	}
	if (!bDone) {fb.ShowPopupMessage('There were some errors on playlist syncing. Check console.', window.Name);}
	return bDone;
}

listenBrainz.getPlaylistURL = function getPlaylistURL(pls /*{playlist_mbid}*/) {
	if (!pls.playlist_mbid || !pls.playlist_mbid.length) {return null;}
	return ('https://listenbrainz.org/playlist/' + pls.playlist_mbid + '/');
};

/*
	Feedback
*/
listenBrainz.sendFeedback = async function sendFeedback(handleList, feedback = 'love', token, bLookupMBIDs = true) {
	const mbid = (await this.getMBIDs(handleList, token, bLookupMBIDs)).filter(Boolean);
	const missingCount = handleList.Count - mbid.length;
	if (missingCount) {console.log('Warning: some tracks don\'t have MUSICBRAINZ_TRACKID tag. Omitted ' + missingCount + ' tracks while setting feedback');}
	let score = 0;
	switch (feedback.toLowerCase()) {
		case 'love': {score = 1; break;}
		case 'hate': {score = -1; break;}
		default : {score = 0; break;}
	}
	return new Promise((resolve) => {
		const promises = [];
		mbid.forEach((recording_mbid) => {
			promises.push(
				// https://listenbrainz.readthedocs.io/en/production/dev/feedback-json/#feedback-json-doc
				send({
					method: 'POST', 
					URL: 'https://api.listenbrainz.org/1/feedback/recording-feedback',
					requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
					body: JSON.stringify({"recording_mbid": recording_mbid, "score" : score})
				}).then(
					(resolve) => {
						if (resolve) {
							const response = JSON.parse(resolve);
							console.log(response);
							if (response.status === 'ok') {
								return true;
							}
							return false;
						}
						return false;
					},
					(reject) => {
						console.log('sendFeedback: ' + reject.status + ' ' + reject.responseText);
						return false;
					}
				)
			);
		});
		Promise.all(promises).then(() => {
			console.log('sendFeedback: ' + mbid.length + ' tracks');
		}, (error) => {new Error(error);});
	});
}

listenBrainz.getFeedback = async function getFeedback(handleList, user, token, bLookupMBIDs = true) {
	const mbid = (await this.getMBIDs(handleList, token, bLookupMBIDs)).filter(Boolean);
	const missingCount = handleList.Count - mbid.length;
	if (missingCount) {console.log('Warning: some tracks don\'t have MUSICBRAINZ_TRACKID tag. Omitted ' + missingCount + ' tracks while setting feedback');}
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/feedback/user/' + user + '/get-feedback-for-recordings?recording_mbids=' + mbid.join(','),
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.hasOwnProperty('feedback')) {
					return response.feedback;
				}
				return [];
			}
			return [];
		},
		(reject) => {
			console.log('getFeedback: ' + reject.status + ' ' + reject.responseText);
			return [];
		}
	);
}

listenBrainz.getUserFeedback = async function getUserFeedback(user, params = {/*score, count, offset, metadata*/}, token) {
	const queryParams = Object.keys(params).length ? '?' + Object.entries(params).map((pair) => {return pair[0] + '=' + pair[1];}).join('&') : '';
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/feedback/user/' + user + '/get-feedback' + queryParams,
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.hasOwnProperty('feedback')) {
					return response.feedback;
				}
				return [];
			}
			return [];
		},
		(reject) => {
			console.log('getFeedback: ' + reject.status + ' ' + reject.responseText);
			return [];
		}
	);
}

/*
	Tracks info
*/
listenBrainz.lookupTracks = function lookupTracks(handleList, token) {
	const count = handleList.Count;
	if (!handleList.Count) {return [];}
	const [artist, title] = getTagsValuesV4(handleList, ['ARTIST', 'TITLE']);
	const data = new Array(count).fill({});
	data.forEach((_, i, thisArr) => {
		thisArr[i] = {};
		thisArr[i]['[artist_credit_name]'] = artist[i].join(', ');
		thisArr[i]['[recording_name]'] = title[i].join(', ');
	});
	return send({
		method: 'POST', 
		URL: 'https://labs.api.listenbrainz.org/mbid-mapping/json',
		requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
		body: JSON.stringify(data)
	}).then(
		(resolve) => {
			if (resolve) { // Ensure it matches the ID
				const response  = JSON.parse(resolve);
				console.log('lookupTracks: ' + response.length + '/' + count + ' found items');
				return response; // Response may contain fewer items than original list
			}
			return []; 
		},
		(reject) => {
			console.log('lookupTracks: ' + reject.status + ' ' + reject.responseText);
			return [];
		}
	);
}

listenBrainz.lookupRecordingInfo = function lookupRecordingInfo(handleList, infoNames = ['recording_mbid'], token) {
	const allInfo = [
		'artist_credit_arg', 'artist_credit_id', 'artist_credit_name', 
		'artist_mbids', 'index', 'match_type', 'recording_arg', 'recording_mbid', 
		'recording_name', 'release_mbid', 'release_name', 'year'
	];
	if (!infoNames || !infoNames.length) {infoNames = allInfo;}
	return this.lookupTracks(handleList, token).then(
		(resolve) => {
			const info = {};
			infoNames.forEach((tag) => {info[tag] = new Array(handleList.Count).fill('');});
			if (resolve.length) {
				infoNames.forEach((tag) => {
					if (allInfo.indexOf(tag) !== -1) {
						resolve.forEach((obj, i) => {info[tag][obj.index] = obj[tag];});
					}
				});
			}
			return info; // Response may contain fewer items than original list
		},
		(reject) => {
			console.log('lookupMBIDs: ' + reject);
			return null;
		}
	);
}

listenBrainz.lookupMBIDs = function lookupMBIDs(handleList, token) { // Shorthand for lookupRecordingInfo when looking for 'recording_mbid'
	return this.lookupTracks(handleList, token).then(
		(resolve) => {
			if (resolve.length) {
				const MBIDs = new Array(handleList.Count).fill('');
				resolve.forEach((obj, i) => {MBIDs[obj.index] = obj.recording_mbid;});
				return MBIDs; // Response may contain fewer items than original list
			}
			return [];
		},
		(reject) => {
			console.log('lookupMBIDs: ' + reject);
			return [];
		}
	);
}

/*
	Statistics
*/
listenBrainz.getTopRecordings = function getTopRecordings(user = 'sitewide', params = {/*count, offset, range*/}, token) {
	const queryParams = Object.keys(params).length ? '?' + Object.entries(params).map((pair) => {return pair[0] + '=' + pair[1];}).join('&') : '';
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/stats/' + (user.toLowerCase() === 'sitewide' ?  'sitewide' : 'user/' + user) + '/recordings' + queryParams,
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.hasOwnProperty('payload') && response.payload.hasOwnProperty('recordings')) {
					return response.payload.recordings;
				}
				return [];
			}
			return [];
		},
		(reject) => {
			console.log('getFeedback: ' + reject.status + ' ' + reject.responseText);
			return [];
		}
	);
}

listenBrainz.getRecommendedRecordings = function getRecommendedRecordings(user, params = {artist_type: 'top' /*count, offset*/}, token) {
	const queryParams = Object.keys(params).length ? '?' + Object.entries(params).map((pair) => {return pair[0] + '=' + pair[1];}).join('&') : '';
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/cf/recommendation/user/'+ user + '/recording' + queryParams,
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			if (resolve) {
				const response = JSON.parse(resolve);
				if (response.hasOwnProperty('payload') && response.payload.hasOwnProperty('mbids')) {
					return response.payload.mbids;
				}
				return [];
			}
			return [];
		},
		(reject) => {
			console.log('getFeedback: ' + reject.status + ' ' + reject.responseText);
			return [];
		}
	);
}

/*
	Content resolver by MBID
*/
listenBrainz.contentResolver = function contentResolver(jspf, bHandleList = true) {
	if (!jspf) {return null;}
	// Query cache (Library)
	// Makes consecutive playlist loading by queries much faster (for ex. .xspf fuzzy matching)
	const queryCache = new Map(); // {Query: handleList}
	let handlePlaylist = [];
	const notFound = [];
	let count = 0;
	const playlist = jspf.playlist;
	const rows = playlist.track;
	const rowsLength = rows.length;
	const lookupKeys = [{xspfKey: 'identifier', queryKey: 'MUSICBRAINZ_TRACKID'}, {xspfKey: 'title', queryKey: 'TITLE'}, {xspfKey: 'creator', queryKey: 'ARTIST'}];
	const conditions = [['MUSICBRAINZ_TRACKID'], ['TITLE','ARTIST'], ['TITLE']];
	for (let i = 0; i < rowsLength; i++) {
		let query = '';
		let lookup = {};
		lookupKeys.forEach((look) => {
			const key = look.xspfKey;
			const queryKey = look.queryKey;
			if (rows[i].hasOwnProperty(key) && rows[i][key] && rows[i][key].length) {
				lookup[queryKey] = queryKey + ' IS ' + this.sanitizeQueryValue(key === 'identifier' ? decodeURI(rows[i][key]).replace(regExListenBrainz,'') : rows[i][key]);
			}
		});
		for (let condition of conditions) {
			if (condition.every((tag) => {return lookup.hasOwnProperty(tag);})) {
				query = condition.map((tag) => {return lookup[tag];}).join(' AND ');
				const matches = queryCache.has(query) ? queryCache.get(query) : (checkQuery(query, true) ? fb.GetQueryItems(fb.GetLibraryItems(), query) : null);
				if (!queryCache.has(query)) {queryCache.set(query, matches);}
				if (matches && matches.Count) {
					handlePlaylist[i] = matches[0];
					count++;
					break;
				}
			}
		}
		if (!handlePlaylist[i]) {notFound.push(rows[i].creator + ' - ' + rows[i].title + ': ' + rows[i].identifier);}
	}
	if (notFound.length) {console.log('Some tracks have not been found on library:\n' + notFound.join('\n'));}
	return (bHandleList ? new FbMetadbHandleList(handlePlaylist.filter((n) => n)) : handlePlaylist);
};

listenBrainz.sanitizeQueryValue = function sanitizeQueryValue(value) {
	return sanitizeQueryVal(value).toLowerCase().replace(/’/g, '\'');
};

/*
	User data
*/
listenBrainz.retrieveUserPlaylistsNames = function retrieveUserPlaylistsNames(user, token) {
	if (!token || !token.length || !user || !user.length) {return null;}
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/user/' + user + '/playlists',
		requestHeader: [['Authorization', 'Token ' + token]]
	}).then(
		(resolve) => {
			const response = JSON.parse(resolve);
			console.log('retrieveUserPlaylistsNames: ' + user + ' -> ' + response.playlist_count + ' playlists');
			return response;
		},
		(reject) => {
			console.log('retrieveUserPlaylistsNames: ' + reject);
			return null;
		}
	);
};

listenBrainz.retrieveUserResponse = function retrieveUserResponse(token) {
	if (!token || !token.length) {return null;}
	return send({
		method: 'GET', 
		URL: 'https://api.listenbrainz.org/1/validate-token?token=' + token
	}).then(
		(resolve) => {
			return JSON.parse(resolve);
		},
		(reject) => {
			console.log('retrieveUser: ' + reject);
			return null;
		}
	);
};

listenBrainz.retrieveUser = async function retrieveUser(token) {
	const response = await this.retrieveUserResponse(token);
	return response && response.valid ? response.user_name : '';
};

listenBrainz.retrieveUserPlaylists = function retrieveUserPlaylists(user, token) {
	if (!token || !token.length || !user || !user.length) {return null;}
	return this.retrieveUserPlaylistsNames(user, token).then(
		(resolve) => {
			const playlists = resolve.playlists;
			const jsfpArr = playlists.map((pls) => {return this.importPlaylist(pls.identifier.replace(regExListenBrainz, ''));})
			return Promise.all(jsfpArr);
		},
		(reject) => {
			console.log('retrieveUserPlaylists: ' + reject);
			return null;
		}
	);
};

/*
	Token
*/
listenBrainz.decryptToken = function decryptToken({lBrainzToken, bEncrypted = true}) {
	let key = '';
	if (bEncrypted) {
		let pass = '';
		try {pass = utils.InputBox(window.ID, 'Enter password:', window.Name, pass, true);} 
		catch(e) {return null;}
		if (!pass.length) {return null;}
		key = new SimpleCrypto(pass);
	}
	return (bEncrypted ? key.decrypt(lBrainzToken) : lBrainzToken);
}

listenBrainz.validateToken = async function validateToken(token) {
	const response = await this.retrieveUserResponse(token);
	console.log(response);
	return (response && response.valid);
};