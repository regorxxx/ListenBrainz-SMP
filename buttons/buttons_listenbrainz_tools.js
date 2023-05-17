'use strict';
//17/05/23

/* 
	Integrates ListenBrainz feedback and recommendations statistics within foobar2000 library.
*/

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\helpers\\buttons_xxx_menu.js');
include('..\\helpers\\helpers_xxx_playlists.js');
include('..\\main\\playlist_manager\\playlist_manager_listenbrainz.js');
include('..\\main\\playlist_manager\\playlist_manager_youtube.js');
include('..\\main\\filter_and_query\\remove_duplicates.js');
include('..\\main\\main_menu\\main_menu_custom.js');
include('..\\helpers-external\\easy-table-1.2.0\\table.js'); const Table = module.exports;
var prefix = 'lbt';

try {window.DefineScript('ListenBrainz Tools Button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Filter Playlist Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
	lBrainzToken:	['ListenBrainz user token', ''				, {func: isStringWeak}, ''],
	lBrainzEncrypt:	['Encript ListenBrainz user token?', false	, {func: isBoolean}, false],
	bLookupMBIDs: 	['Lookup for missing track MBIDs?', true	, {func: isBoolean}, true ],
	bAdvTitle:		['Advanced RegExp title matching?', true	, {func: isBoolean}, true],
	bDynamicMenus:	['Expose menus at  \'File\\Spider Monkey Panel\\Script commands\'', false, {func: isBoolean}, false],
	bIconMode:		['Icon-only mode?', false, {func: isBoolean}, false],
	bYouTube:		['Lookup for missing tracks on YouTube?', isYouTube, {func: isBoolean}, isYouTube],
	firstPopup:		['ListenBrainz Tools: Fired once', false, {func: isBoolean}, false],
	bTagFeedback:	['Tag files with feedback', false, {func: isBoolean}, false],
	feedbackTag:	['Feedback tag', 'FEEDBACK', {func: isString}, 'FEEDBACK']
};
setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);
// Create dynamic menus
if (newButtonsProperties.bDynamicMenus[1]) {
	bindDynamicMenus({
		menu: listenBrainzmenu.bind({buttonsProperties: newButtonsProperties, prefix: ''}),
		parentName: 'ListenBrainz',
		entryCallback: (entry) => {
			const prefix = 'ListenBrainz' + (/sitewide.*/i.test(entry.menuName) 
				? ': Sitewide '
				: /by user.*/i.test(entry.menuName) 
					? ': User '
					: ': '
			);
			return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
		}
	});
}

