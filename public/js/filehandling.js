!function e(r,a,n){function t(i,c){if(!a[i]){if(!r[i]){var l="function"==typeof require&&require;if(!c&&l)return l(i,!0);if(o)return o(i,!0);var f=new Error("Cannot find module '"+i+"'");throw f.code="MODULE_NOT_FOUND",f}var s=a[i]={exports:{}};r[i][0].call(s.exports,function(e){return t(r[i][1][e]||e)},s,s.exports,e,r,a,n)}return a[i].exports}for(var o="function"==typeof require&&require,i=0;i<n.length;i++)t(n[i]);return t}({1:[function(e,r,a){window.Uppy.Uppy,window.Uppy.AWS,window.CreateTorrent.createTorrent,window.CreateTorrent.FileReadStream,new Map,async function(){localforage.createInstance({name:"Fellowary",driver:localforage.INDEXEDDB,storeName:"uploads"}),localforage.createInstance({name:"Fellowary",driver:localforage.INDEXEDDB,storeName:"torrents"}),localforage.createInstance({name:"Fellowary",driver:localforage.INDEXEDDB,storeName:"file_chunks"});var e=localforage.createInstance({name:"Fellowary",driver:localforage.INDEXEDDB,storeName:"files"});localforage.createInstance({name:"Fellowary",driver:localforage.INDEXEDDB,storeName:"torrents"});let r=(new TextEncoder).encode("TESTESTESTYEEEEAAAAAH");await e.setItem("test",r),await e.getItem("test")}()},{}]},{},[1]);