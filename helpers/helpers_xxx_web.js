'use strict';
//09/09/22

function getText(link){
	if (link.indexOf('http://') !== -1 || link.indexOf('https://') !== -1) {
		let request = new ActiveXObject('Microsoft.XMLHTTP');
		request.open('GET', link, true);
		request.send();
		request.onreadystatechange = function () {
			if (request.readyState === 4) {
				if (request.status === 200) {
					var type = request.getResponseHeader('Content-Type');
					if (type.indexOf("text") !== 1) {
						return request.responseText;
					}
				} else {console.log('HTTP error: ' + request.status);}
			}
		}
	} else {console.log('getText(): input is not a link. ' + link); return null;}
}

function onStateChange(timer, resolve, reject, func = null) {
	if (this !== null && timer !== null) { // this is xmlhttp bound
		if (this.readyState === 4) {
			clearTimeout(timer); timer = null;
			if (this.status === 200) {
				if (func) {return func(this.responseText);}
				else {resolve(this.responseText);}
				
			} else {
				// console.log('HTTP error: ' + this.status);
				// console.log(this.responseText);
				if (!func) {reject({status: this.status, responseText: this.responseText});}
			}
		}
	} else if (!func) {reject({status: 408, responseText: this.responseText})}; // 408 Request Timeout
	return null;
}

// May be used to async run a func for the response or as promise
function send({method = 'GET', URL, body = void(0), func = null, requestHeader = [/*[header, type]*/]}) {
	const p = new Promise((resolve, reject) => {
		let timer = null;
		const xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
		xmlhttp.open(method, URL);
		requestHeader.forEach((pair) => {
			if (!pair[0] || !pair[1]) {console.log('HTTP Headers missing: ' + pair); return;}
			xmlhttp.setRequestHeader(...pair);
		});
		timer = setTimeout((xmlhttp) => {
			xmlhttp.abort();
			timer = null;
			if (!func) {reject({status: this.status, responseText: ''});} // 408 Request Timeout
		}, 30000, xmlhttp);
		xmlhttp.onreadystatechange = onStateChange.bind(xmlhttp, timer, resolve, reject, func);
		xmlhttp.send(method === 'POST' ? body : void(0));
	});
	return p;
}