'use strict';
//05/06/23

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
	feedbackTag:	['Feedback tag', globTags.feedback, {func: isString}, globTags.feedback],
	feedbackCache:	['Feedback cache file', folders.data + 'listenbrainz_feedback.json', {func: isString}, folders.data + 'listenbrainz_feedback.json'],
	userCache:		['User name cache', '', {func: isStringWeak}, ''],
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
			this.retrieveUserRecommendedPlaylists(false);
			listenBrainzmenu.bind(this)().btn_up(this.currX, this.currY + this.currH);
		}
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		const selMul = plman.ActivePlaylist !== -1 ? plman.GetPlaylistSelectedItems(plman.ActivePlaylist) : null;
		let infoMul = '';
		if (selMul && selMul.Count > 1) {
			infoMul = ' (multiple tracks selected: ' + selMul.Count + ')';
		}
		const sel = fb.GetFocusItem();
		let info = 'No track selected\nSome menus disabled';
		if (sel) {
			const feedbackTag = parent.buttonsProperties.feedbackTag[1];
			let tfo = fb.TitleFormat(
					'Current track:	%ARTIST% / %TRACK% - %TITLE%' +
					'[$and(%' + feedbackTag + '%)$crlf()Feedback:	$select($add(%' + feedbackTag+ '%,2),' + sanitizeTagTfo(chars.sadEmoji) +' Hated...,-,' + sanitizeTagTfo(chars.loveEmojiCycle(2000)) + ' Loved!)]' // Only show if tag is present
				);
			info = 'Playlist:		' + (plman.ActivePlaylist !== -1 ? plman.GetPlaylistName(plman.ActivePlaylist) : '-none-') + infoMul + '\n';
			info += tfo.EvalWithMetadb(sel);
		}
		info += '\nToken:\t\t' + (parent.buttonsProperties.lBrainzToken[1].length ? 'Ok' : ' -missing token-');
		info += '\nUser Playlists:\t' + (parent.userPlaylists.length ? 'Ok' : ' -missing-');
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open advanced config menu)';
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
						lb.cache.key = null;
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
			const lb = listenBrainz;
			const token = parent.buttonsProperties.lBrainzToken[1];
			const bListenBrainz = token.length;
			const bEncrypted = parent.buttonsProperties.lBrainzEncrypt[1];
			if (!bListenBrainz || (bEncrypted && !lb.cache.key)) {
				parent.userPlaylists.length = 0;
				if (bLoop) {setTimeout(parent.retrieveUserRecommendedPlaylists, 1800000, true);}
				return Promise.resolve(false);
			}
			parent.switchAnimation('ListeBrainz retrieve user playlists', true)
			return lb.retrieveUser(lb.decryptToken({lBrainzToken: token, bEncrypted})).then((user) => {
				return lb.retrieveUserRecommendedPlaylistsNames(user, {count: lb.MAX_ITEMS_PER_GET}, lb.decryptToken({lBrainzToken: token, bEncrypted}));
			}).then((playlists) => {
				parent.userPlaylists.length = 0;
				if (playlists.length) {
					playlists.forEach((obj) => parent.userPlaylists.push(obj.playlist));
				}
				return;
			}).finally(() => {
				parent.switchAnimation('ListeBrainz retrieve user playlists', false)
				if (bLoop) {setTimeout(parent.retrieveUserRecommendedPlaylists, 1800000, true);}
			});
		};
		setTimeout(parent.retrieveUserRecommendedPlaylists, 20000, true);
		// Load feedback cache
		listenBrainz.cache.feedback = new Map();
		if (_isFile(parent.buttonsProperties.feedbackCache[1])) {
			const data = _jsonParseFile(parent.buttonsProperties.feedbackCache[1], utf8);
			if (data) {
				data.forEach((userData) => {
					listenBrainz.cache.feedback.set(userData.name, userData.cache);
				});
			}
		}
		// Save cache
		parent.saveCache = (user) => {
			const newData = [];
			const data = [...listenBrainz.cache.feedback]
				.filter((userData) => userData[0] === user)
				.map((userData) => {return {name: userData[0], cache: userData[1]};});
			if (!data.length) {return;}
			if (_isFile(parent.buttonsProperties.feedbackCache[1])) {
				const oldData = _jsonParseFile(parent.buttonsProperties.feedbackCache[1], utf8);
				_recycleFile(parent.buttonsProperties.feedbackCache[1]);
				const idx = oldData.findIndex((userData) => userData.name === user);
				if (idx !== -1) {
					oldData[idx] = data[0];
				} else {
					oldData.push(data[0]);
				}
				oldData.forEach((userData) => newData.push(userData));
			} else {
				newData.push(data[0]);
			}
			_save(parent.buttonsProperties.feedbackCache[1], JSON.stringify(newData));
		};
		// Send feedback cache every 10 min
		parent.sendFeedbackCache = async () => {
			const token = parent.buttonsProperties.lBrainzToken[1];
			const bListenBrainz = token.length;
			const bEncrypted = parent.buttonsProperties.lBrainzEncrypt[1];
			const user = await listenBrainz.retrieveUser(listenBrainz.decryptToken({lBrainzToken: token, bEncrypted}));
			const promises = [];
			listenBrainz.cache.feedback.forEach((data, dataUser) => {
				if (dataUser !== user) {return;}
				const sendMBIDs = Object.keys(data);
				if (sendMBIDs.length) {
					const queue = {love: [], hate: [], remove: []};
					sendMBIDs.forEach((mbid) => {
						queue[data[mbid].feedback].push(mbid);
					});
					parent.switchAnimation('ListeBrainz feedback cache uploading', true);
					Object.keys(queue).forEach((key) => {
						if (queue[key].length) {
							const mbids = queue[key].slice(0, 25);
							promises.push(
								listenBrainz.sendFeedback(mbids, key, listenBrainz.decryptToken({lBrainzToken: token, bEncrypted}), false, true, false)
									.then((response) => {
										if (response) {
											let bDone = false;
											(Array.isArray(response) ? response : [response]).forEach((bSent, i) => {
												if (bSent) {
													delete data[mbids[i]];
													bDone = true;
												}
											});
											return bDone;
										}
									})
							);
						}
					});
					parent.switchAnimation('ListeBrainz feedback cache uploading', false);
				}
			});
			Promise.allSettled(promises).then((results) => {
				const count = results.filter(Boolean).length;
				if (count) {
					parent.saveCache(user);
					console.log('ListeBrainz feedback cache sent: ' + count + ' items');
				}
			});
		};
		setInterval(parent.sendFeedbackCache, 600000);
		setTimeout(parent.sendFeedbackCache, 5000);
	}),
});

