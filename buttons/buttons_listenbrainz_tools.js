'use strict';
//01/10/22

/* 
	Integrates ListenBrainz feedback and recommendations statistics within foobar2000 library.
*/

include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
include('..\\helpers\\playlist_manager_listenbrainz.js');
include('..\\helpers\\helpers_xxx_playlists.js');
include('..\\main\\remove_duplicates.js');
var prefix = 'lbt';

try {window.DefinePanel('ListenBrainz Tools Button', {author:'xxx'});} catch (e) {/* console.log('Filter Playlist Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	lBrainzToken:	['ListenBrainz user token', ''				, {func: isStringWeak}, ''],
	lBrainzEncrypt:	['Encript ListenBrainz user token?', false	, {func: isBoolean}, false],
	bLookupMBIDs: 	['Lookup for missing track MBIDs?', true	, {func: isBoolean}, true ]
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

addButton({
	'Listen Brainz Tools': new themedButton({x: 0, y: 0, w: 100, h: 22}, 'Listen Brainz', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(this, true, ['buttons_listenbrainz_tools.js']).btn_up(this.currX, this.currY + this.currH);
		} else {
			const properties = this.buttonsProperties;
			const lb = listenBrainz;
			async function checkLBToken(lBrainzToken = properties.lBrainzToken[1]) {
				if (!lBrainzToken.length) {
					const encryptToken = '********-****-****-****-************';
					const currToken = properties.lBrainzEncrypt[1] ? encryptToken : properties.lBrainzToken[1];
					try {lBrainzToken = utils.InputBox(window.ID, 'Enter ListenBrainz user token:', window.Name, currToken, true);} 
					catch(e) {return false;}
					if (lBrainzToken === currToken || lBrainzToken === encryptToken) {return false;}
					if (lBrainzToken.length) {
						if (!(await lb.validateToken(lBrainzToken))) {fb.ShowPopupMessage('ListenBrainz Token not valid.', window.Name); return false;}
						const answer = WshShell.Popup('Do you want to encrypt the token?', 0, window.Name, popup.question + popup.yes_no);
						if (answer === popup.yes) {
							let pass = '';
							try {pass = utils.InputBox(window.ID, 'Enter a passowrd:\n(will be required on every use)', window.Name, pass, true);} 
							catch(e) {return false;}
							if (!pass.length) {return false;}
							lBrainzToken = new SimpleCrypto(pass).encrypt(lBrainzToken);
						}
						properties.lBrainzEncrypt[1] = answer === popup.yes;
					}
					properties.lBrainzToken[1] = lBrainzToken;
					overwriteProperties(properties);
				}
				return true;
			}
			function lBttnMenu(parent, bShowValues = false) {
				const menu = new _menu();
				const parentName = isFunction(parent.text) ? parent.text(parent) : parent.text;
				const bListenBrainz = properties.lBrainzToken[1].length;
				const bEncrypted = properties.lBrainzEncrypt[1];
				function selectedFlags(idx = plman.ActivePlaylist) {return (idx !== -1 && plman.GetPlaylistSelectedItems(idx).Count ? MF_STRING : MF_GRAYED);}
				// Menu
				{
					menu.newEntry({entryText: 'Retrieve MBIDs from selection' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
						if (!await checkLBToken()) {return false;}
						const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
						if (!token) {return;}
						const tfo = fb.TitleFormat('%TITLE%');
						const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
						const response = await lb.lookupRecordingInfo(handleList, ['recording_name', 'recording_mbid'], token);
						if (!response) {return;}
						const report = response.recording_mbid.map((id, i) => {
							const bFound = id.length ? true : false;
							const title = bFound ? response.recording_name[i] : tfo.EvalWithMetadb(handleList[i]);
							const mbid = bFound ? id : '-not found-';
							return title + ':\t' + mbid;
						}).join('\n');
						console.popup(report, 'ListenBrainz');
					}, flags: bListenBrainz ? selectedFlags : MF_GRAYED});
					menu.newEntry({entryText: 'sep'});
				}
				{
					const menuName = menu.newMenu('Set feedback... (on selection)');
					menu.newEntry({menuName, entryText: 'Set track status on ListenBrainz:', flags: MF_GRAYED});
					menu.newEntry({menuName, entryText: 'sep'});
					[
						{key: 'love', title: 'Love selected tracks'},
						{key: 'hate', title: 'Hate selected tracks'},
						{key: 'remove', title: 'Clear selected tracks'}		
					].forEach((entry) =>  {
						menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
							if (!await checkLBToken()) {return false;}
							const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
							if (!token) {return;}
							const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
							const response = await lb.sendFeedback(handleList, entry.key, token);
							if (!response) {fb.ShowPopupMessage('Error connecting to server', 'ListenBrainz');}
						}, flags: bListenBrainz ? selectedFlags : MF_GRAYED});
					});
					menu.newEntry({menuName, entryText: 'sep'});
					menu.newEntry({menuName, entryText: 'Report for selected tracks' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
						if (!await checkLBToken()) {return false;}
						const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
						if (!token) {return;}
						const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
						const response = await lb.getFeedback(handleList, await lb.retrieveUser(token), token);
						const tfo = fb.TitleFormat('%TITLE%');
						const report = response.map((obj, i) => {
							const title = tfo.EvalWithMetadb(handleList[i]);
							const score = obj.score === 1 ? 'love' : obj.score === -1 ? 'hate' : '-none-';
							return title + ':\t' + score;
						}).join('\n');
						console.popup(report, 'ListenBrainz Feedback');
					}, flags: bListenBrainz ? selectedFlags : MF_GRAYED});
				}
				{
					const menuName = menu.newMenu('Retrieve user tracks...');
					menu.newEntry({menuName, entryText: 'User feedback from ListenBrainz:', flags: MF_GRAYED});
					menu.newEntry({menuName, entryText: 'sep'});
					[
						{key: 'love', title: 'Loved tracks', score: 1},
						{key: 'hate', title: 'Hated tracks', score: -1}
					].forEach((entry) =>  {
						menu.newEntry({menuName, entryText: 'Find ' + entry.title + ' in library' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
							if (!await checkLBToken()) {return false;}
							const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
							if (!token) {return;}
							const response = await lb.getUserFeedback(await lb.retrieveUser(token), {score: entry.score, metadata: 'true'}, token);
							const mbids = [], titles = [], artists = [];
							const report = entry.title + ': ' + response.length + '\n\n' + response.map((feedback, i) => {
								const mbid = feedback.recording_mbid;
								const trackMetadata = feedback.hasOwnProperty('track_metadata') ? feedback.track_metadata : null
								const title = trackMetadata ? trackMetadata.track_name : '';
								const artist = trackMetadata ? trackMetadata.artist_name : '';
								mbids.push(mbid);
								titles.push(title);
								artists.push(artist);
								return title + ' - ' + artist + ': ' + mbid;
							}).join('\n');
							fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title);
							const queryArr = mbids.map((mbid, i) => {
								if (!mbid.length) {return;}
								const title = _asciify(titles[i]);
								const artist = _asciify(artists[i]);
								const bMeta = title.length && artist.length;
								return 'MUSICBRAINZ_TRACKID IS ' + mbid + (bMeta ? ' OR (TITLE IS ' + title + ' AND ARTIST IS ' + artist + ')' : '');
							}).filter(Boolean);
							const query = query_join(queryArr, 'OR');
							let handleList;
							try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
							catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
							sendToPlaylist(handleList, 'ListenBrainz ' + entry.title);
						}, flags: bListenBrainz ? MF_STRING : MF_GRAYED});
					});
				}
				menu.newEntry({entryText: 'sep'});
				{
					const menuName = menu.newMenu('Statistics...');
					menu.newEntry({menuName, entryText: 'Create playlists from Top Listens:', flags: MF_GRAYED});
					menu.newEntry({menuName, entryText: 'sep'});
					['Sitewide', 'By user'].forEach((name, i) => {
						const subMenuName = menu.newMenu(name, menuName);
						[
							{params: {range: 'this_week', count: 200}, title: 'Top tracks this week'},
							{params: {range: 'this_month', count: 200}, title: 'Top tracks this month'},
							{params: {range: 'this_year', count: 200}, title: 'Top tracks this year'},
							{params: {range: 'all_time', count: 200}, title: 'Top tracks all time'}
						].forEach((entry) =>  {
							menu.newEntry({menuName: subMenuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
								if (!await checkLBToken()) {return false;}
								const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
								if (!token) {return;}
								const user = await (i ? lb.retrieveUser(token) : 'sitewide');
								const response = await lb.getTopRecordings(user, entry.params, token);
								const mbids = [];
								const tags = {TITLE: [], ARTIST: [], ALBUM: []};
								const report = entry.title + ': ' + response.length + '\n\n' + response.map((recording, i) => {
									const mbid = recording.recording_mbid || '';
									const title = recording.track_name || '';
									const artist = recording.artist_name || '';
									const release = recording.release_name || '';
									mbids.push(mbid);
									tags.TITLE.push(title);
									tags.ARTIST.push(artist);
									tags.ALBUM.push(release);
									return title + ' - ' + artist + ': ' + mbid;
								}).join('\n');
								fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
								const queryArr = mbids.map((mbid, i) => {
									const tagArr = ['TITLE', 'ARTIST', 'ALBUM']
										.map((key) => {return {key, val: _asciify(tags[key][i]).toLowerCase()};});
									const bMBID = mbid.length > 0;
									const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
									if (!bMeta && !bMBID) {return;}
									const query = query_join([
										bMeta ?  tagArr.map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') : '',
										bMeta ?  tagArr.slice(0, 2).map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
										bMBID ? 'MUSICBRAINZ_TRACKID IS ' + mbid : ''
										].filter(Boolean)
									, 'OR');
									return query;
								}).filter(Boolean);
								const query = query_join(queryArr, 'OR');
								let handleList;
								try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
								catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
								// Filter in 3 steps
								handleList = removeDuplicatesV2({handleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
								handleList = removeDuplicatesV2({handleList, checkKeys: ['$ascii($lower($trim(%TITLE%)))','ARTIST']});
								handleList.OrderByFormat(fb.TitleFormat('$rand()'), 1);
								sendToPlaylist(handleList, 'ListenBrainz ' + entry.title + ' ' + _p(user));
							}, flags: bListenBrainz ? MF_STRING : MF_GRAYED});
						});
					});
				}
				menu.newEntry({entryText: 'sep'});
				{
					const menuName = menu.newMenu('Track recommendations...');
					menu.newEntry({menuName, entryText: 'User specific recommendations:', flags: MF_GRAYED});
					menu.newEntry({menuName, entryText: 'sep'});
					[
						{params: {artist_type: 'top', count: 200}, title: 'Top artist'},
						{params: {artist_type: 'similar', count: 200}, title: 'Similar artist'},
						{params: {artist_type: 'raw', count: 200}, title: 'Raw recommendations'},
					].forEach((entry) =>  {
						menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
							if (!await checkLBToken()) {return false;}
							const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
							if (!token) {return;}
							const user = await lb.retrieveUser(token);
							const response = await lb.getRecommendedRecordings(user, entry.params, token);
							const mbids = [];
							const tags = {TITLE: [], ARTIST: [], ALBUM: []};
							const report = entry.title + ': ' + response.length + '\n\n' + response.map((recording, i) => {
								const mbid = recording.recording_mbid || '';
								const title = recording.track_name || '';
								const artist = recording.artist_name || '';
								const release = recording.release_name || '';
								mbids.push(mbid);
								tags.TITLE.push(title);
								tags.ARTIST.push(artist);
								tags.ALBUM.push(release);
								return title + ' - ' + artist + ': ' + mbid;
							}).join('\n');
							fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
							const queryArr = mbids.map((mbid, i) => {
								const tagArr = ['TITLE', 'ARTIST', 'ALBUM']
									.map((key) => {return {key, val: _asciify(tags[key][i]).toLowerCase()};});
								const bMBID = mbid.length > 0;
								const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
								if (!bMeta && !bMBID) {return;}
								const query = query_join([
									bMeta ?  tagArr.map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') : '',
									bMeta ?  tagArr.slice(0, 2).map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
									bMBID ? 'MUSICBRAINZ_TRACKID IS ' + mbid : ''
									].filter(Boolean)
								, 'OR');
								return query;
							}).filter(Boolean);
							const query = query_join(queryArr, 'OR');
							let handleList;
							try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
							catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query); return;}
							// Filter in 3 steps
							handleList = removeDuplicatesV2({handleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
							handleList = removeDuplicatesV2({handleList, checkKeys: ['$ascii($lower($trim(%TITLE%)))','ARTIST']});
							handleList.OrderByFormat(fb.TitleFormat('$rand()'), 1);
							sendToPlaylist(handleList, 'ListenBrainz ' + entry.title + ' ' + _p(user));
						}, flags: bListenBrainz ? MF_STRING : MF_GRAYED});
					});
				}
				menu.newEntry({entryText: 'sep'});
				{	// Configuration
					const menuName = menu.newMenu('Configuration...');
					{
						menu.newEntry({menuName, entryText: 'Set token...', func: async () => {return await checkLBToken('');}});
						menu.newCheckMenu(menuName, 'Set token...', void(0), () => {return properties.lBrainzToken[1].length ? true : false;});
						menu.newEntry({menuName, entryText: 'Open user profile'  + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
							if (!await checkLBToken()) {return;}
							const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
							if (!token) {return;}
							const user = await lb.retrieveUser(token);
							if (user.length) {_runCmd('CMD /C START https://listenbrainz.org/user/' + user + '/playlists/', false);}
						}, flags: bListenBrainz ? MF_STRING: MF_GRAYED});
					}
					menu.newEntry({menuName, entryText: 'sep'});
					{
						menu.newEntry({menuName, entryText: 'Lookup for missing track MBIDs?', func: () => {
							properties.bLookupMBIDs[1] = !properties.bLookupMBIDs[1];
							if (properties.bLookupMBIDs[1]) {
								fb.ShowPopupMessage('Exporting a playlist requires tracks to have \'MUSICBRAINZ_TRACKID\' tags on files.\n\nWhenever such tag is missing, the file can not be sent to ListenBrainz\'s online playlist. As workaround, the script may try to lookup missing MBIDs before exporting.\n\nNote results depend on the success of MusicBrainz api, so it\'s not guaranteed to find the proper match in all cases. Tag properly your files with Picard or foo_musicbrainz in such case.\n\nApi used:\nhttps://labs.api.listenbrainz.org/mbid-mapping', window.Name);
							}
							overwriteProperties(properties);
						}, flags: bListenBrainz ? MF_STRING: MF_GRAYED});
						menu.newCheckMenu(menuName, 'Lookup for missing track MBIDs?', void(0), () => {return properties.bLookupMBIDs[1];});
					}
				}
				return menu;
			}
			lBttnMenu(this, true).btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		const selMul = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
		let info = 'Token:' + (parent.buttonsProperties.lBrainzToken[1].length ? '\tOk' : ' \t-missing token-');
		info += '\nPlaylist:\t' +  (plman.ActivePlaylist !== -1 ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-');
		info += selMul && selMul.Count ? ' (' + selMul.Count + ' tracks selected)' : ' (No track selected)';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, folders.xxx + 'images\\icons\\listenbrainz_64.png', null),
});