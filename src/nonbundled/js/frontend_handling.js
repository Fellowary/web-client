var browser = require('webextension-polyfill');
var videojs = require('video.js')

var templateUrl = browser.runtime.getURL('templates/overlay.html');
var vidhtml = `
    <video
    id="my-player"
    class="video-js vim-css"
    controls
    preload="auto"
    poster="//vjs.zencdn.net/v/oceans.png"
    data-setup='{}'>
      <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4"></source>
      <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm"></source>
      <source src="//vjs.zencdn.net/v/oceans.ogv" type="video/ogg"></source>
      <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a
    web browser that
    <a href="http://videojs.com/html5-video-support/" target="_blank">
          supports HTML5 video
    </a>
      </p>
    </video>`;

console.log('frontend start');

var upload_frame = {
  //  url: browser.runtime.getURL('templates/uploads.html'),
  //url: browser.runtime.getURL('./index.html#/apps/mail'),
  url: templateUrl,
  top: (window.innerHeight - window.innerHeight * 0.8) / 2,
  left: (window.innerWidth - window.innerWidth * 0.5) / 2,
  height: 80,
  width: 50,
};
console.log('frontend 1');

var fellowary_frame_id = Math.floor(Math.random() * 10000000).toString();
var fellowary_frame = null;
upload_frame.iframe = `<iframe id="${fellowary_frame_id}"
                      src="${upload_frame.url}" 
                      frameborder="0" 
                      style="width: 100%; height: 100%;
                      z-index: 2147483647;
                      position: fixed;"></iframe>`;

async function handleMessage(message, sender, sendResponse) {
  console.log('got message');
  switch (message['reason']) {
    case 'TOGGLE_OVERLAY':
      console.log('got inject_upload message')
      browser.runtime.sendMessage({
        reason: 'content_script_message',
        payload: 'got content script message',
      })
      if (!fellowary_frame) {
        document.body.insertAdjacentHTML('beforebegin', upload_frame.iframe)
        fellowary_frame = document.getElementById(fellowary_frame_id)
      } else if (fellowary_frame.style.display == 'none') {
        fellowary_frame.style.display = 'inline';
      } else {
        fellowary_frame.style.display = 'none';
      }
      break;
  }
}

browser.runtime.onMessage.addListener(handleMessage);

document.body.addEventListener('click', () => {
  console.log('got a click')
  document.body.insertAdjacentHTML('after  begin', upload_frame.iframe)
  browser.runtime.sendMessage({
    reason: 'content_script_message',
    payload: 'want to get background',
  })
});

console.log('url: ', location.href);