function listenBrainzmenu({bSimulate = false} = {}) {
	if (bSimulate) {return listenBrainzmenu.bind({selItems: {Count: 1}, buttonsProperties: this.buttonsProperties, prefix: this.prefix})(false);}
	// Helpers
	const lb = listenBrainz;
	const properties = this.buttonsProperties;
	const feedbackTag = properties.feedbackTag[1];
	const bLookupMBIDs = properties.bLookupMBIDs[1];
	const bListenBrainz = properties.lBrainzToken[1].length;
	const bEncrypted = properties.lBrainzEncrypt[1];
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
	// Update cache
	if (bListenBrainz) {
		lb.retrieveUser(lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted})).then((name) => {
			if (name) {
				properties.userCache[1] = name;
				overwriteProperties({userCache: [...properties.userCache]});
			}
		});
	}
	// Menu
	const menu = new _menu();
	const selectedFlags = (idx = plman.ActivePlaylist) => this.selItems && this.selItems.Count || idx !== -1 && plman.GetPlaylistSelectedItems(idx).Count 
		? MF_STRING 
		: MF_GRAYED;
	const selectedFlagsCount = (maxCount) => {
		return (idx = plman.ActivePlaylist) => this.selItems && this.selItems.Count <= maxCount || idx !== -1 && plman.GetPlaylistSelectedItems(idx).Count <= maxCount 
			? MF_STRING 
			: MF_GRAYED;
	};
	const selectedCountTitle = (maxCount, idx = plman.ActivePlaylist) => {
		return this.selItems && this.selItems.Count <= maxCount || idx !== -1 && plman.GetPlaylistSelectedItems(idx).Count <= maxCount 
			? '' 
			: ' (< ' + maxCount + ' tracks)';
	};
	// Menu
	{
		menu.newEntry({entryText: 'Retrieve MBIDs from selection' + (bListenBrainz ? selectedCountTitle(70) : '\t(token not set)'), func: async () => {
			if (!await checkLBToken()) {return false;}
			const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
			if (!token) {return;}
			const tfo = fb.TitleFormat('%TITLE%');
			const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			this.switchAnimation('ListeBrainz data retrieval', true);
			const response = await lb.lookupRecordingInfo(handleList, ['recording_name', 'recording_mbid'], token);
			this.switchAnimation('ListeBrainz data retrieval', false);
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
		}, flags: bListenBrainz ? selectedFlagsCount(70) : MF_GRAYED, data: {bDynamicMenu: true}});
		menu.newEntry({entryText: 'sep'});
	}
	{
		const menuName = menu.newMenu('Set feedback... (on selection)');
		menu.newEntry({menuName, entryText: 'Set track status on ListenBrainz:', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{key: 'love', title: 'Love selected tracks'},
			{key: 'hate', title: 'Hate selected tracks'},
			{title: 'sep'},
			{key: 'remove', title: 'Clear selected tracks'}
		].forEach((entry) =>  {
			if (entry.title === 'sep') {menu.newEntry({menuName, entryText: 'sep'}); return;}
			menu.newEntry({menuName, entryText: () => entry.title + (bListenBrainz ? selectedCountTitle(25) : '\t(token not set)'), func: async () => {
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
				const user = await lb.retrieveUser(token);
				// Check actual feedback
				this.switchAnimation('ListeBrainz data retrieval', true);
				const response = await lb.getFeedback(handleList, user, token, bLookupMBIDs);
				const sendMBIDs = [];
				if (response && response.length) {
					response.forEach((obj, i) => {
						if (!obj.recording_mbid) {return;} // Omit not found items
						if (obj.score === 1 && entry.key !== 'love' || obj.score === -1 && entry.key !== 'hate' || obj.score === 0 && entry.key !== 'remove') {sendMBIDs.push(obj.recording_mbid);}
					});
				} else {
					const mbids = await listenBrainz.getMBIDs(handleList, null, false);
					mbids.filter(Boolean).forEach((mbid) => sendMBIDs.push(mbid));
				}
				this.switchAnimation('ListeBrainz data retrieval', false);
 				// Only update required tracks
				if (sendMBIDs.length) {
					this.switchAnimation('ListeBrainz data uploading', true);
					const response = await lb.sendFeedback(sendMBIDs, entry.key, token, false, true);
					this.switchAnimation('ListeBrainz data uploading', false);
					if (!response || !response.every(Boolean)) {
						// fb.ShowPopupMessage('Error connecting to server. Check console.\nIn case some tracks were not properly updated on server, try again setting the feedback for them.\n\nNote sending feedback for a high number of tracks may be rejected due to rate limits...', 'ListenBrainz');
						if (user || properties.userCache[1].length) {
							fb.ShowPopupMessage('Error connecting to server. Check console.\nData has been cached and will be sent later...', 'ListenBrainz');
							const date = Date.now();
							const data = listenBrainz.cache.feedback.get(user || properties.userCache[1]) || {};
							if (!response) {
								sendMBIDs.forEach((mbid) => data[mbid] = {feedback: entry.key, date});
							} else {
								response.forEach((bUpdate, i) => {
									if (!bUpdate) {data[sendMBIDs[i]] = {feedback: entry.key, date};}
								});
							}
							listenBrainz.cache.feedback.set(user || properties.userCache[1], data);
							setTimeout(this.saveCache, 0, user || properties.userCache[1]);
						} else {
							fb.ShowPopupMessage('Error connecting to server. Check console.\nUser has not been retrieved and feedback can not be saved to cache.', 'ListenBrainz');
						}
					}
				}
				if (properties.bTagFeedback[1]) {
					console.log('Tagging files...')
					const feedback = entry.key === 'love' ? 1 : entry.key === 'hate' ? -1 : '';
					const tags = Array(handleList.Count).fill('').map((t) => {return {[feedbackTag]: feedback};})
					handleList.UpdateFileInfoFromJSON(JSON.stringify(tags));
				}
			}, flags: bListenBrainz ? selectedFlagsCount(25) : MF_GRAYED, data: {bDynamicMenu: true}});
		});
		menu.newEntry({menuName, entryText: 'sep'});
		// 100 track limit is imposed although the API with POST method allows an unlimited number
		menu.newEntry({menuName, entryText: 'Report for selected tracks' + (bListenBrainz ? selectedCountTitle(Infinity) : '\t(token not set)'), func: async () => {
			if (!await checkLBToken()) {return false;}
			const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
			if (!token) {return;}
			const handleList = plman.GetPlaylistSelectedItems(plman.ActivePlaylist);
			this.switchAnimation('ListeBrainz data retrieval', true);
			const response = await lb.getFeedback(handleList, await lb.retrieveUser(token), token, bLookupMBIDs);
			this.switchAnimation('ListeBrainz data retrieval', false);
			const titles = fb.TitleFormat('%TITLE%').EvalWithMetadbs(handleList);
			const feedbacks = fb.TitleFormat(_b(_t(feedbackTag))).EvalWithMetadbs(handleList);
			const table = new Table;
			let loved = 0, hated = 0, missmatch = 0;
			response.forEach((obj, i) => {
				const title = titles[i];
				const score = obj.score === 1 ? 'love' : obj.score === -1 ? 'hate' : '-none-';
				const feedbackNum = Number(feedbacks[i]);
				const feedback = feedbackNum === 1 ? 'love' : feedbackNum === -1 ? 'hate' : '-none-';
				const bMismatch = feedback !== score;
				if (obj.score === 1 || feedbackNum === 1) {loved++;} else if (obj.score === -1 || feedbackNum === -1) {hated++;}
				if (bMismatch) {missmatch++;}
				table.cell('Title', title);
				table.cell('Online', score);
				table.cell('Tag', bMismatch 
					? feedback !== '-none-' 
						? feedback 
						: '  \u2715  ' 
					: '  \u2713  ');
				table.newRow();
			});
			let report = 'Analyzed ' + response.length + ' tracks:\n  - Loved: ' + loved + '\n  - Hated: ' + hated + '\n  - Missmatch: ' + missmatch;
			report += '\n\n' + table.toString();
			fb.ShowPopupMessage(report, 'ListenBrainz Feedback');
		}, flags: bListenBrainz ? selectedFlagsCount(Infinity) : MF_GRAYED, data: {bDynamicMenu: true}});
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
				this.switchAnimation('ListeBrainz data retrieval', true);
				const user = await (lb.retrieveUser(token));
				const response = await lb.getUserFeedback(user, {score: entry.score, offset: 0, count: lb.MAX_ITEMS_PER_GET, metadata: 'true'}, token);
				this.switchAnimation('ListeBrainz data retrieval', false);
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
					const title = sanitizeQueryVal(sanitizeTagValIds(titles[i]));
					const artist = sanitizeQueryVal(sanitizeTagValIds(artists[i]));
					const bMeta = title.length && artist.length;
					return 'MUSICBRAINZ_TRACKID IS ' + mbid + (bMeta ? ' OR (' + _q(sanitizeTagIds(_t(globTags.titleRaw))) + ' IS ' + title + ' AND ' + _q(sanitizeTagIds(_t(globTags.artist))) + ' IS ' + artist + ')' : '');
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
					const mbids = fb.TitleFormat('%MUSICBRAINZ_TRACKID%').EvalWithMetadbs(byTagHandleList);
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
				{params: {range: 'this_week', count: lb.MAX_ITEMS_PER_GET}, title: 'Top tracks this week'},
				{params: {range: 'this_month', count: lb.MAX_ITEMS_PER_GET}, title: 'Top tracks this month'},
				{params: {range: 'this_year', count: lb.MAX_ITEMS_PER_GET}, title: 'Top tracks this year'},
				{params: {range: 'all_time', count: lb.MAX_ITEMS_PER_GET}, title: 'Top tracks all time'}
			].forEach((entry) =>  {
				menu.newEntry({menuName: subMenuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
					const bShift = utils.IsKeyPressed(VK_SHIFT);
					if (!await checkLBToken()) {return false;}
					const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
					if (!token) {return;}
					const mbids = [];
					const tags = {TITLE: [], ARTIST: [], ALBUM: []};
					let count = 0;
					this.switchAnimation('ListeBrainz data retrieval', true);
					const user = await (i ? lb.retrieveUser(token) : 'sitewide');
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
									.map((key) => {return {key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i]))};});
								const bMBID = mbid.length > 0;
								const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
								if (!bMeta && !bMBID) {return;}
								const query = query_join([
									bMeta ?  tagArr.map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') : '',
									bMeta ?  tagArr.slice(0, 2).map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
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
							const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + entryText + ' ' + _p(user), true);
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
		menu.newEntry({menuName, entryText: 'By selection: (Shift + Click to randomize)', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{func: 'retrieveSimilarArtists', args: 'v1', title: 'By similar artists (v1)'},
			{func: 'retrieveSimilarArtists', args: 'v2', title: 'By similar artists (v2)'},
			{func: 'retrieveSimilarRecordings', args: 'v1', title: 'By similar tracks'},
		].forEach((entry) =>  {
			menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const sel = fb.GetFocusItem(true);
				if (!sel) {return;}
				this.switchAnimation('ListeBrainz data retrieval', true);
				const selMbid = (entry.func === 'retrieveSimilarArtists' 
					? await lb.getArtistMBIDs(new FbMetadbHandleList(sel), token, bLookupMBIDs) 
					: await lb.getMBIDs(new FbMetadbHandleList(sel), token, bLookupMBIDs)
				)[0];
				if (!selMbid) {return;}
				const mbids = [];
				const mbidsAlt = [];
				const tags = {TITLE: [], ARTIST: [], SCORE: []};
				let count = 0;
				const user = await lb.retrieveUser(token);
				lb[entry.func](selMbid, token, entry.args)
					.then((recommendations) => {
						if (entry.func === 'retrieveSimilarArtists') { // [{artist_mbid, comment, gender, name, reference_mbid, score, type}, ...]
							recommendations.forEach((artist, i) => {
								mbids.push(artist.artist_mbid || '');
								tags.ARTIST.push(artist.name);
								tags.TITLE.push('');
								tags.SCORE.push(artist.score);
							});
							count = mbids.length;
							return lb.getPopularRecordingsByArtist(mbids.filter(Boolean), token)
								.then((artistRecommendations) => { // [{artist_mbid, count, recording_mbid}, ...]
									let cache = '';
									const selection = [];
									artistRecommendations.forEach((recording, i) => {
										if (cache !== recording.artist_mbid) {
											selection.push(recording);
											cache = recording.artist_mbid;
										} else {return;}
									});
									mbids.forEach((artist_mbid, i) => {
										const selLen = selection.length;
										mbidsAlt.push('');
										for (let j = 0;j < selLen; j++) {
											if (selection[j].artist_mbid === artist_mbid) {
												mbidsAlt[i] = selection.splice(j, 1)[0].recording_mbid;
												break;
											}
										}
									});
								})
								.then(() => {
									return lb.lookupRecordingInfoByMBIDs(mbidsAlt, ['recording_mbid', 'recording_name'], token);
								})
								.then((info) => {
									if (info) {
										for (let i = 0; i < count; i++) {
											if (mbidsAlt[i] === info.recording_mbid[i]) {
												if (info.recording_name[i]) {tags.TITLE[i] = info.recording_name[i];}
											}
										}
									}
								});
						} else { // [{recording_mbid, recording_name, artist_credit_name, [artist_credit_mbids], caa_id, caa_release_mbid, canonical_recording_mbid, score, reference_mbid}, ...]
							recommendations.forEach((recording, i) => {
								mbids.push(recording.recording_mbid || '');
								tags.TITLE.push(recording.recording_name);
								tags.ARTIST.push(recording.artist_credit_name);
								tags.SCORE.push(recording.score);
							});
							count = mbids.length;
							return true;
						}
					})
					.then(() => {
						this.switchAnimation('ListeBrainz data retrieval', false);
						const libItems = fb.GetLibraryItems();
						const notFound = [];
						let items = [];
						const sort = globQuery.remDuplBias;
						const sortTF = sort.length ? fb.TitleFormat(sort) : null;
						if (entry.func === 'retrieveSimilarArtists') { // Just add a random track from every artist
							const queryArr = mbids.map((mbid, i) => {
								const mbidAlt = mbidsAlt[i];
								const tagArr = ['ARTIST', 'TITLE']
									.map((key) => {return {key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i]))};});
								const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
								if (!tagArr[0].val.length > 0) {return;}
								if (mbidAlt) { // Get specific recordings
									const query = query_join(
										[
											(bMeta 
												? tagArr.map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ')
												: tagArr.slice(0, 1).map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ')
											) + ' AND NOT GENRE IS live AND NOT STYLE IS live',
											'MUSICBRAINZ_TRACKID IS ' + mbidAlt
										].filter(Boolean)
									, 'OR');
									return query;
								} else { // Or any track by such artist
									const query = query_join([
										query_join(
											[
												tagArr.slice(0, 1).map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live',
												'MUSICBRAINZ_ARTISTID IS ' + mbid + ' OR MUSICBRAINZ_ALBUMARTISTID IS ' + mbid
											].filter(Boolean)
										, 'OR'),
										'NOT (%RATING% IS 1 OR %RATING% IS 2)'
									], 'AND');
									return query;
								}
							}).filter(Boolean);
							items = queryArr.map((query, i) => {
								let itemHandleList;
								try {itemHandleList = fb.GetQueryItems(libItems, query);} // Sanity check
								catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
								// Filter
								if (itemHandleList.Count) {
									if (sortTF) {itemHandleList.OrderByFormat(sortTF, -1);}
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : properties.bAdvTitle[1]});
									return itemHandleList[0];
								}
								if (tags.TITLE[i].length) {
									notFound.push({creator: tags.ARTIST[i], title: tags.TITLE[i], tags:  mbidsAlt[i] ? {MUSICBRAINZ_TRACKID: mbidsAlt[i]} : {}});
								}
								return null;
							});
							// Add titles to report, since is a small amount, it's fine to iterate...
							const tfo = fb.TitleFormat('[%TITLE%]');
							items.forEach((handle, i) => {
								if (handle && tags.title[i].length === 0) {tags.TITLE[i] = tfo.EvalWithMetadb(handle) || '  \u2715  ';}
							});
						} else {
							const queryArr = mbids.map((mbid, i) => {
								const tagArr = ['TITLE', 'ARTIST']
									.map((key) => {return {key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g,'')).toLowerCase()};});
								const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
								const query = query_join(
									[
										bMeta ?  tagArr.map((tag) => {return tag.key + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
										'MUSICBRAINZ_TRACKID IS ' + mbid
									].filter(Boolean)
								, 'OR');
								return query;
							}).filter(Boolean);
							items = queryArr.map((query, i) => {
								let itemHandleList;
								try {itemHandleList = fb.GetQueryItems(libItems, query);} // Sanity check
								catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
								// Filter
								if (itemHandleList.Count) {
									if (sortTF) {itemHandleList.OrderByFormat(sortTF, -1);}
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
									itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : properties.bAdvTitle[1]});
									return itemHandleList[0];
								}
								notFound.push({creator: tags.ARTIST[i], title: tags.TITLE[i], tags: {MUSICBRAINZ_TRACKID: mbids[i]}});
								return null;
							});
						}
						const table = new Table;
						mbids.forEach((mbid, i) => {
							table.cell('Title', tags.TITLE[i]);
							table.cell('Artist', tags.ARTIST[i]);
							table.cell('MBID', mbid);
							table.cell('Score', tags.SCORE[i]);
							table.newRow();
						});
						const report = entry.title + ': ' + count + '\n\n' + table.toString();
						fb.ShowPopupMessage(report, 'ListenBrainz ' + entry.title + ' ' + _p(user));
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
						if (bShift) {items.shuffle();}
						const reference = fb.TitleFormat(entry.func === 'retrieveSimilarArtists' ? '%ARTIST%' : '%TITLE%').EvalWithMetadb(sel);
						const idx = plman.FindOrCreatePlaylist('ListenBrainz: similar to ' + reference, true);
						plman.ClearPlaylist(idx);
						plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
						plman.ActivePlaylist = idx;
					})
					.finally(() => {
						if (this.isAnimationActive('ListeBrainz data retrieval')) {this.switchAnimation('ListeBrainz data retrieval', false);}
					});
			}, flags: bListenBrainz ? selectedFlags : MF_GRAYED, data: {bDynamicMenu: true}});
		});
	}
	{
		const menuName = menu.newMenu('User recommendations...');
		menu.newEntry({menuName, entryText: 'By user: (Shift + Click to randomize)', flags: MF_GRAYED});
		menu.newEntry({menuName, entryText: 'sep'});
		[
			{params: {artist_type: 'top', count: lb.MAX_ITEMS_PER_GET}, title: 'Top artists listened'},
			{params: {artist_type: 'similar', count: lb.MAX_ITEMS_PER_GET}, title: 'Similar to artists listened'},
			{params: {artist_type: 'raw', count: lb.MAX_ITEMS_PER_GET}, title: 'Raw recommendations'},
		].forEach((entry) =>  {
			menu.newEntry({menuName, entryText: entry.title + (bListenBrainz ? '' : '\t(token not set)'), func: async () => {
				const bShift = utils.IsKeyPressed(VK_SHIFT);
				if (!await checkLBToken()) {return false;}
				const token = bListenBrainz ? lb.decryptToken({lBrainzToken: properties.lBrainzToken[1], bEncrypted}) : null;
				if (!token) {return;}
				const mbids = [];
				const tags = {TITLE: [], ARTIST: []};
				let count = 0;
				this.switchAnimation('ListeBrainz data retrieval', true);
				const user = await lb.retrieveUser(token);
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
								.map((key) => {return {key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i]))};});
							const bMeta = tagArr.every((tag) => {return tag.val.length > 0;});
							if (!bMeta) {return;}
							const query = query_join([
								bMeta ?  tagArr.map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') : '',
								bMeta ?  tagArr.slice(0, 2).map((tag) => {return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val;}).join(' AND ') + ' AND NOT GENRE IS live AND NOT STYLE IS live' : '',
								'MUSICBRAINZ_TRACKID IS ' + mbid
								].filter(Boolean)
							, 'OR');
							return query;
						}).filter(Boolean);
						const libItems = fb.GetLibraryItems();
						const notFound = [];
						const sort = globQuery.remDuplBias;
						const sortTF = sort.length ? fb.TitleFormat(sort) : null;
						const items = queryArr.map((query, i) => {
							let itemHandleList;
							try {itemHandleList = fb.GetQueryItems(libItems, query);} // Sanity check
							catch (e) {fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return;}
							// Filter
							if (itemHandleList.Count) {
								itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID']});
								itemHandleList = removeDuplicatesV2({handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle : properties.bAdvTitle[1]});
								if (sortTF) {itemHandleList.OrderByFormat(sortTF, -1);}
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
						const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + entryText + ' ' + _p(user), true);
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
							const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + entryText + ' ' + _p(user), true);
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
			this.switchAnimation('ListeBrainz following user', true);
			listenBrainz.followUser('troi-bot', token).then((result) => {
				fb.ShowPopupMessage('Daily jams are ' + (result 
					? 'enabled.\n\nDaily jams are playlists created by a ListenBrainz bot named \'troi-bot\', which sends new playlists to users every day when they follow it (already done).\n\nLook for new playlists in a day or two.' 
					: 'disabled. Try again later.'
				), 'ListenBrainz');
			}).finally(() => this.switchAnimation('ListeBrainz following user', false));
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