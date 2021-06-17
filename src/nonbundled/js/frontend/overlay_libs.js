var browser = require('webextension-polyfill');

var Uppy = window.Uppy || require('@uppy/core')
Uppy.Dashboard = Uppy.Dashboard || require('@uppy/dashboard')

var videojs = window.videojs || require('video.js')

window.browser = browser;
window.Uppy = Uppy
window.VideoJS = videojs