addButton({
	'Listen Brainz Tools': new themedButton({x: 0, y: 0, w: 100, h: 22}, 'Listen Brainz', function (mask) {
		if (mask === MK_SHIFT) {
			settingsMenu(
				this, true, ['buttons_listenbrainz_tools.js'],
				{
					bAdvTitle: {popup: globRegExp.title.desc},
					bDynamicMenus: {popup: 'Remember to set different panel names to every buttons toolbar, otherwise menus will not be properly associated to a single panel.\n\nShift + Win + R. Click -> Configure panel... (\'edit\' at top)'}
				},
				{bDynamicMenus: 
					(value) => {
						if (value) {
							bindDynamicMenus({
								menu: listenBrainzmenu.bind(this),
								parentName: 'ListenBrainz',
								entryCallback: (entry) => {
									const prefix = 'ListenBrainz' + (/sitewide.*/i.test(entry.menuName) 
										? ': Sitewide '
										: ': User '
									);
									return prefix + entry.entryText.replace(/\t.*/, '').replace(/&&/g, '&');
								}
							});
						} else {deleteMainMenuDynamic('ListenBrainz');}
					}
				}
			).btn_up(this.currX, this.currY + this.currH);
		} else {
			listenBrainzmenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
			this.retrieveUserRecommendedPlaylists(false);
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		const selMul = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
		let info = '';
		info += 'Token:' + (parent.buttonsProperties.lBrainzToken[1].length ? '\tOk' : ' \t-missing token-');
		info += '\nPlaylist:\t' +  (plman.ActivePlaylist !== -1 ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-');
		info += selMul && selMul.Count ? ' (' + selMul.Count + ' tracks selected)' : ' (No track selected)';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, folders.xxx + 'images\\icons\\listenbrainz_64.png', null, {lBrainzTokenListener: false, userPlaylists: []}, 
	{
		on_notify_data: (parent, name, info) => {
			if (name === 'bio_imgChange' || name === 'biographyTags' || name === 'bio_chkTrackRev' || name === 'xxx-scripts: panel name reply' || name === 'precacheLibraryPaths') {return;}
			switch (name) {
				case 'xxx-scripts: lb token': {
					if (parent.buttonsProperties.lBrainzToken[1].length) {window.NotifyOthers('xxx-scripts: lb token reply', {lBrainzToken: parent.buttonsProperties.lBrainzToken[1], lBrainzEncrypt: parent.buttonsProperties.lBrainzEncrypt[1], name: window.Name + ' - ' + parent.name});}
					break;
				}
				case 'xxx-scripts: lb token reply': {
					if (parent.lBrainzTokenListener) {
						console.log('lb token reply: using token from another instance.', window.Name + ' - ' + parent.name, _p('from ' + info.name));
						parent.buttonsProperties.lBrainzToken[1] = info.lBrainzToken;
						parent.buttonsProperties.lBrainzEncrypt[1] = info.lBrainzEncrypt;
						overwriteProperties(parent.buttonsProperties);
						parent.lBrainzTokenListener = false;
						if (!parent.buttonsProperties.lBrainzEncrypt[1]) {listenBrainz.followUser('troi-bot', parent.buttonsProperties.lBrainzToken[1])}
					}
					break;
				}
			}
		}
	},
	(parent) => {
		// Retrieve token from other panels
		if (!parent.buttonsProperties.firstPopup[1] && !parent.buttonsProperties.lBrainzToken[1].length) {
			parent.lBrainzTokenListener = true;
			setTimeout(() => window.NotifyOthers('xxx-scripts: lb token', null), 3000);
			setTimeout(() => {parent.lBrainzTokenListener = false;}, 6000);
			parent.buttonsProperties.firstPopup[1] = true;
			overwriteProperties(parent.buttonsProperties);
		}
		// Retrieve user playlists at startup and every 30 min, also everytime button is clicked
		parent.retrieveUserRecommendedPlaylists = (bLoop) => {
			const token = parent.buttonsProperties.lBrainzToken[1];
			const bListenBrainz = token.length;
			const bEncrypted = parent.buttonsProperties.lBrainzEncrypt[1];
			if (!bListenBrainz || bEncrypted) {
				parent.userPlaylists.length = 0;
				if (bLoop) {setTimeout(parent.retrieveUserRecommendedPlaylists, 3000000, true);}
				return Promise.resolve(false);
			}
			return listenBrainz.retrieveUser(token).then((user) => {
				return listenBrainz.retrieveUserRecommendedPlaylistsNames(user, {count: 200}, token);
			}).then((playlists) => {
				parent.userPlaylists.length = 0;
				if (playlists.length) {
					playlists.forEach((obj) => parent.userPlaylists.push(obj.playlist));
				}
				return;
			}).finally(() => {
				if (bLoop) {setTimeout(parent.retrieveUserRecommendedPlaylists, 3000000, true);}
			});
		};
		parent.retrieveUserRecommendedPlaylists(true);
	}),
});

function listenBrainzmenu({bSimulate = false} = {}) {
	if (bSimulate) {return listenBrainzmenu.bind({selItems: {Count: 1}, buttonsProperties: this.buttonsProperties, prefix: this.prefix})(false);}
	// Helpers
	const lb = listenBrainz;
	const properties = this.buttonsProperties;
	const feedbackTag = properties.feedbackTag[1];
	async function checkLBToken(lBrainzToken = properties.lBrainzToken[1]) {
		if (!lBrainzToken.length) {
			const encryptToken = '********-****-****-****-************';
			const currToken = properties.lBrainzEncrypt[1] ? encryptToken : properties.lBrainzToken[1];
			try {lBrainzToken = utils.InputBox(window.ID, 'Enter ListenBrainz user token:', window.Name, currToken, true);} 
			catch(e) {return false;}
			if (lBrainzToken === currToken || lBrainzToken === encryptToken) {return false;}
			if (lBrainzToken.length) {
				if (!(await lb.validateToken(lBrainzToken))) {fb.ShowPopupMessage('ListenBrainz Token not valid.', 'ListenBrainz'); return false;}
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
	// Menu
	const menu = new _menu();
	const bListenBrainz = properties.lBrainzToken[1].length;
	const bEncrypted = properties.lBrainzEncrypt[1];
	const selectedFlags = (idx = plman.ActivePlaylist) => this.selItems && this.selItems.Count || idx !== -1 && plman.GetPlaylistSelectedItems(idx).Count 
		? MF_STRING 
		: MF_GRAYED;
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
			const table = new Table;
			response.recording_mbid.forEach((id, i) => {
				const bFound = id.length ? true : false;
				const title = bFound ? response.recording_name[i] : tfo.EvalWithMetadb(handleList[i]);
				const mbid = bFound ? id : '-not found-';
				table.cell('Title', title);
				table.cell('MBID', mbid);
				table.newRow();
			});
			const report = table.toString();
			fb.ShowPopupMessage(report, 'ListenBrainz');
		}, flags: bListenBrainz ? selectedFlags : MF_GRAYED, data: {bDynamicMenu: true}});
		menu.newEntry({entryText: 'sep'});
	}
	{
		const menuName = menu.newMenu('Set feedback... (on selection)');
		menu.newEntry({menuName, entryText: 'Set track status on ListenBrainz:', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{key: 'love', title: 'Love selected tracks'},
			{key: 'hate', title: 'Hate selected tracks'},
			{key: 'remove', title: 'Clear feedback on selected tracks'}
		].forEach((entry) =>  {
			menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
				const response = await lb.sendFeedback(handleList, entry.key, token);
				if (!response) {fb.ShowPopupMessage('Error connecting to server. Check console.', 'ListenBrainz');}
				else if (properties.bTagFeedback[1]) {
					console.log('Tagging files...')
					const feedback = entry.key === 'love' ? 1 : entry.key === 'hate' ? -1 : '';
					const tags = Array(handleList.Count).fill('').map((t) => {return {[feedbackTag]: feedback};})
					handleList.UpdateFileInfoFromJSON(JSON.stringify(tags));
				}
			}, flags: bListenBrainz ? selectedFlags : MF_GRAYED, data: {bDynamicMenu: true}});
		});
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'Report for selected tracks' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
			if (!await checkLBToken()) {return false;}
			const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
			if (!token) {return;}
			const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			const response = await lb.getFeedback(handleList, await lb.retrieveUser(token), token);
			const titles = fb.TitleFormat('%TITLE%').EvalWithMetadbs(handleList);
			const feedbacks = fb.TitleFormat(_b(_t(feedbackTag))).EvalWithMetadbs(handleList);
			const table = new Table;
			response.forEach((obj, i) => {
				const title = titles[i];
				const score = obj.score === 1 ? 'love' : obj.score === -1 ? 'hate' : '-none-';
				const feedbackNum = Number(feedbacks[i]);
				const feedback = feedbackNum === 1 ? 'love' : feedbackNum === -1 ? 'hate' : '-none-';
				const bMismatch = feedback !== score;
				table.cell('Title', title);
				table.cell('Online', score);
				table.cell('Tag', bMismatch ? feedback : '');
				table.newRow();
			});
			const report = table.toString();
			console.popup(report, 'ListenBrainz Feedback');
		}, flags: bListenBrainz ? selectedFlags : MF_GRAYED, data: {bDynamicMenu: true}});
	}
	{
		const menuName = menu.newMenu('Retrieve user tracks...');
		menu.newEntry({menuName, entryText: 'By feedback: (Shift + Click to randomize)', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{key: 'love', title: 'Loved tracks', score: 1},
			{key: 'hate', title: 'Hated tracks', score: -1}
		].forEach((entry) => {
			menu.newEntry({menuName, entryText: 'Find ' + entry.title + ' in library' + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const user = await (lb.retrieveUser(token));
				const response = await lb.getUserFeedback(user, {score: entry.score, metadata: 'true'}, token);
				const mbids = [], titles = [], artists = [];
				const table = new Table;
				response.forEach((feedback, i) => {
					const mbid = feedback.recording_mbid;
					const trackMetadata = feedback.hasOwnProperty('track_metadata') ? feedback.track_metadata : null
					const title = trackMetadata ? trackMetadata.track_name : '';
					const artist = trackMetadata ? trackMetadata.artist_name : '';
					titles.push(title);
					artists.push(artist);
					mbids.push(mbid);
					table.cell('Title', title);
					table.cell('Artist', artist);
					table.cell('MBID', mbid);
					table.newRow();
				});
				const queryArr = mbids.map((mbid, i) => {
					if (!mbid.length) {return;}
					const title = _asciify(titles[i]);
					const artist = _asciify(artists[i]);
					const bMeta = title.length && artist.length;
					return 'MUSICBRAINZ_TRACKID IS ' + mbid + (bMeta ? ' OR (TITLE IS ' + title + ' AND ARTIST IS ' + artist + ')' : '');
				}).filter(Boolean);
				let query = query_join(queryArr, 'OR');
				let handleList;
				try {handleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
				catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
				let report =  entry.title + ': ' + response.length + '\n\n' + table.toString();
				// Find tracks with feedback tag, and insert them at the end without duplicates
				let libHandleList;
				query = feedbackTag + ' IS ' + entry.score;
				try {libHandleList = fb.GetQueryItems(fb.GetLibraryItems(), query);} // Sanity check
				catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
				const copyHandleList = handleList.Clone();
				copyHandleList.Sort();
				let byTagHandleList = new FbMetadbHandleList();
				libHandleList.Convert().forEach((handle) => {
					if (copyHandleList.BSearch(handle) === -1) {byTagHandleList.Insert(byTagHandleList.Count, handle);}
				});
				// Insert in global list
				const byTagCount = byTagHandleList.Count;
				if (byTagCount) {
					byTagHandleList = removeDuplicatesV2({handleList: byTagHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
					handleList.InsertRange(handleList.Count, byTagHandleList);
					// Add to report
					const bRemovedDup = byTagHandleList.Count !== byTagCount;
					const titles = fb.TitleFormat('%TITLE%').EvalWithMetadbs(byTagHandleList);
					const artists = fb.TitleFormat('%ARTIST%').EvalWithMetadbs(byTagHandleList);
					const feedbacks = fb.TitleFormat('%MUSICBRAINZ_TRACKID%').EvalWithMetadbs(byTagHandleList);
					const table = new Table;
					for (let i = 0; i < byTagHandleList.Count; i++) {
						table.cell('Title', titles[i]);
						table.cell('Artist', artists[i]);
						table.cell('MBID', mbids[i]);
						table.newRow();
					}
					report += '\n\nAlso found these tracks tagged on library but not on ListenBrainz' +  (bRemovedDup ? ', minus duplicates by MBID,\nTo retrieve the full list, use this query: ' + query : ':') + '\n\n' + table.toString();
				}
				fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
				if (bShift) {handleList = new FbMetadbHandleList(handleList.Convert().shuffle());}
				sendToPlaylist(handleList, 'ListenBrainz ' + entry.title);
			}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: {bDynamicMenu: true}});
		});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const menuName = menu.newMenu('Statistics...');
		menu.newEntry({menuName, entryText: 'By Top Listens: (Shift + Click to randomize)', flags: MF_GRAYED});
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
					const bShift = utils.IsKeyPressed(VK_SHIFT);
					if (!await checkLBToken()) {return false;}
					const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
					if (!token) {return;}
					const mbids = [];
					const tags = {TITLE: [], ARTIST: [], ALBUM: []};
					let count = 0;
					const user = await (i ? lb.retrieveUser(token) : 'sitewide');
					this.switchAnimation('ListeBrainz data retrieval', true);
					lb.getTopRecordings(user, entry.params, token)
						.then((recordings) => {
							const table = new Table;
							recordings.forEach((recording, i) => {
								const mbid = recording.recording_mbid || '';
								const title = recording.track_name || '';
								const artist = recording.artist_name || '';
								const release = recording.release_name || '';
								mbids.push(mbid);
								tags.TITLE.push(title);
								tags.ARTIST.push(artist);
								tags.ALBUM.push(release);
								table.cell('Title', title);
								table.cell('Artist', artist);
								table.cell('MBID', mbid);
								table.newRow();
							});
							const report = entry.title + ': ' + recordings.length + '\n\n' + table.toString();
							fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
							const queryArr = mbids.map((mbid, i) => {
								const tagArr = ['TITLE', 'ARTIST', 'ALBUM']
									.map((key) => {return {key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g,'')).toLowerCase()};});
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
							const libItems = fb.GetLibraryItems();
							const notFound = [];
							const items = queryArr.map((query, i) => {
								let itemHandleList;
								try {itemHandleList = fb.GetQueryItems(libItems, query);} // Sanity check
								catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
								// Filter
								if (itemHandleList.Count) {
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : properties.bAdvTitle[1]});
									return itemHandleList[0];
								}
								notFound.push({creator: tags.ARTIST[i], title: tags.TITLE[i], tags: {ALBUM: tags.ALBUM[i], MUSICBRAINZ_TRACKID: mbids[i]}});
								return null;
							});
							return {notFound, items};
						})
						.then (({notFound, items}) => {
							if (notFound.length && properties.bYouTube[1] && isYouTube) {
								// Send request in parallel every x ms and process when all are done
								this.switchAnimation('YouTube Scrapping' , true);
								return Promise.parallel(notFound, youtube.searchForYoutubeTrack, 5).then((results) => {
									let j = 0;
									const itemsLen = items.length;
									results.forEach((result, i) => {
										for (void(0); j <= itemsLen; j++) {
											if (result.status !== 'fulfilled') {
												console.log(result.status, result.reason.message);
												break;
											}
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
									this.switchAnimation('YouTube Scrapping', false);
								});
							} else {
								return items;
							}
						})
						.then((items) => {
							const user = playlist.extension['https://musicbrainz.org/doc/jspf#playlist'].created_for;
							if (bShift) {items.shuffle();}
							const idx = plman.FindOrCreatePlaylist('ListenBrainz ' + entryText + ' ' + _p(user), true);
							plman.ClearPlaylist(idx);
							plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
							plman.ActivePlaylist = idx;
						})
						.finally((a) => {
							if (this.isAnimationActive('ListeBrainz data retrieval')) {this.switchAnimation('ListeBrainz data retrieval', false);}
						});
				}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: {bDynamicMenu: true}});
			});
		});
	}
	menu.newEntry({entryText: 'sep'});
	{
		const menuName = menu.newMenu('Track recommendations...');
		menu.newEntry({menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{params: {artist_type: 'top', count: 200}, title: 'By top artists listened'},
			{params: {artist_type: 'similar', count: 200}, title: 'Similar to artists listened'},
			{params: {artist_type: 'raw', count: 200}, title: 'Raw recommendations'},
		].forEach((entry) =>  {
			menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const mbids = [];
				const tags = {TITLE: [], ARTIST: []};
				let count = 0;
				const user = await lb.retrieveUser(token);
				this.switchAnimation('ListeBrainz data retrieval', true);
				lb.getRecommendedRecordings(user, entry.params, token)
					.then((recommendations) => {
						recommendations.forEach((recording, i) => {
							mbids.push(recording.recording_mbid || '');
							tags.TITLE.push('');
							tags.ARTIST.push('');
						});
						count = mbids.length;
						const infoNames = ['recording_mbid', 'recording_name', 'artist_credit_name'];
						return lb.lookupRecordingInfoByMBIDs(mbids, infoNames, token);
					})
					.then((info) => {
						this.switchAnimation('ListeBrainz data retrieval', false);
						for (let i = 0; i < count; i++) {
							if (mbids[i] === info.recording_mbid[i]) {
								if (info.recording_name[i]) {tags.TITLE[i] = info.recording_name[i];}
								if (info.artist_credit_name[i]) {tags.ARTIST[i] = info.artist_credit_name[i];}
							}
						}
						const table = new Table;
						mbids.forEach((mbid, i) => {
							table.cell('Title', tags.TITLE[i]);
							table.cell('Artist', tags.ARTIST[i]);
							table.cell('MBID', mbid);
							table.newRow();
						});
						const report = entry.title + ': ' + count + '\n\n' + table.toString();
						fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
						const queryArr = mbids.map((mbid, i) => {
							const tagArr = ['TITLE', 'ARTIST']
								.map((key) => {return {key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g,'')).toLowerCase()};});
							const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
							if (!bMeta) {return;}
							const query = query_join([
								bMeta ?  tagArr.map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') : '',
								bMeta ?  tagArr.slice(0, 2).map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
								'MUSICBRAINZ_TRACKID IS ' + mbid
								].filter(Boolean)
							, 'OR');
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
								itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
								itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : properties.bAdvTitle[1]});
								return itemHandleList[0];
							}
							notFound.push({creator: tags.ARTIST[i], title: tags.TITLE[i], tags: {MUSICBRAINZ_TRACKID: mbids[i]}});
							return null;
						});
						return {notFound, items};
					})
					.then(({notFound, items}) => {
						if (notFound.length && properties.bYouTube[1] && isYouTube) {
							this.switchAnimation('YouTube Scrapping', true);
							// Add MBIDs to youtube track metadata
							notFound.forEach((track) => track.tags = {musicbrainz_trackid: track.identifier});
							// Send request in parallel every x ms and process when all are done
							return Promise.parallel(notFound, youtube.searchForYoutubeTrack, 5).then((results) => {
								let j = 0;
								const itemsLen = items.length;
								results.forEach((result, i) => {
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
								this.switchAnimation('YouTube Scrapping', false);
							});
						} else {
							return items;
						}
					})
					.then((items) => {
						const user = playlist.extension['https://musicbrainz.org/doc/jspf#playlist'].created_for;
						if (bShift) {items.shuffle();}
						const idx = plman.FindOrCreatePlaylist('ListenBrainz ' + entryText + ' ' + _p(user), true);
						plman.ClearPlaylist(idx);
						plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
						plman.ActivePlaylist = idx;
					})
					.finally(() => {
						if (this.isAnimationActive('ListeBrainz data retrieval')) {this.switchAnimation('ListeBrainz data retrieval', false);}
					});
			}, flags: bListenBrainz ? MF_STRING : MF_GRAYED, data: {bDynamicMenu: true}});
		});
	}
	{
		const menuName = menu.newMenu('Playlists recommendations...');
		menu.newEntry({menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		if (this.userPlaylists.length) {
			this.userPlaylists.forEach((playlist) => {
				const entryText = playlist.title.replace(/ for \S+\b/, '');
				menu.newEntry({menuName, entryText, func: async () => {
					const bShift = utils.IsKeyPressed(VK_SHIFT);
					if (!await checkLBToken()) {return false;}
					const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
					if (!token) {return;}
					this.switchAnimation('ListeBrainz data retrieval', true);
					lb.importPlaylist({playlist_mbid: playlist.identifier.replace(lb.regEx, '')}, token)
						.then((jspf) => {
							if (jspf) {
								const data = lb.contentResolver(jspf);
								const items = data.handleArr;
								const notFound = data.notFound;
								// Find missing tracks on youtube
								if (notFound.length && properties.bYouTube[1] && isYouTube) {
									this.switchAnimation('YouTube Scrapping', true);
									// Send request in parallel every x ms and process when all are done
									return Promise.parallel(notFound, youtube.searchForYoutubeTrack, 5).then((results) => {
										let j = 0;
										const itemsLen = items.length;
										let foundLinks = 0;
										results.forEach((result, i) => {
											for (void(0); j <= itemsLen; j++) {
												if (result.status !== 'fulfilled') {break;}
												const link = result.value;
												if (!link || !link.length) {break;}
												if (!items[j]) {
													items[j] = link.url;
													foundLinks++;
													break;
												}
											}
										});
										return items;
									})
									.finally(() => {
										this.switchAnimation('YouTube Scrapping', false);
									});
								} else {
									return items;
								}
							}
						}).then((items) => {
							const user = playlist.extension['https://musicbrainz.org/doc/jspf#playlist'].created_for;
							if (bShift) {items.shuffle();}
							const idx = plman.FindOrCreatePlaylist('ListenBrainz ' + entryText + ' ' + _p(user), true);
							plman.ClearPlaylist(idx);
							plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
							plman.ActivePlaylist = idx;
						})
						.finally(() => {
							if (this.isAnimationActive('ListeBrainz data retrieval')) {this.switchAnimation('ListeBrainz data retrieval', false);}
						});
				}});
			});
		} else {
			menu.newEntry({menuName, entryText: '- None -', flags: MF_GRAYED});
		}
		menu.newEntry({menuName, entryText: 'sep'});
		menu.newEntry({menuName, entryText: 'Enable daily jams', func: async () => {
			if (!await checkLBToken()) {return;}
			const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
			listenBrainz.followUser('troi-bot', token).then((result) => {
				fb.ShowPopupMessage('Daily jams are ' + (result 
					? 'enabled.\n\nDaily jams are playlists created by a ListenBrainz bot named \'troi-bot\', which sends new playlists to users every day when they follow it (already done).\n\nLook for new playlists in a day or two.' 
					: 'disabled. Try again later.'
				), 'ListenBrainz');
			});
		}});
	}
	menu.newEntry({entryText: 'sep'});
	{	// Configuration
		const menuName = menu.newMenu('Configuration...');
		{
			menu.newEntry({menuName, entryText: 'Set token...', func: async () => {
				const bDone = await checkLBToken('');
				if (bDone) {
					// Force following troi-bot user to create daily jams
					const token = lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted: properties.lBrainzEncrypt[1]});
					listenBrainz.followUser('troi-bot', properties.lBrainzToken[1]);
				}
				return bDone;
			}});
			menu.newCheckMenu(menuName, 'Set token...', void(0), () => {return properties.lBrainzToken[1].length ? true : false;});
			menu.newEntry({menuName, entryText: 'Retrieve token from other panels...', func: () => {
				this.lBrainzTokenListener = true;
				let cache = {token: properties.lBrainzToken[1], encrypted: properties.lBrainzEncrypt[1]};
				window.NotifyOthers('xxx-scripts: lb token', null);
				setTimeout(() => {
					this.lBrainzTokenListener = false;
					fb.ShowPopupMessage('ListenBrainz token report:\n\nOld value:  ' + cache.toStr({bClosure: true}) + '\nNew value:  ' + {token: properties.lBrainzToken[1], encrypted: properties.lBrainzEncrypt[1]}.toStr({bClosure: true}), 'ListenBrainz');
				}, 1500);
			}});
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
					fb.ShowPopupMessage('Exporting a playlist requires tracks to have \'MUSICBRAINZ_TRACKID\' tags on files.\n\nWhenever such tag is missing, the file can not be sent to ListenBrainz\'s online playlist. As workaround, the script may try to lookup missing MBIDs before exporting.\n\nNote results depend on the success of MusicBrainz api, so it\'s not guaranteed to find the proper match in all cases. Tag properly your files with Picard or foo_musicbrainz in such case.\n\nApi used:\nhttps://labs.api.listenbrainz.org/mbid-mapping', 'ListenBrainz');
				}
				overwriteProperties(properties);
			}, flags: bListenBrainz ? MF_STRING: MF_GRAYED});
			menu.newCheckMenu(menuName, 'Lookup for missing track MBIDs?', void(0), () => {return properties.bLookupMBIDs[1];});
		}
		{
			menu.newEntry({menuName, entryText: 'Lookup for missing tracks on YouTube?', func: () => {
				properties.bYouTube[1] = !properties.bYouTube[1];
				if (properties.bYouTube[1]) {
					fb.ShowPopupMessage('By default, tracks retrieved from ListenBrainz (to create playlists) are matched against the library.\n\When this option is enabled, not found items will be replaced by YouTube links.\n\nUsing this option takes some seconds while scrapping youtube, the button will be animated during the process.', 'ListenBrainz'	);
				}
				overwriteProperties(properties);
			}, flags: bListenBrainz && isYouTube ? MF_STRING: MF_GRAYED});
			menu.newCheckMenu(menuName, 'Lookup for missing tracks on YouTube?', void(0), () => {return properties.bYouTube[1];});
		}
	}
	return menu;
}