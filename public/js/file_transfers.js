(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Uppy = window.Uppy.Uppy
const AWS = window.Uppy.AWS
const createTorrent = window.CreateTorrent.createTorrent
const FileReadStream = window.CreateTorrent.FileReadStream

var upload_batches = new Map() // this holds all of the active upload instances
var transferManager = {};
function inspectTorrent(err, torrent) {
  console.log(err)
  console.log(torrent)
}

async function initiateUpload(message, sender, sendResponse) {
  let payload = message.payload
  console.log('sender:', sender)
  console.log('payload:', payload)
  console.log(payload.circle_fingerprint)
  console.log(config)

  let opts = {
    name: payload.uploadName,
    createdBy: config.circles[payload.circle_fingerprint].user.username,
    creatorPublicKey: config.circles[payload.circle_fingerprint].user.publicKey,
    groupPublicKey: config.circles[payload.circle_fingerprint].identifier.publicKey,
    groupFingerprint: payload.circle_fingerprint,
    cert: null,
    updateType: 'append', // can be append or replace, see create-torrent/index.js
    versionNumber: 0,
    creatorMetaSignature: ``,
    chunkMinSize: config.circles[payload.circle_fingerprint].circle_config.storage.chunkSize,
  }
  //let filenames = Array.isArray(payload.files) ? payload.files.map((x) => {x}.) : [];
  console.log(payload.files)
  createTorrent(
    payload.files,
    opts,
    uploadChunks,
    (raw = true),
    (use_storage = true),
    (pass_object = { sender: sender }),
  )
  //let batch_key =
  //(upload_batches(uuid or something else, )
  //sendResponse({
  //  reason: "upload_instance_created",
  //  payload: null  //temp_manifest
  //});
}

async function uploadChunks(err, upload_instance, sender) {
  //console.log(sender);
  console.log(`creating upload structures with upload instance:`, upload_instance)
  //console.log(`torrent from upload_instance:`, await upload_instance.getItem(torrent_store, upload_instance.local_torrent_key));
  //let files = await upload_instance.getFiles();
  //console.log(files);
  //let chunks = files.map(file => file.chunks);
  //console.log(chunks);
  //let torrent = await upload_instance.getTorrent();

  initUppy(upload_instance, sender.sender)
}

async function initUppy(upload_instance, sender) {
  console.log(sender)
  console.log('******')
  //console.log(sender.sender);
  let uppy = Uppy({
    id: sender.tab.id.toString() + ':' + sender.frameId.toString(),
    autoProceed: true,
    allowMultipleUploads: true,
    debug: true,
    restrictions: {
      maxFileSize: null,
      maxNumberOfFiles: null,
      minNumberOfFiles: null,
      allowedfiledTypes: null,
    },
  })
  uppy.setState({ ram_used: 0 })
  uppy.on('upload-success', (file, response) => {
    console.log('upload success', file, response)
    uppy.setState({
      ram_used: ram_used - file.size,
    })
    uppy.removeFile(file.id)
    browser.tabs.sendMessage(upload_instance.tab_id, { reason: 'uppy', payload: payload })
    let payload = {
      piece: file.name,
      date: Date.now(),
      upload_file: upload_instance.files[file.name.split('_')[0]],
    }
    browser.runtime.sendMessage({ payload: payload })
  })
  uppy.on('upload-error', (file, error, response) => {
    console.log('error with file:', file.id)
    console.log('error message:', error)
  })

  uppy.on('file-added', file => {
    uppy.setState({ ram_used: uppy.getState().ram_used + file.size })
  })
  console.log('upload_instance circle_fingerprint', upload_instance)
  console.log('torrent', await upload_instance.getTorrent())
  console.log('config', config)
  let torrent = await upload_instance.getTorrent()
  console.log('RAW', torrent.raw)
  // This assumes the circle config requires presigned urls.  direct uploads will be supported later.
  uppy.use(AWS, {
    limit: 2,
    timeout: 60000,
    serverUrl: config.circles[torrent.raw.group_fingerprint].circle_config.storage.url,
    getUploadParameters(file) {
      // Send a request to the storage backend signing endpoint and get upload link
      return fetch(
        config.circles[torrent.raw.group_fingerprint].circle_config.storage.presign_endpoint,
        {
          method: 'post',
          // Send and receive JSON.
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.length,
          }),
        },
      )
        .then(response => {
          // Parse the JSON response.
          return response.json()
        })
        .then(data => {
          console.log('getUploadParameters response:', data)
          // Return an object in the correct shape.
          return {
            method: data.method,
            url: data.url,
            fields: data.fields,
          }
        })
        .catch(function(err) {
          setTimeout(function() {
            throw err
          })
        })
    },
  })
  processFiles(uppy, upload_instance)
}

async function processFiles(uppy, upload_instance) {
  for (let [file_index, fellowary_file] of (await upload_instance.getFiles()).entries()) {
    fellowary_file.start_date = Date.now()
    fellowary_file.processing = true
    console.log('fellowary_file', fellowary_file)
    let chunks = await fellowary_file.getChunks()
    for (let [chunk_index, chunk] of chunks.entries()) {
      while (uppy.getState().ram_used > 52428800) {
        // wait until the memory usage goes back down, oom is bad m'kay?
        await sleep(1000)
      }
      // blob is UInt8Array, convert to File type for uploading
      // we get our own extension! w00t!
      console.log("creating 'file' out of FileChunk for uploading")
      console.log(chunk)
      let array_buf = await chunk.getBlob()
      console.log('array buf', array_buf)
      let chunk_blob = new File(array_buf, `${file_index}_${chunk_index}.agg`, {
        type: 'application/octet-stream',
      })
      // uppy will start uploading as soon as the first file is added
      console.log('newly created file:', chunk_blob)
      uppy.addFile({
        name: chunk_blob.name,
        type: chunk_blob.type,
        data: chunk_blob,
      })
      let ram_used = uppy.getState().ram_used + chunk_blob.size
      uppy.setState({ ram_used: ram_used })
    }
  }
}

async function uploadFiles(payload, sender, sendResponse) {
  console.log(sender)
  sendResponse({
    reason: 'backend_script_message',
    payload: 'got upload message, this is the response.',
  })

  browser.runtime.sendMessage({ reason: 'backend_script_message', payload: 'uploadFile exited' })
  return
}




window.transferManager = transferManager;
},{}]},{},[1]);
