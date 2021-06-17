(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var SM = window.storageManager;
var IM = window.importManager;
var EM = window.exportManager;
var TM = window.transferManager;

var fm = {};

fm.saveConfig = async function(path, password, changeData){

};

//fm.importFile = IM.importFile; // function

//fm.exportFile = EM.exportFile; // generator function

//fm.open = SM.openFile;

//fm.mkdir = SM.mkdir;

//fm.copyFile = SM.copy;

//fm.delete = SM.deleteFile;

//fm.retrieve = TM.retrieveFile;

window.fileManager = fm;
}
},{}]},{},[1]);
