if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var Uppy = window.Uppy || {};
var CreateTorrent = window.CreateTorrent || {};
// var localforage = window.localforage || {};
var Dexie = window.dexie || {};
var browser = window.browser || {};
var path = window.path || {};
var comlink = window.comlink || {};
var names = window.names || {};
var makeBlockie = window.makeBlockie || {};
var anyBase = window.anyBase || {};
var validator = window.validator || {};
var base2048 = window.base2048 || {};
var base65536 = window.base65536 || {};
//var _sodium = window._sodium || {};

Uppy.Uppy = require('@uppy/core');
Uppy.AWS = require('@uppy/aws-s3');
CreateTorrent = require('create-torrent');
//localforage = require('localforage');
Dexie = require('dexie');
// window.isSafari = navigator.userAgent.indexOf("Safari") !== -1;

// safari doesn't support a pretty important feature right now
function temporarySafariCheck() {
	let num = new Uint8Array(8);
	let dv = new DataView(num.buffer);
	if(dv.getBigUint64){
		window.isSafari = false;
	}
	else{
		window.isSafari = true;
	}
}

temporarySafariCheck();


if (!window.isSafari && typeof chrome  !== 'undefined' && window.chrome.tabs || browser.tabs){
	console.log("we are in an extension");
	browser = require('webextension-polyfill');
}
else{
	console.log("it's a website, no browser api");

	browser = undefined;
}
path = require("path");
// comlink = require('comlink/dist/umd/comlink.js');
Comlink = comlink = require('comlink/dist/umd/comlink.js');
makeBlockie = require("ethereum-blockies-base64");
names = require('./names.json');
anyBase = require('any-base');
validator = require('validator');
base2048 = require('base2048');
base65536= require('base65536');
//_sodium = require('libsodium-wrappers');
window.sodiumReady = new Promise((resolve, reject) => {
	window.sodium = {
		onload: function(sodium) {
			console.log("SODIUM LOADED");
			window.sodium = sodium;
			resolve(true);
			window.sodiumReady = true;
		}
	};
});

// window.sodium = {
//     onload: function (sodium) {
//         window.sodium = sodium;	
//     }
// };



window.Uppy = Uppy;
window.CreateTorrent = CreateTorrent;
//window.localforage = localforage;
window.Dexie = Dexie;
window.browser = browser;
window.path = path;
window.comlink = comlink;
window.Comlink = Comlink;
window.makeBlockie = makeBlockie;
window.names = names;
window.anyBase = anyBase;
window.validator = validator;
window.base2048 = base2048;
window.base65536 = base65536;
//window._sodium = _sodium;

}