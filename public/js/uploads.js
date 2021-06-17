(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Uppy = window.Uppy
const Dashboard = window.Uppy.Dashboard

Dashboard.log = console.log
function getUserUploadOptions() {
  return {}
}

function uploaInitiated(message) {
  console.log(message)
  console.log('backend is now creating the torrent')
  return false
}

function uploadInitiationFailed(error) {
  console.log(error)
  return false
}
function clearNode(inode) {
  while (inode.firstChild) {
    inode.removeChild(inode.firstchild)
  }
}
var file_set = new Set() // File object later

function initiateUpload(files) {
  let o = document.getElementById('circle_dropdown')
  let sending = browser.runtime.sendMessage({
    reason: 'initiate_upload',
    payload: {
      uploadName: 'testname',
      circle_fingerprint: o.options[o.selectedIndex].value.split(':')[0],
      user_fingerprint: o.options[o.selectedIndex].value.split(':')[1],
      files: Array.from(file_set),
      uploadOptions: getUserUploadOptions(),
    },
  })
  return sending.then(uploadInitiated, uploadInitiationFailed)
}

async function load_circle_select(payload) {
  console.log('in gotCircles payload')
  //console.log(payload);
  let c_drops = document.getElementById('circle_dropdown')
  clearNode(c_drops)
  let circles = ''
  for (let circle of payload) {
    console.log('adding circle to options')
    console.log(circle)
    circles += `<option class="${circle.is_primary ? `primary_circle` : `non-primary_circle`}"
                value="${circle.circle_key}:${circle.user_key}">
                circle: ${circle.circle_name}-${circle.circle_key},
                user: ${circle.user_name}-${circle.user_key}
                </option>`
  }
  c_drops.insertAdjacentHTML('beforeend', circles)
}

function nocircles(error) {
  console.log("can't upload, no circles to upload to")
  console.log(errror)
}

function openDashboard() {
  console.log('in openDashboard')
  const uppy = Uppy({
    debug: true,
    meta: {
      username: 'John',
      license: 'Creative Commons',
    },
    onBeforeUpload: files => {
      return initiateUpload(files) // This creates a torrent.  Lots of stuff gets kicked off here
    },
  })
  console.log('before use dashboard')
  uppy.use(Dashboard, {
    inline: true,
    target: '#fellowary_middle',
    metaFields: [
      { id: 'license', name: 'License', placeholder: 'specify license' },
      { id: 'caption', name: 'Caption', placeholder: 'add caption' },
    ],
    showProgressDetails: true,
    proudlyDisplayPoweredByUppy: true,
    note: '2 files, images and video only',
  })
  console.log('after use dashboard')
  //.use(GoogleDrive, { target: Dashboard, serverUrl: 'https://localhost:8887/upload' })
  //.use(Dropbox, { target: Dashboard, serverUrl: 'http://localhost:8887/upload' })
  //.use(Url, { target: Dashboard, serverUrl: 'http://localhost:8887/upload' });
  uppy.on('complete', result => {
    if (result.failed.length === 0) {
      console.log('Upload successful 😀')
    } else {
      console.warn('Upload failed 😞')
    }
    console.log('successful files:', result.successful)
    console.log('failed files:', result.failed)
  })
  console.log('before file-added')
  uppy.on('file-added', file => {
    console.log('Added file', file)
    file_set.add(file.data) // file object that will be sent back
  })
  uppy.on('file-removed', file => {
    console.log('Removed file', file)
    file_set.delete(file)
  })
  uppy.getPlugin('Dashboard').openModal()
}

function init() {
  console.log('initializing the overlay')

  //let things = browser.runtime.getBackgroundPage();
  //things.then((page)=>{console.log(page)});
  let css_links = `
	    <link href='${location.origin}/css/overlay.css' type='text/css' rel='stylesheet' />
	    <link href='${location.origin}/css/uploads.css' type='text/css' rel='stylesheet' />
	    `
  document.head.insertAdjacentHTML('beforeend', css_links)
  console.log('after head insert')
  let elements = document.getElementsByClassName('interactable')
  console.log('after classname')
  let el = document.getElementById('agg_bottom')
  console.log('after id get')

  for (let i = 0; i < elements.length; i++) {
    console.log(elements[i])
  }
  console.log('after element loop')

  let get_circle_list = browser.runtime.sendMessage({
    reason: 'get_circles_and_users',
  })
  get_circle_list.then(load_circle_select, nocircles)
  console.log('before opendashboard')

  openDashboard()
  //browser.runtime.sendMessage({
  //	reason: "content_script_message",
  //	payload: document
  //});
  //openDashboard();
}

init()

},{}]},{},[1]);
