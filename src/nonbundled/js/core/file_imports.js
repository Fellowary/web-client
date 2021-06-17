if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){
  	
var Uppy = window.Uppy;
var CreateTorrent = window.CreateTorrent;
var fs = window.fs;

var importManager = {};

window.importManager = importManager;
}