(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var log = console.log;
var error = console.error;
var warn = console.warn;
window.log = log;

// TEST FLAG, SET TO FALSE FOR PRODUCTION
window.testing = true;

var earliestDate = new Date(-5752494000000);
window.earliestDate = earliestDate;
var db = new Dexie('fellowary');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

db.version(1).stores({
  logins: "&filepath",
  histories: "&filepath",
  users: "&filepath",
  identities: "&filepath",
  messages: "&filepath",
  messageStreamData: "&filepath",
  conversations: "&filepath",
  circles: "&filepath",
  personae: "&filepath",
  personaeStructs: "&filepath",
  configs: "&filepath",
  pages: "&filepath",
  torrents: "&filepath",
  directories: "&filepath",
  files: "&filepath",
  circledata: "&filepath",
  chunks: "&filepath",
  blobs: "&filepath"
});

async function initStoragePersistence(){
  if (window.isSafari){
    // This could be wrong, just avoding errors for now.
    // log("safari does not support checking storage values.");
    return;
  }
  let isPersisting = await navigator.storage.persist();
  let {quota, usage} = await navigator.storage.estimate();
  // log("Is the storage persistent?", isPersisting);
  // log(`percentage of storage used: ${(usage/1024/1024).toFixed(3)} MB or ${usage/quota}% of ${quota/1024/1024} MB`);
}
window.initStoragePersistence = initStoragePersistence;

db.open().catch (function (err) {
    console.error('Failed to open db: ' + (err.stack || err));
});

// var upload_store = localforage.createInstance({
//   name: 'fellowary-old',
//   driver: localforage.INDEXEDDB,
//   storeName: 'uploads',
// })
// var torrent_store = localforage.createInstance({
//   name: 'fellowary-old',
//   driver: localforage.INDEXEDDB,
//   storeName: 'torrents',
// })
// var chunk_store = localforage.createInstance({
//   name: 'fellowary-old',
//   driver: localforage.INDEXEDDB,
//   storeName: 'file_chunks',
// })
// // long term file storage, needed because os security is a bitch, seriously, wtf.
// var blob_store = localforage.createInstance({
//   name: 'fellowary-old',
//   driver: localforage.INDEXEDDB,
//   storeName: 'chunk_blobs',
// })
// var file_store = localforage.createInstance({
//   name: 'fellowary-old',
//   driver: localforage.INDEXEDDB,
//   storeName: 'files',
// })

function genpass() {
  return ([1e9] + 1e9 + 1e14).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  )
}

function genname() {
  return ([1e9] + 1e9).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  )
}


class Settings {
  // TODO: circle settings that dictate how services and files are managed
  constructor(upload_types) {}
}

class StoredObject {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async getUniqueStorageID() {
    let fileKey;
    do{
      fileKey = sodium.randombytes_buf(16);
      fileKey = sodium.to_base64(fileKey, sodium.base64_variants.URLSAFE_NO_PADDING);
    }
    while(fileKey !== await window.db[this.store].add({filepath: fileKey, data: 'reserved'}).catch((e)=>{return null;})); // we're dealing with dexie tables here
    return fileKey;
  }

  static async getUniqueStorageIDBulk(idCount) {
    // log(`getUniqueStorageIDBulk number of uniqueIds being generated: ${idCount}`);
    let fileKeys = [];
    for(let i=0;i<idCount;++i){
      fileKeys.push({filepath: sodium.to_base64(sodium.randombytes_buf(16), sodium.base64_variants.URLSAFE_NO_PADDING), data: 'reserved'});
    }
    let newFileKeys = fileKeys;
    let goodFileKeys = [];
    let killCheck = 0;
    while(goodFileKeys.length < idCount && killCheck++ < 5){
      let lastKey = newFileKeys[newFileKeys.length-1].filepath;

      // bulkAdd will return the last primarykey if the entire thing was successful
      // otherwise we get a BulkError.  If this function doesn't work you will want to check and make sure
      // that you have the proper version of dexie.  3.1.0 is required for the failuresByPos.  using alpha v9 in order to get this.
      let result = await window.db[this.store].bulkAdd(newFileKeys).catch('BulkError', err => {return err;});
      // if they're all good we can just add them.
      if(result === lastKey){
        // console.log(`getUniqueStorageIDBulk success - result: ${result}`);
        goodFileKeys = goodFileKeys.concat(newFileKeys);
      }
      else{
        console.error(`getUniqueStorageIDBulk failure - `, result);
        // if some are bad, add the good ones
        for(let i=0;i<newFileKeys.length;++i){
          if(!(i in result.failuresByPos)){
            goodFileKeys.push(newFileKeys[i]);
          }
        }

        // get replacements for the bad ones
        newFileKeys = [];
        for(let i=0; i < result.failures.length;++i){
          newFileKeys.push({filepath: sodium.to_base64(sodium.randombytes_buf(16), sodium.base64_variants.URLSAFE_NO_PADDING), data: 'reserved'}); 
        }
      }
    }

    // log("getUniqueStorageIDBulk - goodFileKeys", goodFileKeys);
    return goodFileKeys.map(x => {return x.filepath;});
  }

  static async  getUniqueStorageID() {
    let fileKey;
    do{
      fileKey = sodium.randombytes_buf(16);
      fileKey = sodium.to_base64(fileKey, sodium.base64_variants.URLSAFE_NO_PADDING);
    }
    while(fileKey !== await window.db[this.store].add({filepath: fileKey, data: 'reserved'}).catch((e)=>{return null;}));
    return fileKey;
  }

  async getItem(store = this.store, local_key = this.local_key, bytes_only = false) {
    let local_bytes_enc = await store.getItem(local_key)
    let local_bytes = await decryptWithPassword(local_bytes_enc, config.local_password)
    if (bytes_only) {
      // console.log('returning bytes only', local_bytes)
      // console.log('local_bytes_enc', local_bytes_enc)
      return local_bytes
    }
    return getObject(local_bytes)
  }

  async setItem(store = this.store, local_key = this.local_key) {
    // console.log('****Setting Item****')
    // console.log(this.store)
    // console.log(local_key)
    if (this.blob) {
      // IT'S A CHUNK BLOB
      // console.log('****Setting Blob****')
      let save_item = this
      // console.log('this.blob', this.blob)
      let blob = await encryptWithPassword(this.blob, config.local_password)
      // console.log('blob', blob)
      await store.setItem(this.local_key, blob)
    } else {
      let enc_bytes = await encryptWithPassword(getBytes(this), config.local_password)
      // console.log('********')
      await store.setItem(this.local_key, enc_bytes)
    }
  }

  get path(){
    utils.unparse(this.filePath);
  }

  async save(store = window.db[this.store], filePath = this.filePath){
    if(filePath === undefined){
      // log(`creating ${this.typeName} @ a new filepath`);
      filePath = this.filePath = await this.getUniqueStorageID();
      // log("unique storage id", this.filePath);
    }
    // log("logging this object in save:", this);
    let encryptedBytes = await salty.encryptWithPassword(utils.objectToBytes(this), window.user.localPassword);
    // log(`saving Stored Object: ${this.typeName} @ ${typeof(filePath) == 'string'? filePath : utils.unparse(filePath)}`);
    await store.put({filepath: filePath, data: encryptedBytes});
    
    // log(`successfully saved Stored Object: ${this.typeName} @ ${typeof(filePath) == 'string'? filePath : utils.unparse(filePath)}`);
    return this;
  }

  static async storedObjectBulkSave(objects = []){
    // let perftime = performance.now();
    let store = window.db[this.store];
    // log(`bulk saving ${this.typeName} objects`, store, objects);
    let encryptedObjects = [];
    let encryptionPromises = [];
    let missingIDIndexes = [];

    // get the indexes of the objects that are missing a filepath
    for(let i=0;i<objects.length;++i){
      if(objects[i].filePath === undefined){
        missingIDIndexes.push(i);
      }
    }

    // log(`storedObjectBulkSave objects sample before assign - ob1: ${objects[0]? objects[0].filePath: ''}, ob2: ${objects[1]? objects[1].filePath: ''}`);
    // get enough unqiue ids for all of them.
    let uniqueStorageIDs = await this.getUniqueStorageIDBulk(missingIDIndexes.length);


    // add the filepaths to the objects that are missing them
    for(let i=0;i<missingIDIndexes.length;++i){
      // log("storedObjectBulkSave asigning id to object", uniqueStorageIDs[i]);
      objects[missingIDIndexes[i]].filePath = uniqueStorageIDs[i];
      //encryptionPromises.push(salty.encryptWithPassword(utils.objectToBytes(objects[i]), window.user.localPassword));
    }

    // log(`storedObjectBulkSave objects sample after assign - ob1: ${objects[0]? objects[0].filePath: ''}, ob2: ${objects[1]? objects[1].filePath: ''}`);


    // set up the encryption promises for all of the objects
    // this is not set up in the previous loops because
    // I want the promises to be in the exact same order as the input objects
    for(let i=0;i<objects.length;++i){
      encryptionPromises.push(salty.encryptWithPassword(utils.objectToBytes(objects[i]), window.user.localPassword));
    }


    ////


    // for(let i=0;i<objects.length;++i){
    //   if(objects[i].filePath === undefined){
    //     objects[i].filePath = await this.getUniqueStorageID();
    //   }
    //   log(`storedObjectBulkSave perftime loop iteration: ${performance.now() - perftime}`);

    //   encryptionPromises.push(salty.encryptWithPassword(utils.objectToBytes(objects[i]), window.user.localPassword));
    // }

    ////
    // log(`storedObjectBulkSave perftime first loop: ${performance.now() - perftime}`);

    for(let i=0;i<encryptionPromises.length;++i){
      encryptedObjects.push({filepath: objects[i].filePath, data: await encryptionPromises[i]});
    }
    // log(`storedObjectBulkSave perftime second loop: ${performance.now() - perftime}`);

    let filePaths = encryptedObjects.map((ob)=>{return ob.filePath});
    // log(`storedObjectBulkSave perftime ecryptedObjects.map: ${performance.now() - perftime}`, encryptedObjects);

    await store.bulkPut(encryptedObjects);
    // log(`storedObjectBulkSave perftime bulk put: ${performance.now() - perftime}`);

    // log(`successfully bulk saved Stored Objects: ${this.typeName} @`, filePaths);

    return objects;
  }

  static async load(filePath){
    let fp = typeof(filePath) == 'object'? filePath : new Array();
    if (typeof(filePath) == "string"){
      utils.parse(filePath, buf);
    }
    let localFile = (await window.db[this.store].get({filepath: fp}));
    if (localFile === undefined){
      return localFile;
    }
    let localBytesEncrypted = localFile.data;
    // log("before window.user print");
    // log("window.user is this", window.user);
    let localBytes = await salty.decryptWithPassword(localBytesEncrypted, window.user.localPassword);
    if (this.typeName == 'chunkBlob'){
      return localBytes;
    }
    return utils.bytesToObject(localBytes);
  }

  static get store() {
    throw 'Calling unimplemented get store';
  }

  async load(storageFilePath){
    let localFile = (await window.db[this.store].get({filepath: storageFilePath}));
    if (localFile === undefined){
      return false;
    }
    let localBytesEncrypted = localFile.data;
    // log("loading localFile", localFile);
    let localBytes = await salty.decryptWithPassword(localBytesEncrypted, window.user.localPassword);
    Object.assign(this, utils.bytesToObject(localBytes));
    if (this.filePath){
      return true;
    }
    return false;
  }

  static async storedObjectBulkLoadAll(){
    let localFiles = await window.db[this.store].toArray();

    let decrypting = [];
    // spin up threaded decryption
    //log("before threaded decryption");
    for (let i=0;i < localFiles.length;++i){
        if (localFiles[i] !== undefined){
          decrypting[i] = salty.decryptWithPassword(localFiles[i].data, window.user.localPassword);
        }
    }
    let classInstances = [];
    // let all promises resolve
    for(let i=0;i< decrypting.length;++i){
      if (decrypting[i] !== undefined){
        //log("trying to log typename, ", this.typeName);
        let classInstance = new this();
        //log("class instance", classInstance);
        Object.assign(classInstance, utils.bytesToObject((await decrypting[i])));
        classInstances[i] = classInstance;
      }
    }
    
    return classInstances;
  }

  static async storedObjectBulkLoad(storageFilePaths){
    if (!storageFilePaths || storageFilePaths.length === 0){return [];}
    let localFiles = await window.db[this.store].bulkGet(storageFilePaths);

    let decrypting = [];
    // spin up threaded decryption
    // log("before threaded decryption");
    for (let i=0;i < localFiles.length;++i){
        if (localFiles[i] !== undefined){
          decrypting[i] = salty.decryptWithPassword(localFiles[i].data, window.user.localPassword);
        }
    }
    let classInstances = [];
    // let all promises resolve
    for(let i=0;i< decrypting.length;++i){
      if (decrypting[i] !== undefined){
        //log("trying to log typename, ", this.typeName);
        let classInstance = new this();
        //log("class instance", classInstance);
        Object.assign(classInstance, utils.bytesToObject((await decrypting[i])));
        classInstances[i] = classInstance;
      }
    }
    
    return classInstances;
  }

  static async storedObjectDelete(storageFilePath){
    // log("deleting local file from store:", this.store, storageFilePath);
    await window.db[this.store].delete(storageFilePath);
  }

  static async storedObjectBulkDelete(storageFilePaths){
    // log("bulk deleting local files for store:", this.store, storageFilePaths);
    await window.db[this.store].bulkDelete(storageFilePaths);
  }

  static async getItem(local_key) {
    let local_bytes_enc = await this.store.getItem(local_key)
    let local_bytes = await decryptWithPassword(local_bytes_enc, config.local_password)
    return getObject(local_bytes)
  }
}

// basic config, different from circle_config, necessary for everything else.  Email is optional, idgaf
class Config extends StoredObject {
  constructor(
    password = false,
  ) {
    super();
    // the user never needs to know this password, 
    // this is the password for everything stored to disk
    this.typeName = "Config";
    this.store = 'configs';
  }

  static async load(inFilePath){
    // log("in config load");
    // log("infilepath", inFilePath);
    let config = new Config();
    let loaded = await config.load(inFilePath);
    // log("checking config load", loaded);
    if (loaded)
      return config;
    return false;
  }

  static get store() {
    return 'configs';
  }
}

var default_circle_settings = {
  autoConnect: true,
};

var default_circle_config = {
  core: {
    url: "https://fellowary.com",
    testUrl: "https://fellowary.local:3000"
  },
  storage: {
      url: "https://files.fellowary.com",
      testUrl: "https://files.fellowary.local:3002",
      presign_endpoint: "https://files.fellowary.com/upload_info",
      method: "presigned", // upload methods are presigned (s3 v4)
      chunkSize: 5242880,
      publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  },
  verifier: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI",
    things: "test"
  },
  messageHub: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  },
  keyHub:{
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  },
  amalgamator: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  }, 
  searchHub: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  },
  key_store: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  },
  link_watcher: {
    url: "https://api.fellowary.com",
    testUrl: "https://api.fellowary.local:3002",
    publicKey: "WbdKQ3tqn3qr716Q9s34s3lmfssM0K6dz2h-uCQLcAUITHpq47SwXsEuY2eSGUsbNCp4f03jWdX_xA-LD1hBAcGJEChKQyW59OG4uTqmuEsRQT2VjbrriqNsweMsU1_sWgQsyh3gwK3wGBqGsseJsq2n8GgzojjQwhCF_Rsil3ABb3duZXI"
  }
};

window.default_circle_config = utils.prodOrTestCircleConfig(default_circle_config);


class PageHistory extends StoredObject {
  // this thing exists soley to keep track of the last page the user was on.
  // it can be expanded later but because this would happen on a per user basis
  // i don't want to have to save the user every time the user navigates to a new page
  // as of right now this is the simplest example of using a StoredObject.
  constructor(
    filePath=undefined,
    url=''
  ){
    super(filePath=filePath);
    this.typeName = "PageHistory";
    this.url = url;
    this.store = 'pages'
  }

  static get store(){
    return 'pages';
  }

  static get typeName(){
    return 'PageHistory';
  }

  static async load(inFilePath){
    // log("pageHistory load infilepath", inFilePath);
    let pageHistory = new PageHistory(inFilePath);
    // log("loading pageHistory", pageHistory);
    let loaded = await pageHistory.load(inFilePath);
    // log("checking pageHistory load", loaded);
    if (loaded)
      return pageHistory;
    return false;
  }
}

class User extends StoredObject {
  constructor(
    filePath = '',
    usersConfig = '',
    username = '',
    internalUsername = '',
    primaryIdentity = 'UUIDPlaceHolder',
    identities = [],
    circles = [],
    personae = [],
    inPersonaeStructs = [],
    homeDirectory = 'UUIDPlaceHolder',
    publicKey = '',
    privateKey = '',
    fingerprint = '',
    avatar = 'base64 img src of fingerprint', // 
    localPassword = 'password'
  ) {
    super();
    // log("primaryIdentity = **************", primaryIdentity, internalUsername, identities);
    this.typeName = "User";
    this.default_circle_config = default_circle_config;
    this.default_circle_settings = default_circle_settings;
    this.filePath = filePath;
    this.config = usersConfig;
    this.username = username;
    this.internalUsername = internalUsername;
    this.identities = identities;
    this.circles = circles;
    // Unlike Identity and Circle personae here is not a PersonaeStruct.
    // It's a list of Persona filePaths
    // This is bulk loaded at the start of the program
    this.personae = personae;
    // list of personae filepaths
    this.personaeStructs = inPersonaeStructs;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.fingerprint = fingerprint;
    this.avatar = avatar;
    this.primaryIdentity = primaryIdentity;
    this.homeDirectory = homeDirectory;
    this.state = {};
    this.state.currentDirectory = null;
    this.state.directoryStack = [homeDirectory];
    this.state.savedDirectories = [];
    this.state.currentIdentity = '';
    this.currentPage = '';
    this.localPassword = localPassword;
    this.messageStreams = []; // this stores Objects with MessageStream data in them.  they need to be recreated so I'd rather not save the MessageStream itself as a StoredObject
    this.store = 'users';
  }

  getPrimaryIdentity(){
    return window.identities[this.primaryIdentity];
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let user = new User(inFilePath);
    // log("loading user", user);
    let loaded = await user.load(inFilePath);
    // log("checking user load", loaded);
    if (loaded)
      return user;
    return false;
  }

  async save(){
    // save personae while being really sure that the personae filePath is valid
    this.personae = [];
    for(let filePath in window.personae){
      this.personae.push(window.personae[filePath].filePath);
    }
    // save personaeStructs validating the filePath
    this.personaeStructs = []; //Object.keys(window.personaeStructs);
    for(let filePath in window.personaeStructs){
      this.personaeStructs.push(window.personaeStructs[filePath].filePath);
    }


    // log("saving user:", window.personae, this.personae, window.personaeStructs, this.personaeStructs);
    return super.save();
  }

  static get store() {
    return 'users';
  }


  async getInvite(inviteUrl){
    // log("Identity processInvite inviteUrl", inviteUrl);
    let result = {status: "failure"};
    // get the invite hash
    let splitUrl = inviteUrl.split('/');
    let linkHash = splitUrl[2];
    if (linkHash.length < 21){
      // log("Identity processInvite the linkHash was too short", splitUrl);
      return result;
    }

    // log("Identity processInvite before request");
    
    // looks like we have a good enough linkHash, lets request the link from the server
    let response = await external.makeRequest(
      "GET",
      `${this.getPrimaryIdentity().getPrimaryCircle().config.keyHub.url}/links/${linkHash}`,
    );

    // log("Identity processInvite response", response);


    // create the frontend payload for success or failure modes.
    let payload = {
      reason: "invite",
      status: "failed",
      inviteUrl
    };

    // make sure the invite payload is there
    if (!response.link) {
      error('the response does not have a link to process', response);
      return result;
    }

    //let internalLinkHash = await salty.hashToBytes16(response.link);
    let internalLinkHash = await salty.hashToBase5816(response.link);
    if (internalLinkHash != linkHash){
      error("internalLinkHash is not equal to the invite linkhash", internalLinkHash, linkHash);
      return result;
    }

    // validate the payload
    let linkObject = JSON.parse(response.link);
    if (!validate.link(linkObject)) {
      error("unable to validate the linkObject");
      return result;
    }

    // get the sigil objects which contain public keys, vouchers and vouchees
    let sigils = linkObject.sigils;

    let sigilPromises = [];
    let sigilBlobs = [];
    for(let i=0;i<sigils.length;++i){
      sigilPromises[i] = salty.readSigil(sigils[i]).then((sigilBlob) => {sigilBlobs[i] = sigilBlob;});
    }

    // we're using all settled here because verify check just below will handle any errors.
    let sigilResults = await Promise.allSettled(sigilPromises);
    // log("sigilResults", sigilResults);


    // this throws on errors
    try {
      // make sure the permission chain has all the keys and the permnissions have valid dates and has the correct permissions
      Conversation.verifyLink(sigilBlobs, ["message"], new Date());
    }
    catch(err){
      // something's wrong with the chain, th so we need to check for an update.  For now we're just going to fail out
      // because it's a safe assumption that the sigils are set to never expire.
      // when we're in a better dev spot we should send a message out for new permissions
      error(err)
      return result;
    }

    // get the individual pieces for asking the user what they want to do with this invite.
    // prepare the keypairs
    let circleKeyPair = {publicKey: sigilBlobs[0].voucher};
    let adminKeyPair = {publicKey: sigilBlobs[0].vouchee};
    let verifierKeyPair = linkObject.keys; // {publicKey, privateKey}

    // get the fingerprints
    let [
      circleFingerprint,
      adminFingerprint,
      verifierFingerprint
    ] = (await Promise.allSettled([
      salty.getFingerprint(circleKeyPair.publicKey),
      salty.getFingerprint(adminKeyPair.publicKey),
      salty.getFingerprint(verifierKeyPair.publicKey)
    ])).map(x => {return x.value;});

    // get the names
    let [
      circleName,
      adminName,
      verifierName
    ] = (await Promise.allSettled([
      salty.getPublicKeyName(circleKeyPair.publicKey),
      salty.getPublicKeyName(adminKeyPair.publicKey),
      salty.getPublicKeyName(verifierKeyPair.publicKey)
    ])).map(x => {return x.value;});

    // get the avatars.
    let [
      circleAvatar,
      adminAvatar,
      verifierAvatar
    ] = (await Promise.allSettled([
      utils.getIdenticon(circleFingerprint),
      utils.getIdenticon(adminFingerprint),
      utils.getIdenticon(verifierFingerprint)
    ])).map(x => {return x.value.src;});


    // package all of the information for the user to view
    result.currentInvitation = {
      inviteUrl,
      circle: {
        avatar: circleAvatar,
        fingerprint: circleFingerprint,
        name: circleName,
      },
      admin: {
        avatar: adminAvatar,
        fingerprint: adminFingerprint,
        name: adminName,
      },
      conversation: {
        avatar: verifierAvatar,
        fingerprint: verifierFingerprint,
        name: verifierName,
      }
    };

    // we will process a portion of this function again but holding the linkObject is
    // simplest checkpoint to save for accepting or rejecting an invite
    window.invites[`${inviteUrl}`] = linkObject;
    
    result.status = "success";
    return result;
  }

  async setDefaultPage(){
    let defaultPath = `#/social/identity/${this.getPrimaryIdentity().fingerprint}/circle/${this.getPrimaryIdentity().getPrimaryCircle().fingerprint}`;
    return this.setCurrentPage(defaultPath);
  }

  async setCurrentPage(url){
    log("User setCurrentPage", url);
    // if current page exists, set it and go.
    if(window.currentPage){
      log("currentPage exists, setting it and returning false", window.currentPage);
      window.currentPage.url = url;
      window.currentPage = await window.currentPage.save(); // this is async
      return true;
    }

    // if it doesn't exist in memory, load it, set it and go.
    if (window.user.currentPage){
      log("window.user.currentPage exists, loading and setting it.", window.user.currentPage);
      window.currentPage = await PageHistory.load(window.user.currentPage);

      if (window.currentPage){
        log("window.currentPage", window.currentPage);
        window.currentPage.url = url;
        window.currentPage.save();
        return true;
      }
    }

    log("currentPage doesn't exist on disk, creating it and caching it.");
    // if it doesn't even exist on disk, create it, set it and go.
    window.currentPage = new PageHistory(undefined, url);
    window.currentPage = await window.currentPage.save();
    log("currentPage", window.currentPage);
    window.user.currentPage = window.currentPage.filePath;
    log("setCurrentPage, window currentPage", window.currentPage);
    log("window.user.currentPage", window.user.currentPage);
    return true;
  }

  async getCurrentPage(){
    // it should be cached
    if (window.currentPage){
      return window.currentPage.url;
    }

    if (this.currentPage.length === 0){
      await this.setDefaultPage();
    }
    // if it's not cached, cache it
    window.currentPage = await PageHistory.load(this.currentPage);
    return window.currentPage.url;
  }
}

class VoteObject extends StoredObject{
  constructor(
    filePath = undefined,
    uuid = "dummyuuid",
    requesterFingerprint = '', //fingerprint';
    requesterPublicKey = '', //publickey;
    responderFingerprint = '', //dfingerprint;
    responderPublicKey = '', //publicKey;
    signature = '', // signature;
    purpose = '', // decide what thing should happen, e.g yea,nay or option 1,2,3, etc.;
    possibleOutcomes = [], //['outcome1','outcome2','outcome3'];
    requestedVoters = [], //['fingerprint1','fingerprint2'];
    chosenOutcome = 0,
  ){
    super(filePath = filePath);
    this.uuid = uuid;
    this.requesterFingerprint = requesterFingerprint;
    this.requesterPublicKey = requesterPublicKey;
    this.responderFingerprint = responderFingerprint;
    this.responderPublicKey = responderPublicKey;
    this.signature = signature;
    this.purpose = purpose;
    this.possibleOutcomes = possibleOutcomes;
    this.requestedVoters = requestedVoters;
    this.chosenOutcome = 0;
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let voteObject = new VoteObject(inFilePath);
    // log("loading voteObject", voteObject);
    let loaded = await voteObject.load(inFilePath);
    // log("checking voteObject load", loaded);
    if (loaded)
      return voteObject;
    return false;
  }

  static get store() {
    return 'votes';
  }
}

class VoteData extends StoredObject{
  constructor(
    filePath = undefined,
    monthYear = '' // 2020-01, year-month
    ) {
    super(filePath=filePath);
    if (timeFrame == ''){
      let date = new Date();
      this.timeFrame = `${date.getFullYear()}-${date.getMonth()}`;
    }
    else{
      this.timeFrame = timeFrame;
    }
    this.votes = []; // list of strings objects, {circles: [circle list], terms: 'search terms'}
    this.store = 'votes';
    this.circle = '';
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let voteData = new VoteData(inFilePath);
    // log("loading voteData", voteData);
    let loaded = await voteData.load(inFilePath);
    // log("checking voteData load", loaded);
    if (loaded)
      return voteData;
    return false;
  }

  static get store() {
    return 'votes';
  }
}

const CONVERSATION_TYPES = [
  'spamMessaging', // completely untrusted comms.  not sure why anyone would use it as it could be noisy.
  'directMessaging', // directMessaging relies on whether the conversation is trusted based on whether the otherPartyFingerprint is inside of identity.friends
  'directCircleMessaging', // all messages are trusted
  'vouchedMessaging',  // all messages are vouched for by a trusted user which allows non-members to communicate with known members
  'generalCircleMessaging', // all messages are trusted
  'publicCircleMessaging', // all messages are vouched for by a publicly available key
  'serviceMessaging', // all messages are auditable and are able to be picked up by service providers
];

class Conversation extends StoredObject{
  constructor(
    filePath = undefined,
    conversationType = '',
    identity = '',
    circle = '',
    persona = '',
    serviceType = '',
    ) {

    super(filePath=filePath);

    // external
    this.identityFingerprint = identity.fingerprint; // necessary, who owns this conversation, the sender
    this.circleFingerprint = circle ? circle.fingerprint: ''; // optional, circle that this conversation is happening in.  if this is empty then it's not happening inside of a circle
    this.coreCircleFingerprint = circle ? circle.fingerprint: ''; // optional, circle that this conversation is happening in.  if this is empty then it's not happening inside of a circle
    this.otherPartyFingerprint = persona.fingerprint; // necessary, who we're talking to

    // internal
    this.identityFilePath = identity.filePath;
    this.circleFilePath = circle ? circle.filePath: '';
    this.otherPartyFilePath = persona.filePath;

    this.unreads = 0; // the number of unread messages
    this.messages = {}; // Object of all of the messages in this conversation ['2019-12': [[filePath, date], [filePath, date]], '2020-01': [], '2020-02': [], ...]
    this.lastMessageDate = -5752494000000; // the last message sent or received, whichever is latest
    this.conversationType = conversationType; // this is used to chose the persona used for communication and the communication addresses
    this.serviceType = serviceType; // this is ony used if the conversationType is serviceMessaging it's the name of the service types in PERSONA_TYPES
    this.signatures = {};
    this.subscriptions = {};

    this.messageTail = {month: ``, index: 0};
    this.messageHead = {month: ``, index: 0};
    this.messagesWindowSize = 0; // will grow to the messagesWindowLimit
    this.messagesWindowLimit = 100; // this is how many messages we will return at once to the front end

    this.latestMessageYearMonth; // don't modify this directly
    this.latestMessageKey; // don't modify this directly.

    this.requestWithSender = false; // this should be rarely used, only if the service received tons of messages on the exact same millisecond.

    this.earliestIncomingSender = ''; // the fingerprint of the sender of the earliest message we have from the last request.  this is cleared if we do anything besides scroll backwards.
    this.latestIncomingSender = ''; // the fingerprint of the sender of the latest message we have from the last request. this is cleared if we do anything besides scroll forwards.
    
    this.requestWithPreviousDay = false; // messages are typically bucketed if this is true we need to check the previous day
    this.requestWithNextDay = false; // messages are typically bucketed.  if this is true we need to check the next day

    this.startOfMessageHistoryReached = false;
    this.firstOpening = true;

    this.pullID = 0; // for tracking incoming response order.  jumps can only be triggered by request ids that are greater>= to the pullID
    this.removing = false; // if this is true then no new messages can be sent, no messages can be received and subscriptions cannot be started
    this.outbox = [];
    this.trusted = false;
    this.outgoingPath = '';

    // this.conversationKey = `${this.circleFingerprint? null:this.identityFingerprint}/${this.conversationType}/${this.circleFingerprint?`${this.circleFingerprint}`:null}/${this.otherPartyFingerprint}`;
    this.conversationKey = `${this.circleFilePath? null:this.identityFilePath}/${this.conversationType}/${this.circleFilePath?`${this.circleFilePath}`:null}/${this.otherPartyFilePath}`;

    switch(this.conversationType){
      case 'spamMessaging':
        this.personaFingerprint = identity.getPersona('induction').fingerprint;
        this.subscriptions[`spam/${this.personaFingerprint}`] = this.conversationKey;
        this.outgoingPath = `spam/${this.otherPartyFingerprint}`;
        break;
      case 'directMessaging':
        // if it's a directMessaging we need to see if it's trusted or not.
        this.personaFingerprint = this.trusted ? identity.getPersona('message') : identity.getPersona('induction').fingerprint;
        this.personaType = this.trusted ? 'message' : 'induction'
        this.subscriptions[`verified/${this.personaFingerprint}/${this.otherPartyFingerprint}`] = this.conversationKey;
        this.outgoingPath = `verified/${this.otherPartyFingerprint}/${this.personaFingerprint}`;
        break;
      case 'directCircleMessaging':
        if(!circle){throw Error("circle must be provided");}
        this.personaFingerprint = identity.getPersona('message').fingerprint;
        this.subscriptions[`doubleVerified/${this.personaFingerprint}/${this.circleFingerprint}`] = this.conversationKey;
        this.outgoingPath = `doubleVerified/${this.otherPartyFingerprint}/${this.circleFingerprint}`;
        break;
      case 'vouchedMessaging':
        if(!circle){throw Error("circle must be provided");}
        this.personaFingerprint = identity.getPersona('induction').fingerprint;
        this.subscriptions[`tripleVerified/${this.personaFingerprint}/${this.circleFingerprint}`] = this.conversationKey;
        this.outgoingPath = `tripleVerified/${this.otherPartyFingerprint}/${this.circleFingerprint}`;
        break;
      case 'generalCircleMessaging':
        if(!circle){throw Error("circle must be provided");}
        this.personaFingerprint = identity.getPersona('message').fingerprint;
        this.personaType = 'message';
        this.subscriptions[`quadrupleverified/${this.personaFingerprint}/${this.circleFingerprint}`] = this.conversationKey;
        this.outgoingPath = `quadrupleverified/${this.personaFingerprint}/${this.circleFingerprint}`;
        break;
      case 'publicCircleMessaging':
        if(!circle){throw Error("circle must be provided");}
        this.personaFingerprint = identity.getPersona('induction').fingerprint;
        this.circleFingerprint = circle.getPersona('induction').fingerprint;
        this.personaType = 'induction';
        this.subscriptions[`tripleVerified/${this.otherPartyFingerprint}/${this.circleFingerprint}`] = this.conversationKey;
        this.outgoingPath = `tripleVerified/${this.otherPartyFingerprint}/${this.circleFingerprint}`;
        break;
      case 'serviceMessaging':
        if(!circle){throw Error("circle must be provided");}
        this.personaFingerprint = identtiy.getPersona(serviceType); // search, files, buy, sell
        this.subscriptions[`quadrupleverified/${this.personaFingerprint}/${this.circleFingerprint}`]  = this.conversationKey;
        this.outgoingPath = `quadrupleopen/${this.otherPartyFingerprint}`;
        break;
      default:
        // log("default conversationType hit, should be loading a conversation");
        // console.warn("There is no default conversationType, ex")
        // throw Error("There is no default conversationType, provide one.");
    }

    this.store = 'conversations';
  }

  getIdentifier(){
    return this.conversationKey;
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let conversation = new Conversation(inFilePath);
    // log("loading conversation", conversation);
    let loaded = await conversation.load(inFilePath);
    // log("checking conversation load", loaded);
    if (loaded)
      return conversation;
    return false;
  }

  static get store() {
    return 'conversations';
  }

  static get typeName(){
    return "Conversation";
  }

  static async openAll(){
    for(let filePath in window.identities){
      // log("loading conversations for identity:", window.identities[filePath]);
      window.identities[filePath].loadAllConversations();
    }
    for(let filePath in window.circles){
      // log("loading conversations for circle:", window.circles[filePath]);
      window.circles[filePath].loadAllConversations();
    }
  }

  get pushable(){
    if(!this.messageHead.month) {
      return true;
    }

    if(Object.keys(this.signatures).length <= this.messagesWindowLimit){
      return true;
    }

    let yearMonths = Object.keys(this.messages);

    yearMonths.sort();

    // is the messageHead at the most recent message?
    return yearMonths[yearMonths.length-1] === this.messageHead.month && this.messages[this.messageHead.month].length-1 === this.messageHead.index;
  }

  get latestMessageDate(){
    if(this.latestMessage){
      return this.latestMessage.slice(0,13);
    }

    this.setlatestMessage();
    return this.latestMessage.slice(0,13);
  }

  setLatestMessage(messageKey){
    if(messageKey){
      this.latestMessage = messageKey;
      return;
    }
    let yearMonths = Object.keys(this.messages);
    if(!yearMonths.length){
      this.latestMessage = undefined;
      return;
    }
    yearMonths.sort();
    let ym = yearMonths[yearMonths.length-1];
    this.latestMessage = this.messages[ym][this.messages[ym].length-1].slice(0,36);
    this.latestMessageYearMonth = ym;
  }

  markLastMessage(){
    this.setLatestMessage();
    let ym = this.latestMessageYearMonth;
    if(!this.messages[ym]){return;}
    this.messages[ym][this.messages[ym].length-1] = this.latestMessage.slice(0,36) + '/gapahead';
  }

  unmarkLastMessage(){
    if(!this.latestMessage){
      return;
    }
    let index = this.messages[this.latestMessageYearMonth].lastIndexOf(this.latestMessage);
    if(index >= 0){
      this.unmarkGapMessage(this.latestMessageYearMonth, index);
    }
  }

  unmarkGapMessage(yearMonth, messageIndex){
    let messageKey = this.messages[yearMonth][messageIndex];

    if(messageKey.slice(37,40) === 'gap'){
      this.messages[yearMonth][messageIndex] = messageKey.slice(0,36);
    }
  }

  messageFill(messageCount, waitPeriod){
    for(let i=0;i<messageCount;++i){
      wait( (i*waitPeriod) + (Math.random() % waitPeriod)) 
        .then(() =>{this.sendMessage(`debug message ${i+1} of ${messageCount}`); });
    }
  }

  async getMessageStream(){
    // log("Conversation - getMessageStream", this);
    // TODO: this may need to deal with multiple message streams
    // right now it does not and I don't think it will.
    // check back later after building out more stuff to see if it's necessary.
    // I can barely see anything past one step ahead sometimes.
    let circle = window.circleManager.fingerprint2Instance('circle', this.circleFingerprint);
    let messageHub = circle ? circle.config.messageHub : window.user.default_circle_config.messageHub;
    let messageStream = await MessageStream.getOrCreate(messageHub, window.Conversation); // assigns it to window.messagestreams
    return messageStream;
  }

  async open(){
    log("Conversation open");
    let messageStream = await this.getMessageStream();
    this.subscribe(messageStream);
    // log("Conversation open retrieving messages because we're opening the conversation");
    if (this.firstOpening){
      this.firstOpening = false;
      this.save();
      //this.retrieveMessages("latest", new Date(), false, true);
    }
    else{
      // this.markLastMessage();
      // this.getMessages(`present`);
      // just j
      this.setMessageWindow(true);
    }
  }

  async subscribe(messageStream){
    // log(`Conversation subscribe messageStream.msData- messageCount, conversation: ${messageStream.msData.messageCount}`, this);
    // the messageStream keeps these stored.
    // it keeps a max of 100 subscriptions.  LRU bumping.
    messageStream.addSubscriptions(this.subscriptions);
  }

  async unsubscribe(){
    // normally the messageStream will be the one unsubscribing the conversation and the conversation will not know it.
    // if we call this it's because we're either muting or destroying the conversation
    let messageStream = await this.getMessageStream();
    messageStream.removeSubscriptions(this.subscriptions);
  }

  getSenderPersona(identity){
    return identity.getPersona(this.personaType);
  }

  // TODO vouched messaging, general circle messaging, directcirclemessaging
  // TODO later serviceMessaging
  async sendMessage(messageText, senderIdentity){
    let messageStream = await this.getMessageStream();
    // log("Conversation sendMessage", messageText);
    this.subscribe(messageStream);
    let senderPersona = this.getSenderPersona(senderIdentity);
    switch(this.conversationType){
      case 'spamMessaging':
        this.unsubscribe();  // remove this when it's implemented;
        throw Error("spam messaging not implemented");
        this.sendSpamMessage(messageStream, messageText, senderPersona);
        break;
      case 'directMessaging':
        this.sendDirectMessage(messageStream, messageText, senderPersona);
        break;
      case 'directCircleMessaging':
        this.sendDirectCircleMessage(messageStream, messageText, senderPersona);
        break;
      case 'vouchedMessaging':
        this.sendVouchedMessage(messageStream, messageText, senderPersona);
        break;
      case 'generalCircleMessaging':
        this.sendGeneralCircleMessage(messageStream, messageText, senderPersona);
        break;
      case 'publicCircleMessaging':
        this.sendPublicCircleMessage(messageStream, messageText, senderPersona);
        break;
      case 'serviceMessaging':
        this.sendServiceMessage(messageStream, messageText, senderPersona); // search, files, buy, sell
        break;
      default:
        this.unsubscribe();
        throw Error("There is no default conversationType, provide one.");
    }
  }

  async retrieveMessages(timePeriod = 'latest', date = new Date(), ascending = false, jump = false, messageKey=''){
    window.perftime = performance.now();
    // log("Conversation retrieveMessages", this);
    let messageStream = await this.getMessageStream();
    let sender;

    if(timePeriod === 'latest'){
      // request at the current Date
      // no need to do anything.  this is just a reminder.
    }
    else if(timePeriod === 'past'){
      log(`retrieveMessages, getting past messages`);
      if(!jump){
        // when the current day we would normally search doesn't have anything we can use, go back to the end of the previous day.
        if (this.requestWithPreviousDay){
          // the end of the day, one day back.
          date = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()-1, 23, 59, 59, 999);
          date = new Date(date);
        }
        
        // if all of the messages we retrieved last time had the same exact network received time then use the sender to check this time
        // senders are unique but times are not.
        if(this.requestWithSender){
          sender = this.earliestIncomingSender;
        }
      }
    }
    else if(timePeriod === "future"){
      if(!jump){
        // when the current day we would normally search doesn't have anything we can use, go back to the end of the previous day.
        if (this.requestWithNextDay){
          // the end of the day, one day back.
          date = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()+1, 0, 0, 0, 0);
          date = new Date(date);
        }
        
        // if all of the messages we retrieved last time had the same exact network received time then use the sender to check this time
        // senders are unique but times are not.
        if(this.requestWithSender){
          sender = this.latestIncomingSender;
        }
      }
    }

    // the server takes json dates
    let dateJSON = date.toJSON();
    this.subscribe(messageStream);
    ++this.pullID;
    switch(this.conversationType){
      case 'spamMessaging':
        this.unsubscribe();  // remove this when it's implemented;
        throw Error("spam messaging not implemented");
        this.retrieveSpamMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'directMessaging':
        this.retrieveDirectMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'directCircleMessaging':
        this.retrieveDirectCircleMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'vouchedMessaging':
        this.retrieveVouchedMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'generalCircleMessaging':
        this.retrieveGeneralCircleMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'publicCircleMessaging':
        this.retrievePublicCircleMessages(messageStream, dateJSON, ascending, sender, jump, messageKey)
        break;
      case 'serviceMessaging':
        this.retrieveServiceMessages(messageStream, dateJSON, ascending, sender, jump, messageKey) // search, files, buy, sell
        break;
      default:
        this.unsubscribe();
        throw Error("There is no default conversationType, provide one.");
    }
  }

  async getLink(){
    // log("Conversation getLink", this);

   switch(this.conversationType){
      case 'spamMessaging':
        throw Error("spam messaging not implemented");
        return this.retrieveSpamMessages();
      case 'directMessaging':
        return this.retrieveDirectMessages();
      case 'directCircleMessaging':
        return this.retrieveDirectCircleMessages();
      case 'vouchedMessaging':
        return this.retrieveVouchedMessages();
      case 'generalCircleMessaging':
        return this.getGeneralCircleConversationLink();
      case 'publicCircleMessaging':
        return this.getPublicConversationLink();
      case 'serviceMessaging':
        return this.retrieveServiceMessages(); // search, files, buy, sell
      default:
        throw Error("There is no default conversationType, provide one.");
    } 
  }

  async getPublicConversationLink(){
    // log("Conversation getPublicConversationLink", this);
    // The circle -> admin sigil and admin -> joint key sigil are required in order to make a publicConversationLink

    // Get all of the pieces
    //let circle = window.circleManager.fingerprint2Instance('circle', this.circleFingerprint);
    let circle = window.circles[this.circleFilePath];
    let circleInductionPersona = circle.getPersona("induction");
    //let jointPersona = window.circleManager.fingerprint2Instance('persona', this.otherPartyFingerprint);
    let jointPersona = await Persona.lookUp(this.otherPartyFilePath);
    let adminInductionPersona = await jointPersona.getAdministrator();
    window.backend.keyUpload(this.coreCircleFingerprint, this.identityFingerprint);

    // We only get the messageHub config, plebians don't deserve anything else
    let messageHubConfig = circle.config.messageHub;

    // Check each of the required components of the link
    // log("Conversation getPublicConversationLink, circle, adminPersona, jointPersona, messageHubConfig", circleInductionPersona, adminInductionPersona, jointPersona, messageHubConfig);

    // Get the required sigils
    let sigils = [];
    sigils.push(await adminInductionPersona.getOrCreateSigil(circleInductionPersona, ['message']));
    sigils.push(await jointPersona.getSigil(adminInductionPersona, ['message']));

    // Gather it all
    let linkObject = {
      sigils,
      keys: {
        publicKey: jointPersona.publicKey,
        privateKey: jointPersona.privateKey
      },
      config: messageHubConfig
    };

    // stringify the link
    let linkString = JSON.stringify(linkObject);

    // create the hash for the link, it's a hash of the contatenation of all of the public keys
    //let linkHash = await salty.hashToBytes16(linkString);
    // console.log("linkHash", linkHash);
    // let link2048 = utils.encode2048(linkHash);
    // let link65536 = utils.encode65536(linkHash);
    // let linkHashString = await salty.hashToString16(linkString);
    let linkHash58String = await salty.hashToBase5816(linkString);
    //let linkHash58StringShort = linkHash58String.slice(0, 11);

    let link = `${circle.config.core.url}/#i/${linkHash58String}`;
    
    // log("linkUpload - linkHash, link", circle.fingerprint, linkHash, link);

    let response = await external.makeRequest(
      "POST",
      `${circle.config.keyHub.url}/links`,
      linkObject
    );


    if (response.status !== "success" || response.linkHash !== linkHash58String){
      // log("linkhash response", response);
      throw new Error(`linkHash is incorrect serverSide: ${response.linkHash}, clientSide: ${linkHash58String}`);
    }

    // check the link
    // log("Conversation getPublicConversationLink, link", link);

    return link;

  }

  verifyDirectPermissionChain(sigilBlob, verifierPublicKey, publicKey, networkReceivedDate = new Date(), permissionsList = []){
    // log("Conversation verifyDirectPermissionChain", sigilBlob, verifierPublicKey, publicKey, networkReceivedDate, permissionsList);

    if (!sigilBlob){
      warn("Conversation verifyDirectPermissionChain - sigilBlob is undefined");
      return false;
    }
    // check to make sure that the sigil is from who we think it's from
    if(!sigilBlob.voucher === verifierPublicKey){
      warn("Conversation verifyDirectPermissionChain - voucher doesn't match the verifier public key", sigilBlob, verifierPublicKey);
      return false;
    }

    // check to make sure sigil is for who we think it's for
    if(!sigilBlob.vouchee === publicKey){
      warn("Conversation verifyDirectPermissionChain - vouchee doesn't match the public key", sigilBlob, publicKey);
      return false;
    }

    // check each permission existence
    for (let permission of permissionsList){
      // is the permission inside of the sigil?
      if (!(permission in sigilBlob.permissions)){
        warn("Conversation permission doesn't exist in sigil", permissionsList, sigilBlob, permission);
        return false;
      }

      // is the permission dated before the networkReceivedDate?  the networkReceivedDate is the date that the last node on the network received the message
      // if the sigil is expired before it was received it's no longer good.
      let permissionExpirationDate = new Date(sigilBlob.permissions[permission]);
      if(permissionExpirationDate < networkReceivedDate){
        warn("Conversation verifyDirectPermissionChain - permissionExpirationDate is earlier than networkReceivedDate");
        return false;
      }
    }

    return true;
  }

  async verifyMessageHubReceipt(msg){
    // msg is an object like: 
    // msg = {
    //   masterToServiceSignature: "",
    //   servicePublicKey: "",
    //   receiptSignature: "",
    //   receiptDate: "",
    //   data: ""
    // };

    // the messageHub publicKey is required for verifying the receipt
    // console.log("Conversation this", this);
    let circle = window.circleManager.fingerprint2Instance('circle', this.circleFingerprint);
    let messageHub = circle ? circle.config.messageHub : window.user.default_circle_config.messageHub;

    // check the master messageHub signature
    let verified = await salty.verifyDetached(msg.masterToServiceSignature, msg.servicePublicKey, messageHub.publicKey);
    if (!verified){
      return Promise.reject("The receipt was invalid due to the master signature");
    }

    // check the receiptSignature
    let dataDateCombo = msg.data + msg.receiptDate;
    verified = await salty.verifyDetached(msg.receiptSignature, dataDateCombo, msg.servicePublicKey);
    if(!verified){
      return Promise.reject("The receipt was invalid due to the receipt signature");
    }

    // check the date is a date
    let msgDate = new Date(msg.receiptDate);
    if(msgDate < earliestDate){
      return Promise.reject("The receipt was invalid due to the receipt date");
    }

    // everything seems good by this point
    return msg;
  }

  async verifyOuterMessage(msg, receiptDate){
    // log("verifyOuterMessage", msg);
    switch(this.conversationType){
      case 'spamMessaging':
        return this.verifyOuterSpamMessage(msg, receiptDate);
      case 'directMessaging':
        return this.verifyOuterDirectMessage(msg, receiptDate);
      case 'directCircleMessaging':
        return this.verifyOuterDirectCircleMessage(msg, receiptDate);
      case 'vouchedMessaging':
        return this.verifyOuterVouchedMessage(msg, receiptDate);
      case 'generalCircleMessaging':
        return this.verifyOuterGeneralCircleMessage(msg, receiptDate);
      case 'publicCircleMessaging':
        return this.verifyOuterPublicCircleMessage(msg, receiptDate);
      case 'serviceMessaging':
        return this.verifyOuterServiceMessage(msg, receiptDate);
      default:
        return Promise.reject("There is no default conversationType, provide one.");
    }
  }

  async verifyOuterDirectMessage(msg, receiptDate){
    // log(`Conversation verifyOuterDirectMessage`, msg);
    let circle = window.circleManager.fingerprint2Instance('circle', this.coreCircleFingerprint);

    let receiverPublicKey = msg.receiver;
    let senderPublicKey = msg.sender;

    let sigils = msg.sigils;

    // check that the receiptDate is earlier than today
    let networkReceivedDate = new Date(receiptDate);
    let now = new Date();
    // this doesn't work because clocks are not all the same
    // if(networkReceivedDate > now){
    //   return Promise.reject("The receiptDate is in the future.  We live in the present.");
    // }


    // check that we have their persona
    let senderPersona = await Persona.lookUp(senderPublicKey, circle);
    let otherPartyPersona = await Persona.lookUp(this.otherPartyFingerprint, circle);


    // Right here I have a problem.  Do I want to open up directMessages to people
    // who are not the verifier but have been verified by the verifier?
    // doing so allows allows more people to talk on this channel rather than just 1 to 1 direct comms
    // but what is the usecase?  people verified by one key send messages to people verified by another key?
    // I think it's better to not restrict the functionality in this method.  Let's see if I can find a good purpose.
    // if (otherPartyPersona.publicKey !== senderPublicKey){
    //   not sure how this would happen but I want to check it anyway
    //   return Promise.reject("otherDirectMessage unverifiable because the otherPartyPersona key doesn't match the sender");
    // }

    // check if it's for us
    let receiverFingerprint = await salty.getFingerprint(receiverPublicKey);
    if (this.personaFingerprint !== receiverFingerprint){
      // log("Conversation verifyOuterDirectMessage, personaFingerprint, receiverFingerprint, senderPersona", this, msg, this.personaFingerprint, receiverFingerprint, senderPersona);
      return Promise.reject("outerDirectMessage unverifiable because this persona is not the receiver");
    }

    // check that they actually sent the message
    let sigVerified = await salty.verifyDetached(msg.signature, msg.message, senderPublicKey);
    if(!sigVerified){
      return Promise.reject("outerDirectMessage unverifiable because the key, message, and signature didn't match");
    }

    // check to make sure that they have permission to send it to us
    let sigilBlob = await salty.readSigil(sigils[0]);
    // log("Conversation verifyOtherDirectMessage sigilBlob", sigilBlob);

    if(!this.verifyDirectPermissionChain(sigilBlob, otherPartyPersona.publicKey, senderPersona.publicKey, networkReceivedDate, ["message"])){
      return Promise.reject("otherDirectMessage unverifiable because sigil doesn't check out");
    }

    senderPersona.addSigil(otherPartyPersona, sigils[0]);
    await senderPersona.save();
    return msg;
  }

  async verifyOuterPublicCircleMessage(msg, receiptDate){
    // log(`Conversation verifyOuterPublicCircleMessage`, msg, receiptDate);
    let circle = window.circleManager.fingerprint2Instance('circle', this.coreCircleFingerprint);
    let receiverPublicKey = msg.receiver;
    let senderPublicKey = msg.sender;

    let sigils = msg.sigils;

    // check that the receiptDate is earlier than today
    let networkReceivedDate = new Date(receiptDate);
    let now = new Date();
    // this doesn't work because clocks are not the same.  I don't know how to synchronize or whether it's even needed.
    // hopefully the conversation's message chronology and signature dates obviate the need for this.
    // just something to watch out for.
    // if(networkReceivedDate > now){
    //   return Promise.reject("The receiptDate is in the future.  We live in the present.");
    // }


    // check if it's for us
    let receiverFingerprint = await salty.getFingerprint(receiverPublicKey);
    let senderFingerprint = await salty.getFingerprint(senderPublicKey);
    if (this.otherPartyFingerprint !== receiverFingerprint){
      // log("Conversation verifyPublicCircleMessage, conversation, msg, receiverFingerprint, senderFingerprint", this, msg, receiverFingerprint, senderFingerprint);
      return Promise.reject("outerPublicCircleMessage unverifiable because this persona is not the receiver");
    }

    // check that they actually sent the message
    let sigVerified = await salty.verifyDetached(msg.signature, msg.message, senderPublicKey);
    if(!sigVerified){
      return Promise.reject("outerPublicCircleMessage unverifiable because the key, message, and signature didn't match");
    }

    // check to make sure that they have permission to send it to us
    let circleToAdminSigil = await salty.readSigil(sigils[0]);
    let adminToVerifierSigil = await salty.readSigil(sigils[1]);
    let verifierToSenderSigil = await salty.readSigil(sigils[2]);

    let sigilBlobs = [circleToAdminSigil, adminToVerifierSigil, verifierToSenderSigil];
    // log("Conversation verifyOuterPublicCircleMessage sigilBlobs", sigilBlobs);

    try{
      Conversation.verifyPublicMessagingPermissionChain(sigilBlobs, ["message"], new Date());
    }
    catch(err){
      error(err);
      return Promise.reject("outerPublicCircle unverifiable because sigil doesn't check out");
    }
    return msg;
  }

  static readSentMessage(msg){
    try{
      return JSON.parse(msg.data);
    }
    catch(err){
      return Promise.reject("Unable to read sent message.  Could not parse the json");
    }
  }


  async sendDirectMessage(messageStream, messageText, persona){
    throw new Error("sendDirectMessage is currently broken in a few ways, it needs to be fixed first.");

    // log("Conversation senddirectMessage");
    let circle = window.circleManager.fingerprint2Instance('circle', this.circleFingerprint);
    // let persona = window.circleManager.fingerprint2Instance('persona', this.personaFingerprint);
    let otherPartyPersona = await Persona.lookUp(this.otherPartyFingerprint, circle);

    let inputDate = new Date();
    let dateStamp = inputDate.toJSON();
    let messageType = this.conversationType.replace('Messaging', 'Message');
    // sign the dated message
    let messageTextSig = await salty.signStringDetached(`${dateStamp}-${messageText}`, persona.privateKey);

    // create the user payload
    let userPayload = {
      dateStamp: dateStamp,
      message: messageText,
      messageType: messageType,
      signature: messageTextSig
    };

    // create the message Object
    let outgoingMessage = new Message(
      undefined, // filePath
      this.conversationKey, // conversationKey
      inputDate.getTime(), // signedDate
      undefined, //  receivedDate this is only set for messages that we've received.  for messages we send it's never set
      undefined, // networkReceivedDate this is only set for messages that we've received.  for message we send it's never set.  this date is when it arrived at the the message hub that we're retrieving it from.
      persona.fingerprint, // personaFingerprint
      messageTextSig, // signature
      "", // outerSignature, filled in after it's created below
      messageText, // message
      messageType, // messageType
      status='unsent' // status
    );

    outgoingMessage = await outgoingMessage.save();
    this.addMessage(outgoingMessage);
    // this.pushFrontend(outgoingMessage); // pushfrontend is not used with single messages anymore.
    // place it in the outbox.  message stream already handles retries, this is just for book keeping for now.
    this.outbox.push(outgoingMessage.filePath);
    this.lastMessageDate = inputDate.getTime();
    await this.save();

    // encrypt the message for the specific user
    let encryptedUserPayload = await salty.encryptStringWithKey(JSON.stringify(userPayload), otherPartyPersona.publicKey);

    // sign the encrypted message so that the message hub knows that it's from us
    let signatureForMessageHub = await salty.signStringDetached(encryptedUserPayload, persona.privateKey);
    outgoingMessage.outerSignature = signatureForMessageHub;
    outgoingMessage.save();
    // create the sigil that says we can send this message
    let sigil = await persona.getSigil(persona, ["message"]);
    let sigilBlob = await salty.readSigil(sigil);
    if(!this.verifyDirectPermissionChain(sigilBlob, persona.publicKey, persona.publicKey, new Date(), ["message"])){
      sigil = await persona.createSigil(persona, ["message"]);
      persona.addSigil(persona, sigil);
      await persona.save();
    }

    // log("Conversation sendDirectMessage sigil", sigil);
    // create the payload for the message hub to know what to do
    let messageHubPayload = {
      sender: persona.publicKey,
      receiver: otherPartyPersona.publicKey,
      signature: signatureForMessageHub,
      message: encryptedUserPayload,
      sigils: [sigil]
    };

    // create the bundle for our MessageStream to know what to do
    let messageBundle = {
      verificationType: 'verified',
      receiver: otherPartyPersona.fingerprint,
      verifier: persona.fingerprint,
      conversationKey: this.conversationKey,
      messageFilePath: outgoingMessage.filePath,
      message: messageHubPayload
    };

    // pass the message to our MessageStream
    messageStream.send(messageBundle);
  }

  // TODO: check to see whether we can combine the retrievers
  async retrieveDirectMessages(messageStream){
    // log("Conversation retrieveDirectMessages", messageStream)
    let messageBundles = [];
    // for the time being always assume that we are connected to a MessageStream
    for (let sub in this.subscriptions){
      let [verificationType, receiver, verifier ] = sub.split('/');
      let messageBundle = {
        verificationType,
        verifier,
        receiver,
        conversationKey: this.conversationKey
      };
      // all replys will be received by the Conversation handler
      messageStream.get(messageBundle);
    }
  }

  // TODO: check to see whether we can combine the retrievers
  async retrievePublicCircleMessages(messageStream, messageDate, ascending, previousSender, jump, messageKey){
    log("Conversation retrievePublicCircleMessages", this, messageStream);
    log(`Conversation `)
    let messageBundles = [];
    
    // for the time being always assume that we are connected to a MessageStream
    for (let sub in this.subscriptions){
      let [verificationType, receiver, verifier ] = sub.split('/');
      // log("Conversation retrievePublicCircleMessages", verificationType, receiver, verifier);

      // when we receive the messages that we requested this object will be available as the transmittedMessage.
      // just search for transmittedMessage in this file to get the gist of
      let messageBundle = {
        verificationType,
        verifier,
        receiver,
        date: messageDate,
        jump,
        messageKey,
        pullID: this.pullID,
        conversationKey: this.conversationKey
      };
      if(ascending){
        messageBundle.ascending = true;
      }
      if (previousSender){
        messageBundle.sender = previousSender; // string
      }
      // all replys will be received by the Conversation handler
      messageStream.get(messageBundle);
    }
  }

  static verifyPublicMessagingPermissionChain(sigilBlobs, permissionsList = ["nopermissions"], networkReceivedDate = new Date()){
    // log("Conversation verifyPublicMessagingPermissionChain", sigilBlobs, permissionsList, networkReceivedDate);

    // if (!sender){
    //   throw new Error("Conversation verifyPublicMessagingPermissionChain - sender does not exist");
    // }
    if (!sigilBlobs){
      throw new Error("Conversation verifyPublicMessagingPermissionChain - sigilBlobs does not exist");
    }
    if (sigilBlobs.length !== 3){
      throw new Error("Conversation verifyPublicMessagingPermissionChain - sigilBlobs is not the correct length of 3 -", sigilBlobs.length);
    }

    // the sigilBlobs are ordered from circle -> admin -> verifier -> sender, i.e. highest authority to lowest
    // the server also checks in this order so it's a good check to make sure our message will be server compatible
    for (let i=0;i<sigilBlobs.length-1;++i){

      // check for the proper voucher
      if (!sigilBlobs[i] || sigilBlobs[i].vouchee !== sigilBlobs[i+1].voucher){
        error("Conversation verifyPublicMessagingPermissionChain - voucher and vouchee don't match", sigilBlobs[i]);
        throw new Error(`Conversation verifyPublicMessagingPermissionChain - voucher and vouchee don't match, ${sigilBlobs[i].vouchee} -> ${sigilBlobs[i+1].voucher}`);
      }

      // check for the proper permissions
      for (let permission of permissionsList){

        // is the permission inside of the sigil?
        if (!(permission in sigilBlobs[i].permissions)){
          error(`Conversation verifyPublicMessagingPermissionChain - permission doesn't exist in sigil`, permissionsList, sigilBlobs[i], permission);
          throw new Error(`Conversation verifyPublicMessagingPermissionChain - permission doesn't exist in sigil ${permissionsList}, ${sigilBlobs[i].permissions}, ${permissions}`, permissionsList, sigilBlobs[i], permission);
        }

        // is the permission expiration date before the networkReceivedDate?  the networkReceivedDate is the date that the last node on the network received the message
        // if the sigil is expired before it was received by them it's no longer good.
        let permissionExpirationDate = new Date(sigilBlobs[i].permissions[permission]);
        if(permissionExpirationDate < networkReceivedDate){
          error("Conversation verifyPublicMessagingPermissionChain - permissionExpirationDate is earlier than networkReceivedDate");
          throw new Error("Conversation verifyPublicMessagingPermissionChain - permissionExpirationDate is earlier than networkReceivedDate");
        }
      }
    }
    return true;
  }

  static verifyLink(sigilBlobs, permissionsList = null, networkReceivedDate = new Date()){
    // log("Conversation verifyLink", sigilBlobs, permissionsList, networkReceivedDate);
    if (!permissionsList){
      throw new Error("permissions list must exist");
    }
    // if (!sender){
    //   throw new Error("Conversation verifyLink - sender does not exist");
    // }
    if (!sigilBlobs){
      throw new Error("Conversation verifyLink - sigilBlobs does not exist");
    }
    if (sigilBlobs.length !== 2){
      throw new Error("Conversation verifyLink - sigilBlobs is not the correct length of 3 -", sigilBlobs.length);
    }

    // the sigilBlobs are ordered from circle -> admin -> verifier -> sender, i.e. highest authority to lowest
    // the server also checks in this order so it's a good check to make sure our message will be server compatible
    for (let i=0;i<sigilBlobs.length-1;++i){

      // check for the proper voucher
      if (!sigilBlobs[i] || sigilBlobs[i].vouchee !== sigilBlobs[i+1].voucher){
        error("Conversation verifyLink - voucher and vouchee don't match", sigilBlobs[i]);
        throw new Error(`Conversation verifyLink - voucher and vouchee don't match, ${sigilBlobs[i].vouchee} -> ${sigilBlobs[i+1].voucher}`);
      }

      // check for the proper permissions
      for (let permission of permissionsList){

        // is the permission inside of the sigil?
        if (!(permission in sigilBlobs[i].permissions)){
          error(`Conversation verifyLink - permission doesn't exist in sigil`, permissionsList, sigilBlobs[i], permission);
          throw new Error(`Conversation verifyLink - permission doesn't exist in sigil ${permissionsList}, ${sigilBlobs[i].permissions}, ${permissions}`, permissionsList, sigilBlobs[i], permission);
        }

        // is the permission expiration date before the networkReceivedDate?  the networkReceivedDate is the date that the last node on the network received the message
        // if the sigil is expired before it was received by them it's no longer good.
        let permissionExpirationDate = new Date(sigilBlobs[i].permissions[permission]);
        if(permissionExpirationDate < networkReceivedDate){
          error("Conversation verifyLink - permissionExpirationDate is earlier than networkReceivedDate");
          throw new Error("Conversation verifyLink - permissionExpirationDate is earlier than networkReceivedDate");
        }
      }
    }
    return true;
  }


  //TODO:
  // make sure that when intaking a persona we include the administrator in its creation when a sigil is included.
  //TODO: refactor this to take an identity so we can use the same conversation for multiple identities
  // right now the persona is tied to a specific identity upon creation of the conversation.
  async sendPublicCircleMessage(messageStream, messageText, persona){
    log("Conversation sendPublicCircleMessage");
    let pushable = this.pushable;

    let circle = window.circleManager.fingerprint2Instance('circle', this.coreCircleFingerprint);
    // let persona = window.circleManager.fingerprint2Instance('persona', this.personaFingerprint);

    let otherPartyPersona = await Persona.lookUp(this.otherPartyFingerprint, circle);
    let adminPersona = await Persona.lookUp(otherPartyPersona.administratorFilePath, circle);
    // there are  personae that the circle owns which control certain functionality.
    // for public messaging this specifc persona that allows us to message.
    let circleMessagingPersona = circle.getPersona('induction'); // getPersona is synchronous, everything should be in memory
    log("Conversation sendPublicCircleMessage - circle personae: ", circle.personae);
    let inputDate = new Date();
    let dateStamp = inputDate.toJSON();
    let messageType = this.conversationType.replace('Messaging', 'Message');
    // sign the dated message
    log("Conversation sendPublicCircleMessage", messageText, persona);
    let messageTextSig = await salty.signStringDetached(`${dateStamp}-${messageText}`, persona.privateKey);

    // create the user payload
    let userPayload = {
      dateStamp: dateStamp,
      message: messageText,
      messageType: messageType,
      signature: messageTextSig
    };

    // create the message object in our storge system
    let outgoingMessage = new Message(
      undefined, // filePath
      this.conversationKey, // conversationFilePath
      inputDate.getTime(), // signedDate
      undefined, //  receivedDate this is only set for messages that we've received.  for messages we send it's never set
      undefined, // networkReceivedDate this is only set for messages that we've received.  for message we send it's never set.  This date is when it arrived at the the message hub that we're retrieving it from.
      persona.fingerprint, // personaFingerprint
      messageTextSig, // signature
      "", // outerSignature, filled in after it's created below
      messageText, // message
      messageType, // messageType
      status='unsent' // status
    );

    // put the created message object in the right locations
    outgoingMessage = await outgoingMessage.save();
    this.addMessage(outgoingMessage);


    // place it in the outbox.  messageStream already handles retries, this is just for book keeping for now.
    this.outbox.push(outgoingMessage.filePath);

    // update the conversation
    this.lastMessageDate = inputDate.getTime();

    ///// package it for sending

    // encrypt the message for the joint key
    let encryptedUserPayload = await salty.encryptStringWithKey(JSON.stringify(userPayload), otherPartyPersona.publicKey);

    // sign the encrypted message so that the message hub knows that it's from us
    let signatureForMessageHub = await salty.signStringDetached(encryptedUserPayload, persona.privateKey);
    outgoingMessage.outerSignature = signatureForMessageHub;
    outgoingMessage.save();
    this.insertMessageSignature(outgoingMessage.outerSignature, outgoingMessage.messageKey);
    window.conversations[this.conversationKey] = this;
    await this.save();
    // log("conversation and signatures", this, outgoingMessage, outgoingMessage.outerSignature);

    // log("personas we need, circleMessaging, adminMessaging, verifier, sender", circleMessagingPersona, adminPersona, otherPartyPersona, persona);

    // log(`conversation sendPublicCircleMessage, circleMessagingPersona filePath: ${circleMessagingPersona? circleMessagingPersona.filePath: "cmp doesn't exist"}`);
    // get the sigil the circle provided to the admin
    let circleToAdminSigil = await adminPersona.getOrCreateSigil(circleMessagingPersona, ["message"]);

    // get the sigil the admin provided to the joint key
    let adminToVerifierSigil = await otherPartyPersona.getOrCreateSigil(adminPersona, ["message"]);

    // get the sigil from the joint key for our personal key
    let verifierToSenderSigil = await persona.getOrCreateSigil(otherPartyPersona, ["message"]);

    // if (!verifierToSenderSigil){
    //   verifierToSenderSigil = await otherPartyPersona.createSigil(persona, ["message"]);
    //   persona.addSigil(otherPartyPersona, verifierToSenderSigil);
    //   persona.save(); // don't await
    // }

    // sigils go from least specific to most.  circle -> admin -> verifier -> sender
    let sigils = [circleToAdminSigil, adminToVerifierSigil, verifierToSenderSigil];
    // log("circletoadminsigil, admintoverifiersigil, verifierToSenderSigil", circleToAdminSigil, adminToVerifierSigil, verifierToSenderSigil);
    let sigilPromises = [];
    let sigilBlobs = [];
    for(let i=0;i<sigils.length;++i){
      sigilPromises[i] = salty.readSigil(sigils[i]).then((sigilBlob) => {sigilBlobs[i] = sigilBlob;});
    }

    // we're using all settled here because verify check just below will handle any errors.
    let sigilResults = await Promise.allSettled(sigilPromises);
    // log("sigilResults", sigilResults);
    //sigilBlobs = sigilResults.map( (x) => {x.value});

    // this throws on errors
    try {
      Conversation.verifyPublicMessagingPermissionChain(sigilBlobs, ["message"], new Date());
    }
    catch(err){
      // something's wrong with the chain, th so we need to check for an update.  For now we're just going to fail out
      // because it's a safe assumption that the sigils are set to never expire.
      // when we're in a better development spot we should gather new permissions when these are outdated
      // need to rely on a blacklist/banlist/throttle list until then
      error(err)
      return;
    }

    if(!this.isMessageWindowSet()){
      await this.setMessageWindow();
    }
    // if we've made it this far it's ok to push it to the front end for the user see that we've sent the message
    // push it to the frontend for the user to see
    if(pushable){
      this.getMessages(`future`).then((messageRange) => {
        this.pushFrontend(messageRange, 'push');
      });
    }
    else{
      console.log("not pushable");
    }


    // log("Conversation sendPublicCircleMessage sigils", sigils);
    // create the payload for the message hub to know what to do
    let messageHubPayload = {
      sender: persona.publicKey,
      receiver: otherPartyPersona.publicKey,
      signature: signatureForMessageHub,
      message: encryptedUserPayload,
      sigils
    };

    // create the bundle for our MessageStream to know what to do
    let messageBundle = {
      verificationType: 'tripleVerified',
      receiver: otherPartyPersona.fingerprint,
      verifier: otherPartyPersona.fingerprint,
      conversationKey: this.conversationKey,
      messageFilePath: outgoingMessage.filePath,
      message: messageHubPayload
    };


    // pass the message to our MessageStream
    messageStream.send(messageBundle);

  }


  static getActiveConversations(){
    return window.activeConversations;
  }

  static isConversationActive(conversation){
    // log("Conversation isConversationActive", conversation, window.activeConversations);
    // this is only in memory, never saved.
    if(window.activeConversations[conversation.conversationKey] && window.activeConversations[conversation.conversationKey].length > 0){
      return true;
    }
    return false;
  }

  static getActiveConversationFrontEnds(conversation){
    // this gets the subset of the active frontends that are showing this conversation
    if (!Conversation.isConversationActive(conversation)){
      return [];
    }

    return window.activeConversations[conversation.conversationKey];
  }

  isConversationActive(){
    // this is only in memory, never saved.
    if(window.activeConversations[this.conversationKey]) {
      return true;
    }
    return false;
  }

  getActiveConversationFrontEnds(){
    // this gets the subset of the active frontends that are showing this conversation
    if (!this.isConversationActive()) {
      return [];
    }

    return window.activeConversations[this.conversationKey];
  }

  static async confirmationHandler(confirmationMessage, confirmedMessage){

    log("Conversation confirmationHandler", confirmationMessage, confirmedMessage);
    if(!validate.messageHubConfirmation(confirmationMessage)){
      error("MessageHub confirmation is invalid");
      return;
    }

    // When we send a message we need to return the confirmation to whatever sent it.
    // log("handleMessageConfirmation confirmedMessage", confirmedMessage);
    let message = await Message.load(confirmedMessage.messageTuple.messageFilePath);
    if(!message){
      error(`there was a confirmation for a non-existent message.${confirmedMessage.messageTuple.messageFilePath}`);
      return;
    }

    // log("handleMessageConfirmation message", message);
    // let conversation = await Conversation.load(message.conversationFilePath);
    let conversation = await Conversation.getConversationWithKey(message.conversationKey);
    if( !conversation){ 
      // if the conversation doesn't exist we don't do anything.
      // we've probably just removed it
      console.warn("Conversation confirmationHandler conversation didn't exist", message);
      return;
    }

    let receiptDate = new Date(confirmationMessage.receiptDate); // loaded from a json timestamp
    let networkTimeStamp = receiptDate.getTime(); // utc timestamp for the adjusted messageKey


    // remove it from the outbox
    let outboxPosition = conversation.outbox.indexOf(message.filePath);
    if (outboxPosition >= 0){
      conversation.outbox.splice(outboxPosition, 1);
    }

    // remove the message so we can add it back at the newly provided network timestamp
    // removing the message from the conversation doesn't delete the message.
    let removedMessage = conversation.removeMessage(message)[0];

    if(!removedMessage){
      // if we couldn't find the message before then we don't want to add it.
      // zombie message possibilities and whatnot
      error(`couldn't find a message: ${message.messageKey} to remove from the conversation: ${conversation.conversationKey}`);
      return;
    }

    log(`removedMessage ${removedMessage}`);
  
    message.status = 'sent';
    message.networkReceivedDate = networkTimeStamp;
    conversation.signatures[message.outerSignature] = message.messageKey;

    conversation.addMessage(message);
    //conversation.markLastMessage();

    window.conversations[conversation.conversationKey] = conversation;
    await message.save();
    await conversation.save();

    // push the new message to the front if we can
    if(conversation.pushable){
      let messageRange = await conversation.getFutureMessages();
      conversation.pushFrontend(messageRange);
    }
  }

  static async denialHandler(denialMessage, deniedMessage){
    // denialHandler
    // 1. takes a denial message
    // 2. notifies the user of any new client states because of the server response
    // 3. marks the message as bad in some way
    // 4. removes the message from the conversation outbox
    // 5. if the conversation is pushable, pushes the message with the new state (some error) to the front end for the user to interact with.

    log("Conversation denialHandler", denialMessage, deniedMessage);
    if(!validate.messageHubDenial(denialMessage)){
      error("something is wrong with the messageHub, it's sending nonsense messages in response to our messages", denialMessage);
    }

    if(!denialMessage.messageTuple || deniedMessage.messageTuple.messageKey || !denialMessage.messageTuple.messageFilePath){
      warn(`unable to pull messages for ${deniedMessage.messageTuple.conversationKey}\n the error was ${denialMessage.status}.  there is no message to load`, denialMessage);
      delete this.msData.transmittedMessages[denialMessage.id]; // these are GET messages.  we don't care.
      // console.log(this.msData.transmittedMessages);
      return;
    }

    let message = await Message.load(deniedMessage.messageTuple.messageFilePath);
    if(!message){
      error(`There was a denial for a non-existent message. ${deniedMessage.messageTuple.messageFilePath}`);
      return;
    }

    let conversation = await Conversation.getConversationWithKey(message.conversationKey);
    if(!conversation){
      error("Conversation denialHandler conversation didn't exist", message);
      // we should probably just delete the message if the conversation can't be found.
      // for now, just log it and we can clean up later.
      return;
    }


    if(!validate.messageHubDenial(denialMessage)){
      error("something is wrong with the messageHub, it's sending nonsense messages in response to our messages", denialMessage);
    }


    if(denialMessage.status.slice(0,3) === '429'){
      // this is going to throttle the user's messaging input.
      // no more messages until the dateStamp provided by the system is < the current datetime
      backend.messageFrontend({
        reason: 'serverState',
        serverState: {
          status: 'throttled',
          endTime: denialMessage.message.dateStamp
        }
      });
      let endTime = new Date(denialMessage.message.dateStamp);
      wait(endTime.getTime()-Date.now()).then(()=>{
        backend.messageFrontend({
          reason: 'serverState',
          serverState: {
            status: 'ok'
          }
        });
      });
      
    }
    else if(denialMessage.status.slice(0,3) === '403'){
      // get all other 400s here 
      backend.messageFrontend({
        reason: 'serverState',
        serverState: {
          status: 'forbidden',
          conversation: denialMessage.message.verifier
        }
      });
    }
    else if(denialMessage.status.slice(0,1) === '4'){
      backend.messageFrontend({
        reason: 'serverState',
        serverState: {
          status: 'clientError',
          state: `weird client error ${denialMessage.status}`
        }
      });
    }
    else{
      backend.messageFrontend({
        reason: 'serverState',
        serverState: {
          status: 'serverError',
          state: `weird server error ${denialMessage.status}`
        }
      });
      error(`server error for message: ${message.message} ${denialMessage.status}`);
    }

    // remove it from the outbox
    let outboxPosition = conversation.outbox.indexOf(message.filePath);
    if (outboxPosition >= 0){
      conversation.outbox.splice(outboxPosition, 1);
    }

    // record the status of the request for it.
    // something went wrong with this messages transmission it's nice to know what.
    // when the frontend gets the message since it's not (un)sent, or (un)read
    // it will be flagged for user intervention
    message.status = denialMessage.status.slice(0,3);
    window.conversations[conversation.conversationKey] = conversation;
    await message.save();
    await conversation.save();

    if(conversation.pushable){
      let messageRange = await conversation.getFutureMessages();
      conversation.pushFrontend(messageRange);
    }
  }


  static async connectionHandler(){
    // the connectedHandler handles when we've just connected to the subscription stream.
    // this function is specifically called right after the subscriptions are successful

    // the first and main purpose is to request the latest messages from the server
    // and possibly scroll to them.
    // ... User friendly messaging requires so many different things scrolly chat behavior things.

    // console.log("Conversation connectionHandler");
    let conversationKeys = Object.values(this.subscriptions).flat();
    let deadConversationKeys = [];
    let deadSubscriptions = [];
    let promises = [];
    // log("Conversation connectionHandler, conversationKeys", conversationKeys);
    for(let conversationKey of conversationKeys){
      promises.push(Conversation.getConversationWithKey(conversationKey)
        .then((conversation) => {
          if (!conversation){return;}
          conversation.markLastMessage();
          conversation.getLatestMessages(true);
        }, ()=>{deadConversationKeys.push(conversationKey);}));
    }
    await Promise.allSettled(promises);

    for(let key of deadConversationKeys){
      for (let sub in this.subscriptions){
        let keyIndex = this.subscriptions[sub].indexOf(key);
        if(keyIndex >= 0){
          this.subscriptions[sub].splice(keyIndex,1);
          if(this.subscriptions[sub].length === 0){
            deadSubscriptions.push(sub);
          }
        }
      }
    }

    if(deadConversationKeys.length > 0){
      this.save();
    }
  }


  static async pushHandler(pushedMessages){
    // the pushHandler handles user messages that have been pushed to us.  the pushedMessages always come for a single fingerprintChain
    log('MessageStream Conversation pushHandler', this, pushedMessages); // if the MessageStream is using this function then "this" is actually the messageStream
    // if the MessageStream is using this function then "this" is actually the messageStream.  just be aware if you'll use it.
    let conversationKeys = this.subscriptions[pushedMessages.fingerprintChain];
    if(!conversationKeys){
      this.forceUnsubscribe(pushedMessages.fingerprintChain);
      throw Error("pushed messages came in for a subscription we don't have.");
    }
    // log("Conversation pushHandler, conversationKeys", conversationKeys);
    for(let conversationKey of conversationKeys){
      Conversation.getConversationWithKey(conversationKey)
        .then((conversation) => {
          if (!conversation){return;}
          conversation.ingestMessages(pushedMessages.messages, "push");
        });
    }
  }


  static async pullHandler(retrievedMessagesObject, transmittedMessage){
    // if the MessageStream is using this function then "this" is actually the messageStream.  just be aware if you'll use it.
    log("MessageStream Conversation pullHandler", this, retrievedMessagesObject, transmittedMessage);
    let conversation = await Conversation.getConversationWithKey(transmittedMessage.messageTuple.conversationKey);
    if(conversation.removing){
      warn(`the conversation ${conversation.conversationKey} is being removed and no longer accepts new messages`);
      return;
    }
    // log("Conversation pullHandler convo & remote message", conversation, retrievedMessagesObject);
    conversation.checkIncomingMessagesStatus(retrievedMessagesObject.status, transmittedMessage.messageTuple.pullID, transmittedMessage.messageTuple.ascending, retrievedMessagesObject.message.messages);
    conversation.ingestMessages(
      retrievedMessagesObject.message.messages,
      "pull",
      transmittedMessage.messageTuple.pullID,
      transmittedMessage.messageTuple.ascending,
      transmittedMessage.messageTuple.jump,
      transmittedMessage.messageTuple.messageKey);
  }



  checkIncomingMessagesStatus(requestStatus="200 OK", pullID, ascending, messages){
    log("Conversation checkIncomingMessagesStatus", requestStatus, messages);
    // there are some states that we need to check for which
    // inform the conversation object on how it should request the next batch of messages

    // 0. make sure only the latest pulling request's response can have any effect on the conversation's state
    if (this.pullID !== pullID){
      return;
    }
    // 1. requestStatus == 200 and we've got some messages
    // then keep requesting messages normally
    if(requestStatus === "200 OK" && messages.length > 0){
      // nothing to do
      this.requestWithSender = false;
      this.requestWithPreviousDay = false;
      this.requestWithNextDay = false;
    }
    // 2. requestStatus == 200 and we don't have any messages to add
    // then go back a day and request again, this bucket is empty
    else if(requestStatus === "200 OK" && messages.length === 0){
      if(ascending){
        this.requestWithNextDay = true;
      }
      else{
        this.requestWithPreviousDay = true;
      }
      log("retrieving messages because the response had a messages.length of 0");
    }
    // 3. requestStatus == 204 means the end of the bucket has been reached but we still got some messages
    // check on a previous day for more.
    else if (requestStatus === "204 No Content"){
      if(ascending){
        this.requestWithSender = false;
        this.requestWithNextDay = true;
        this.requestWithPreviousDay = false;
      }
      else{
        this.requestWithSender = false;
        this.requestWithNextDay = false;
        this.requestWithPreviousDay = true;
      }
    }
    // 4. requestStatus == 206
    // the messages times are exactly the same for all of the retrieved messages.  weird.
    // use the sender's fingerprint next time we get messages
    else if(requestStatus === "206 Partial Content"){
      this.requestWithSender = true;
      this.requestWithNextDay = false;
      this.requestWithPreviousDay = false;
    }
    // 5. requestStatus == 404 nothing at all left to get.  stop trying.
    else if(requestStatus === "404 Not Found"){
      // this value does nothing but maybe it will later
      this.startOfMessageHistoryReached = true;
      this.requestWithSender = false;
      this.requestWithPreviousDay = false;
      this.requestWithNextDay = false;
    }
    else{
      warn(`ingestMessages was called witout a proper status ${requestStatus}`);
      // no idea what's going on with the server, if we have messages process them
      // but log a warning.
      this.requestWithSender = false;
      this.requestWithPreviousDay = false;
      this.requestWithNextDay = false;
    }

  }

  async ingestMessages(messages, ingestType="pull", pullID, ascending, jumped, triggeringMessageKey){
    // log(`time from messageRetrieve to ingestMessages: ${performance.now() - window.perftime}`);
    if (messages.length == 0){return;}
    let pushable = this.pushable;

    // if it's an outdated pull we don't want to do anything
    if(ingestType === 'pull' && this.pullID !== pullID){return;}

    // log("ingestMessages", messages);
    let messageObjects = [];
    let messagesToAdd = [];
    let messagePromises = [];
    let duplicateSignatures = {};
    let conflicts = {};
    let conflictingKeys = [];
    // verify the receipt date and sender
    for(let receiptMessage of messages){
      // // log("retrieved message", receiptMessage);
      let outerMessage;
      messagePromises.push(
        validate.messageWithReceipt(receiptMessage) // done
          .then(this.verifyMessageHubReceipt.bind(this)) // done
          .then(Conversation.readSentMessage) // done
          .then((msg) => {
            let existingMessageKey = this.signatures[msg.signature];
            if(existingMessageKey){
              // save the conflict so we can handle them all in one go but dedupe the incoming message
              conflicts[existingMessageKey] = msg.signature;
              return Promise.reject("We already have this message and don't need to add it again");
            }
            return msg;
          })
          .then(validate.outerMessage) // outermessages are generic.  They're what the messageHub or relayNode(doesn't exist yet) uses to organize where messages go and reside
          .then((msg) => {
            return this.verifyOuterMessage(msg, receiptMessage.receiptDate);
          }) // done
          .then((msg) => {
            if(!(msg.signature in duplicateSignatures)){
              // this is just to keep the message around while we process the inner message
              outerMessage = msg;
              duplicateSignatures[msg.signature] = 1;
              return msg;
            }
            return Promise.reject("We already are adding this message");
          })
          .then(this.unwrapMessage.bind(this)) // done
          .then(this.validateInnerMessage.bind(this)) // done
          .then((msgObject) => {
            msgObject.senderPersonaPublicKey = outerMessage.sender;
            return msgObject;
          })
          .then(Conversation.verifyInnerMessage)
          .then((msgObject) => {
            msgObject.receiptDate = receiptMessage.receiptDate;
            msgObject.outerSignature = outerMessage.signature;
            messageObjects.push(msgObject);
          })
          .catch((err) => { if(!err.startsWith("We already")){error(err, receiptMessage);} })
      );
    }
    
    await Promise.allSettled(messagePromises);

    // log(`time from messageRetrieve to ingestMessages Promise.allSettled: ${performance.now() - window.perftime}`);
    // log(`ingestMessages incomingMessages: ${messages.length}, verifiedMessages: ${messageObjects.length}`);
    window.conflicts = conflicts;

    conflictingKeys = Object.keys(conflicts);
    log(`ingestMessages conflicts:`, conflictingKeys);
    log(`ingestMessages new messageObjects:`, messageObjects);

    if(ingestType === 'push' && pushable){
      triggeringMessageKey = this.latestMessage;
    }
    if(triggeringMessageKey){
      conflictingKeys.push(triggeringMessageKey);
    }

    // check that the pullID is still the same. because the previous section is fully asynchronous
    if(ingestType === 'pull' && this.pullID !== pullID){
      error(`this.pullid ${this.pullID} is not the incoming pullID ${pullID}`);
      // bail out.  this is to prevent duplicate requests from happening nigh simultaneously
      return;
    }

    if(messageObjects.length === 0 && conflictingKeys.length === 0){
      return;
    }

    let conflictingKeyBuckets = utils.bucketKeys(conflictingKeys);
    let involvedKeys = conflictingKeys.slice(0);
    let newKeyBuckets = {};

    if(messageObjects.length > 0){
      for(let mob of messageObjects){
        messagesToAdd.push(await Message.createIncoming(mob, this));
      }
      messagesToAdd = await Message.bulkSave(messagesToAdd);
      let newKeys = [];
      for(let message of messagesToAdd){
        let messageKey = message.messageKey;
        newKeys.push(messageKey);
        this.insertMessageSignature(message.outerSignature, messageKey);
      }
      
      newKeyBuckets = utils.bucketKeys(newKeys);
      for(let i=0;i<newKeys.length;++i){
        involvedKeys.push(newKeys[i]);
      }
    }

    let keyBuckets = utils.bucketKeys(involvedKeys);

    let timePeriod = 'present';

    this.messageKeyMerge(newKeyBuckets);

    if(jumped){
      log(`ingestMessages jumped conflictingKeyBuckets, keyBuckets`, conflictingKeyBuckets, keyBuckets);
      timePeriod = 'latest';
      // this.removeMessageGaps(conflictingKeyBuckets, true, true);
      this.removeMessageGaps(keyBuckets, true, true);
      this.addMessageGaps(keyBuckets, true, false);
      this.setLatestSender(keyBuckets.buckets[keyBuckets.last.month][keyBuckets.last.index]); // async
      this.setEarliestSender(keyBuckets.buckets[keyBuckets.first.month][keyBuckets.first.index]); // async
    }
    else if(ingestType === 'push'){
      log(`ingestMessages push, pushable: ${pushable}`, conflictingKeyBuckets, keyBuckets);
      timePeriod = 'future';
      this.removeMessageGaps(keyBuckets, true, true);
      // this.addMessageGaps(keyBuckets, false, true);
      this.setLatestMessage(keyBuckets.buckets[keyBuckets.last.month][keyBuckets.last.index]);
    }
    else if(ascending){
      log(`ingestMessages ascending`, conflictingKeyBuckets, keyBuckets);
      timePeriod = 'future';
      this.removeMessageGaps(keyBuckets, true, true);
      this.addMessageGaps(keyBuckets, false, true);
      this.setLatestSender(keyBuckets.buckets[keyBuckets.last.month][keyBuckets.last.index]); // async
    }
    else{
      log(`ingestMessages desending`, conflictingKeyBuckets, keyBuckets);
      timePeriod = 'past';
      this.removeMessageGaps(keyBuckets, true, true);
      this.addMessageGaps(keyBuckets, true, false);
      this.setEarliestSender(keyBuckets.buckets[keyBuckets.first.month][keyBuckets.first.index]); // async
    }

    // await this.save();

    if (pushable || ingestType === 'pull'){
      log(`ingestMessages pushable: ${pushable} ingestType: ${ingestType}, timePeriod: ${timePeriod}`);
      let messageRange = await this.getMessages(timePeriod);
      log(`ingestMessages timePeriod: ${timePeriod}, messageRange`, messageRange);
      this.pushFrontend(messageRange, ingestType);
    }
  }

  async unwrapMessage(msg){
    // log("Conversation validateInnerMessage")
    switch(this.conversationType){
      case 'spamMessaging':
        return this.unwrapDirectMessage(msg);
      case 'directMessaging':
        return this.unwrapDirectMessage(msg);
      case 'directCircleMessaging':
        return this.unwrapDirectMessage(msg);
      case 'vouchedMessaging':
        return this.unwrapDirectMessage(msg);
      case 'generalCircleMessaging':
        return this.unwrapDirectMessage(msg);
      case 'publicCircleMessaging':
        return this.unwrapPublicCircleMessage(msg);
      case 'serviceMessaging':
        return this.unwrapDirectMessage(msg);
      default:
        error("default conversationType hit, there's no unwrap for default conversationType");
        return Promise.reject("Unable to find an unwrap for this conversationType");
    }
  }

  async unwrapDirectMessage(msg){
    // log("unwrap message in", msg);
    let circle = window.circleManager.fingerprint2Instance('circle', this.circleFingerprint);
    let persona = await Persona.lookUp(this.personaFingerprint, circle);
    // log("unwrap message mid", circle, )
    let unwrappedMessage = JSON.parse(await salty.decryptStringWithKey(msg.message, persona.publicKey, persona.privateKey));
    // log("unwrap message out", unwrappedMessage);
    //log("Conversation unwrapMessage",unwrappedMessage);

    return unwrappedMessage;
  }

  async unwrapPublicCircleMessage(msg){
    // log("unwrap message in", msg);
    let circle = window.circleManager.fingerprint2Instance('circle', this.coreCircleFingerprint);
    let persona = await Persona.lookUp(this.otherPartyFingerprint, circle);
    // log("unwrap message mid", circle, )
    let unwrappedMessage = JSON.parse(await salty.decryptStringWithKey(msg.message, persona.publicKey, persona.privateKey));
    // log("unwrap message out", unwrappedMessage);
    //log("Conversation unwrapMessage",unwrappedMessage);

    return unwrappedMessage;
  }


  insertMessageSignature(signature, messageKey, force=false){
    // log("insertMessageSignature, signature and signatures", signature, this.signatures);
    if(signature in this.signatures && !force){
      // log("the signature exists");
    }
    else{
      this.signatures[signature] = messageKey;
    }
  }

  async validateInnerMessage(msg){
    // log("Conversation validateInnerMessage")
    switch(this.conversationType){
      case 'spamMessaging':
        return validate.spamMessage(msg);
      case 'directMessaging':
        return validate.directMessage(msg);
      case 'directCircleMessaging':
        return validate.directCircleMessage(msg);
      case 'vouchedMessaging':
        return validate.vouchedMessage(msg);
      case 'generalCircleMessaging':
        return validate.generalCircleMessage(msg);
      case 'publicCircleMessaging':
        return validate.publicCircleMessage(msg);
      case 'serviceMessaging':
        return validate.serviceMessage(msg);
      default:
        error("default conversationType hit, there's no validation for default conversationType");
        return Promise.reject("Unable to find a validation for this conversationType");
    }
  }

  static async verifyInnerMessage(msg){
    let datedString = `${msg.dateStamp}-${msg.message}`;
    let verified = await salty.verifyDetached(msg.signature, datedString, msg.senderPersonaPublicKey);
    if (!verified){
      return Promise.reject("unable to verify the innerMessage");
    }
    return msg;
  }

  async verifyInnerMessage(msg){
    // for convenience 
    return Conversation.verifyInnerMessage(msg);
  }


  async receiveMessage(message){
    // log("Conversation - adding a message", message);
    let date = new Date(message.receivedDate? message.receivedDate : message.signedDate);
    let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
    if (!this.messages[yearMonth]){
      this.messages[yearMonth] = [];
    }
    // log("Conversation - messages and message filepath", this.messages, message.filePath)
    this.messages[yearMonth].push(message.filePath);
    // log("Conversation this and this.messages", this, this.messages)
    await this.save();
    // log("Conversation - added a message", this, message);
    return true;
  }

  async receiveMessageBulk(messages){
    // log("Conversation - adding bulk messages", message);
    for (let message of messages){
      let date = new Date(message.receivedDate? message.receivedDate : message.signedDate);
      let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
      if (!this.messages[yearMonth]){
        this.messages[yearMonth] = [];
      }
      // log("Conversation - messages and message filepath", this.messages, message.filePath)
      this.messages[yearMonth].push(message.filePath);
      // log("Conversation this and this.messages", this, this.messages)      
    }

    await this.save();
    // log("Conversation - added a message", this, message);
    return true;
  }

  pushFrontend(messages, ingestType="pull"){
    // console.trace("pushFrontend", messages, ingestType);
    log("pushFrontend");
    if (!Array.isArray(messages)){
      // console.log("pushFrontend messages is not an array");
      messages = [messages];
    }
    let payload = {};
    // If there's at least one active frontend, push the message out to all of the frontends
    // we do it this way because the message may be a bit large
    // No reason to send a message if it's not going to be seen, just let them know instead
    //if (this.isConversationActive()){
    // log("Conversation pushFrontend, messages", messages);
    payload.reason = 'message';
    payload.payload = {};
    payload.payload[this.conversationKey] = {
      ingestType,
      messages: []
    };
    for(let message of messages){
      payload.payload[this.conversationKey].messages.push(message.getSafeMessage());
    }

    // I don't like using backend methods in definitions.js
    // but it should be acceptable for handling data pushes that originate from these classes.
    // I'm making a mental note to try and limit it.  Maybe the design is bad?  meh, moving on.
    // log("Conversation pushFrontend", payload, messages);
    backend.messageFrontend(payload, this.getActiveConversationFrontEnds());
  }

  indexOfMessageAtDate(messageArray, date){
    // i should really consolidate binary searches in my code
    // but this is a special case...for now
    let left = 0;
    let right = messageArray.length-1;
    let dateString = date.toString();
    while(left <= right){
      let mid = left + ((right - left) >>> 1);

      let midDate = messageArray[mid].slice(0,13);
      if(dateString === midDate){
        return mid;
      }
      if (dateString > midDate){
        console.log(`dateString: ${dateString} is greater than midDate: ${midDate} @ index ${mid}`);
        left = mid + 1;
      }
      else{
        console.log(`dateString: ${dateString} is less than midDate: ${midDate} @ index ${mid}`);
        right = mid - 1;
      }
    }

    return -1;
  }

  indexOfMessageAtDateReverse(messageArray, date){
    let dateString = date.toString();

    for(let i=messageArray.length-1;i>=0;--i){
      let existingDate = messageArray[i].slice(0,13);
      if(existingDate === dateString){
        log(`date found @ ${i} for message ${messageArray[i]}`);
        return i;
      }
    }

    return -1;
  }

  indexOfMessageNearDate(messageArray, date){
    // just a binary search where we get between a leftDate < date and rightDate > date
    // this is good for finding a location to insert a message
    let left = 0;
    let right = messageArray.length-1;
    let minSafe = Number.MIN_SAFE_INTEGER.toString();
    let maxSafe = Number.MAX_SAFE_INTEGER.toString();

    while(left < right){
      let mid = left + right >> 1;
      let dateNumMidLeft = minSafe;
      let dateNumMidRight = maxSafe;

      if(messageArray[mid] !== undefined){
        dateNumMidLeft = Number(messageArray[mid].slice(0,13));
      }
      if (messageArray[mid+1] !== undefined){
        dateNumMidRight = Number(messageArray[mid+1].slice(0,13))
      }

      const bigger = date >= dateNumMidLeft;
      const smaller = date <= dateNumMidRight;

      if (bigger && !smaller){
        left = mid + 1;
      }
      else if (smaller && !bigger){
        right  = mid - 1;
      }
      else{
        return mid;
      }
    }

    return -1;
  }

  static async getMessage(messageKey){
    return Message.getMessage(messageKey);
  }

  removeMessage(message){
    let yearMonth = message.yearMonth;
    let messageIndex = this.indexOfMessageAtDateReverse(this.messages[yearMonth], message.messageKey.slice(0,13));
    if(messageIndex < 0){
      return [];
    }

    return this.messages[yearMonth].splice(messageIndex, 1);
  }

  async findDuplicates(){
    let allMessageKeys = Object.values(this.messages).flat();
    let messageFilePaths = allMessageKeys.map(x => x.slice(14,36));

    let messages = await Message.storedObjectBulkLoad(messageFilePaths);
    let firstMessages = {};
    let secondMessages = {};
    let nonExistentMessages = {};

    for(let message of messages){
      if(message.outerSignature in this.signatures && !(message.outerSignature in firstMessages)){
        firstMessages[message.outerSignature] = message;
      }
      else if(message.outerSignature in this.signatures && message.outerSignature in firstMessages){
        if(secondMessages[message.outerSignature]){
          secondMessages[message.outerSignature].push(message);
        }
        else{
          secondMessages[message.outerSignature] = [message];
        }
      }
      else{
        if(nonExistentMessages[message.outerSignature]){
          nonExistentMessages[message.outerSignature].push(message);
        }
        else{
          nonExistentMessages[message.outerSignature] = [message];
        }
      }
    }

    return {firstMessages, secondMessages, nonExistentMessages};
  }

  addMessage(message){
    // this is only use for outgoing messages.  incoming messages are only processed by ingestMessages and messageKeyMerge
    // log("Conversation - adding a message", message);
    let date = new Date(message.date);
    let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;

    if (!this.messages[yearMonth]) {
      this.messages[yearMonth] = [];
    }
    // log("Conversation - messages and message filepath", this.messages, message.filePath);
    let messageIndex = this.indexOfMessageNearDate(this.messages[yearMonth], date.getTime());
    if (messageIndex > -1){

      // found a spot, splice it in
      if(this.messages[yearMonth][messageIndex].slice(37) === 'gapahead'){
        this.messages[yearMonth].splice(messageIndex, 0, `${message.messageKey}/gapahead`);
      }
      else {
        this.messages[yearMonth].splice(messageIndex, 0, `${message.messageKey}`);
      }
    }
    else{
      // no spot found, just push it.
      let existingMessageKey = this.messages[yearMonth].slice(-1)[0];
      if(existingMessageKey && existingMessageKey.slice(37) === 'gapahead'){
        this.messages[yearMonth].splice(-1, 1, existingMessageKey.slice(0,36));
        this.messages[yearMonth].push(`${message.messageKey}/gapahead`);
      }
      else{
        this.messages[yearMonth].push(`${message.messageKey}`);
      }
    }

    // log("Conversation this and this.messages", this, this.messages)
    // await this.save();
    // log("Conversation - added a message", this, message);
  }


  messageKeyMerge(keyBuckets = {}, pulled=false, jumped=false, ascending=false){
    let tailIndex = this.messageTail.index;
    let headIndex = this.messageHead.index;

    for(let yearMonth in keyBuckets.buckets){
      // if the bucket doesn't exist in this conversations messages then just shove them all in
      if(!this.messages[yearMonth]){
        this.messages[yearMonth] = keyBuckets.buckets[yearMonth]
        continue;
      }

      let i=0;
      let j=0;
      let totalMerged = 0;
      let messages1 = this.messages[yearMonth];
      let messages2 = keyBuckets.buckets[yearMonth];
      let messages3 = [];

      let tailMonth = yearMonth === this.messageTail.month;
      let headMonth = yearMonth === this.messageHead.month;

      while(i < messages1.length && j < messages2.length){
        let date1 = messages1[i].slice(0,13);
        let date2 = messages2[j].slice(0,13);
        if(date1 < date2){
          if(tailMonth && i === tailIndex){
            tailMonth = false;
            this.messageTail.index = totalMerged;
          }
          if(headMonth && i === headIndex){
            headMonth = false;
            this.messageHead.index = totalMerged;
          }
          messages3.push(messages1[i++]);
        }
        else{

          messages3.push(messages2[j++]);
        }
        totalMerged++;
      }

      while(i<messages1.length){
        if(tailMonth && i === tailIndex){
          tailMonth = false;
          this.messageTail.index = totalMerged;
        }
        if(headMonth && i === headIndex){
          headMonth = false;
          this.messageHead.index = totalMerged;
        }
        messages3.push(messages1[i++]);
        totalMerged++;
      }

      while(j<messages2.length){
        messages3.push(messages2[j++]);
      }
      this.messages[yearMonth] = messages3;
    }
  }


  removeMessageGaps(keyBuckets = {}, first=true, last=true){
    // checkout utils.bucketKeys
    // let messageKeyBuckets = {
    //   first: {
    //     month: '',
    //     index: -1
    //   },
    //   last: {
    //     month: '',
    //     index: -1
    //   },
    //   buckets: {} // `year-month`: [key1...,keyn]
    // };
    // early exit
    if (utils.isObjectEmpty(keyBuckets) || utils.isObjectEmpty(keyBuckets.buckets)){
      return;
    }

    // let applicableYearMonths = Object.keys(this.messages).filter(yearMonth => return keyBuckets.first.month <= yearMonth && yearMonth <= keyBuckets.last.month);
    for(let yearMonth in keyBuckets.buckets){
      let firstMonth = yearMonth === keyBuckets.first.month;
      let lastMonth = yearMonth === keyBuckets.last.month;

      let markedMessages = keyBuckets.buckets[yearMonth];
      let markStart = 0;
      for(let i = 0;i<markedMessages.length;++i){
        for(let m=markStart;m<this.messages[yearMonth].length;++m){
          if(this.messages[yearMonth][m].slice(0,36) === markedMessages[i].slice(0,36)){
      
            if(keyBuckets.first.index === i && firstMonth && !first){
              this.messages[yearMonth][m] = this.messages[yearMonth][m].slice(0,36) + '/gapbehind';
            }
            else if(keyBuckets.last.index === i && lastMonth && !last){
              this.messages[yearMonth][m] = this.messages[yearMonth][m].slice(0,36) + '/gapahead';
            }
            else {
              this.messages[yearMonth][m] = this.messages[yearMonth][m].slice(0,36);
            }
            markStart = m;
            break;
          }
        }
      }
    }
  }

  addMessageGaps(keyBuckets = {}, first=false, last=false, range=false){
    // checkout utils.bucketKeys
    // let messageKeyBuckets = {
    //   first: {
    //     month: '',
    //     index: -1
    //   },
    //   last: {
    //     month: '',
    //     index: -1
    //   },
    //   buckets: {} // `year-month`: [key1...,keyn]
    // };
    // early exit
    if (utils.isObjectEmpty(keyBuckets) || utils.isObjectEmpty(keyBuckets.buckets)){
      return;
    }

    // mark the end of the range.
    if(last){
      let gapIndex = this.messages[keyBuckets.last.month].lastIndexOf(keyBuckets.buckets[keyBuckets.last.month][keyBuckets.last.index]);
      let messageKey = this.messages[keyBuckets.last.month][gapIndex];
      log(`addMessageGaps: looking for messageKey: ${keyBuckets.buckets[keyBuckets.last.month][keyBuckets.last.index]}`);
      log(`addMessageGaps: messageKey: ${messageKey}, lastMonth: ${keyBuckets.last.month}, last index: ${keyBuckets.last.index} gapIndex: ${gapIndex}`, this.messages);
      this.messages[keyBuckets.last.month][gapIndex] = messageKey.slice(0,36) + '/gapahead';
    }

    // mark the start of the range
    if(first){
      let gapIndex = this.messages[keyBuckets.first.month].indexOf(keyBuckets.buckets[keyBuckets.first.month][keyBuckets.first.index]);
      let messageKey = this.messages[keyBuckets.first.month][gapIndex];
      log(`addMessageGaps: looking for messageKey: ${keyBuckets.buckets[keyBuckets.first.month][keyBuckets.first.index]}`);
      log(`addMessageGaps: messageKey: ${messageKey}, firstMonth: ${keyBuckets.first.month}, first index: ${keyBuckets.first.index} gapIndex: ${gapIndex}`, this.messages);
      this.messages[keyBuckets.first.month][gapIndex] = messageKey.slice(0,36) + '/gapbehind'; 
    }

  }

  async setLatestSender(messageKey = ''){
    let message = await Message.load(messageKey.slice(14,36));
    this.latestIncomingSender = message.personaFingerprint;
  }

  async setEarliestSender(messageKey = ''){
    let message = await Message.load(messageKey.slice(14,36));
    this.earliestIncomingSender = message.personaFingerprint;
  }


  async getMessages(tense="present", checkRemote = false){
    // checkRemote is typically true when this is being called by the user.
    // if the system is able to propagate multiple requests in a row we get runaway effects
    if (utils.isObjectEmpty(this.messages)){
      log("getMessages, this.messages is empty");
      return [];
    }


    if(this.messageHead.month === ''
      || this.messageTail.month === ''
      || (this.messageTail.month === this.messageHead.month && this.messageTail.index === this.messageHead.index) ){
      // doesn't matter what they're requesting, we need the base first
      // calls getPastMessages();
      // sets the months to the latest and the indexes to the latest
      log("getMessages the messageHead.month or messageTail.month is an empty string");
      return this.setMessageWindow();
    }
    // this gets messages based on a window between messageTail and messageHead.
    // in this current code, requesting past or future messages shifts the window (if possible)
    // and therefore the next call of getMessages("present")
    // 

    // this is split into past, present and future.  there is some code duplication
    // but that is a cost for ease of understanding for this one function.
    // sliding windows, wooo

    switch(tense){
      case "past":
        // tries to slide the window backwards.  requests messages if we hit a gap
        return this.getPastMessages(checkRemote);
      case "future":
        // tries to slide the window forwards.  requests messages if we hit a gap
        return this.getFutureMessages(checkRemote);
      case "latest":
        // this is a special case.  it bypasses the continuity of the message timeline and jumps right to the latest messages.
        // if you don't want the message window to move then call this.retrieveMessages("latest", new Date(), false, false);
        // doing so will only pull new messages from the server
        return this.getLatestMessages(checkRemote);
      default:
        // just gets the messages at the current position of the message timeline.
        return this.getPresentMessages(checkRemote);
    }
  }

  isMessageWindowSet(){
    if(!this.messageHead.month || !this.messageTail.month){
      return false;
    }
    return true;
  }

  async setMessageWindow(checkRemote=false){
    log("setMessageWindow");
    this.messagesWindowSize = 0;
    // default to the latest month and slide the tail back as far as it can go up to the messagesWindowLimit
    let yearMonths = Object.keys(this.messages);
    if(yearMonths.length === 0){
      return [];
    }
    yearMonths.sort();
    this.messageHead.month = yearMonths[yearMonths.length-1];
    this.messageTail.month = yearMonths[yearMonths.length-1];

    this.messageHead.index = this.messages[this.messageHead.month].length-1;
    this.messageTail.index = this.messages[this.messageTail.month].length-1;

    this.messageTail.index = Math.max(this.messageHead.index-100, 0);
    this.messagesWindowSize = Math.max(this.messageHead.index-100, 0);
    // log("setMessageWindow, before getPastMessages");
    let pastMessageRange = await this.getPastMessages(checkRemote);
    return pastMessageRange;
  }

  async getPastMessages(checkRemote=false){
    log("getPastMessages");
    // get all months with messages
    let yearMonthsAll = Object.keys(this.messages);
    if(yearMonthsAll.length === 0){
      return [];
    }


    // in order to go back to the past we shift the messageTail back by 50
    // and assign the messageHead to where the messageTail was or max(50 spaces away, #messages away)

    // get the year months that we care about
    let yearMonths = [];
    // log("conversation getMessages, before yearMonthsAll loop");
    for(let i=0;i<yearMonthsAll.length;++i){
      if(yearMonthsAll[i] <= this.messageHead.month){
        yearMonths.push(yearMonthsAll[i]);
      }
    }

    // sort the months we're left with in reverse order
    yearMonths = yearMonths.sort().reverse(); // ['2020-03', '2020-02', '2020-01', '2019-12', ..., yearMonth]

    // log("getPastMessages, yearMonths", yearMonths);

    let tailMonthIndex = yearMonths.indexOf(this.messageTail.month); // used to avoid string comps
    let headMonthIndex = yearMonths.indexOf(this.messageHead.month); // used to avoid string comps


    let tailMessageIndex = this.messageTail.index; // keeps track of the tail's index position as we're shifting the window
    let headMessageIndex = this.messageHead.index; // keeps track of the head's index position as we're shifting the window
    let messagesWindowSize = this.messagesWindowSize;
    let slideQuota = 25; // maybe make this modifiable
    let slideCount = 0;

    let messageFilePaths = [];
    let hitGap = false;
    // log(`getPastMessages Start:  head ${this.messageHead.month} @ ${this.messageHead.index}, tail ${this.messageTail.month} @ ${this.messageTail.index}`);
    // log(`getPastMessages Start:  head ${headMonthIndex} @ ${headMessageIndex}, tail ${tailMonthIndex} @ ${tailMessageIndex}`);

    for(let y=tailMonthIndex;y<yearMonths.length;++y){
      let yearMonth = yearMonths[y];
      let lastMessageIndex = this.messages[yearMonth].length-1;
      // log(`getPastMessages, yearMonth: ${yearMonth}, lastMessageIndex: ${lastMessageIndex}`);
      // log(`getPastMessages, tailMessageIndex ${tailMessageIndex}, messageFilePaths.length ${messageFilePaths.length}, limit ${this.messagesWindowLimit}`);
      //for(let index = tailMessageIndex;index>=0 && messageFilePaths.length < this.messagesWindowLimit;--index){
      for(let index = tailMessageIndex;index>=0 && slideCount < slideQuota;--index){
        // log("getPastMessages, innerLoop");
        // if we've hit a gap message then we need to stop, break out of the loops and retrieve messages to fill the gap
        if (this.messages[yearMonth][index].endsWith('/gapbehind')){
          log(`getPastMessages, gapbehind hit this.messages[${yearMonth}][${index}]: ${this.messages[yearMonth][index]}`);
          // we've hit a gap.  we should always hit gap going backwards.
          // break out of all loops and request more messages
          hitGap = true;
          // can't go backwards if we don't check for remote messages
          if(checkRemote){
            let date = new Date(parseInt(this.messages[yearMonth][index].slice(0,13)));
            log(`getPastMessages, retrievingMessages`);
            this.retrieveMessages('past', date, false, false, this.messages[yearMonth][index]);
          }
          break;
        }

        if (this.messages[yearMonth][index].endsWith('/gapahead')){
          // backup one, and search for past remote messages if we can, otherwise don't progress
          log(`getPastMessages, gapbehind hit this.messages[${yearMonth}][${index}]: ${this.messages[yearMonth][index]}`);
          let message = await Message.load(`${this.messages[yearMonth][index].slice(14,36)}`);
          log(`getPastMessages retrieving messages because we hit a gapbehind - month: ${yearMonth} index: ${index}, key: ${this.messages[yearMonth][index]}, message: ${message.message}`);
          if(checkRemote){
            let lookUpIndex = Math.min(index+1,tailMessageIndex);

            let date = new Date(parseInt(this.messages[yearMonth][lookUpIndex].slice(0,13)));
            log(`getPastMessages, retrievingMessages`);
            this.retrieveMessages('past', date, false, false, this.messages[yearMonth][lookUpIndex]);
          }
          hitGap = true;
          break;
        }


        if(this.messages[yearMonth][index].endsWith('/gapbehind')){
          let message = await Message.load(`${this.messages[yearMonth][index].slice(14,36)}`);
          log(`getFutureMessages retrieving messages because we hit a gapbehind - month: ${yearMonth} index: ${index}, key: ${this.messages[yearMonth][index]}, message: ${message.message}`);
          if (checkRemote){
            let lookUpIndex = Math.max(index-1, 0);

            log(`getFutureMessages checking remote borderKey, ${this.messages[yearMonth][lookUpIndex]}`);
            let date = new Date(parseInt(this.messages[yearMonth][lookUpIndex].slice(0,13)));
            this.retrieveMessages('future', date, true, false, this.messages[yearMonth][lookUpIndex]);
          }
          hitGap = true;
          break;
        }




        slideCount++;
        // log(`getPastmessages innerLoop messagesWindowSize: ${messagesWindowSize}`);
        // if the window doesn't cover as many messages as the window limit then move the tail to expand it
        if(messagesWindowSize < this.messagesWindowLimit){
          log("getPastMessages, window size is less than the window limit");
          // if we're at the edge of a month, move the tail's month downward
          // otherwise just decrement the index
          // in terms of iteration though, we are decrementing the messageIndex and incrementing the monthIndex
          if(tailMessageIndex === 0 && tailMonthIndex < yearMonths.length-1){
            log(`getPastmessages incrementing tailMonthIndex ${tailMonthIndex}, setting tailMessageIndex ${tailMessageIndex}, incrementing messagesWindowSize ${messagesWindowSize}`);
            tailMonthIndex++;
            tailMessageIndex = yearMonths[tailMonthIndex].length-1;
            messagesWindowSize++;
          }

          // if we're at the edge of the last month but we can't move months, we need to request more messages
          // no need to wait for a return message, they'll fill in on their own
          else if (tailMessageIndex === 0){
            log(`getPastMessages retrieving messages because the tailMessageIndex is ${tailMessageIndex} and the tailMonthIndex has reached the earliest month ${tailMonthIndex}`);
            
            // // prevent infinite loops
            // if (checkRemote){
            //   let date = new Date(parseInt(this.messages[yearMonth][0].slice(13)));
            //   this.retrieveMessages('past', date, false, false);
            // }
            // just provide the messages we have so far
            break;
          }
          // just decrement the messageIndex since we can stay in the same month
          else {
            log(`getPastmessages decrementing tailMessageIndex ${tailMessageIndex} and incrementing messagesWindowSize ${messagesWindowSize}`);
            tailMessageIndex--;
            messagesWindowSize++;
          }
        }

        // if the window does cover as many messages as the window limit,
        // move both the tail and the head backwards
        // windowMessaagesSize === messagesWindowLimit in this case.
        // messagesWindowSize should never be large than the limit.
        // this is checked whenever the messageStream provides this conversation with messages
        else {

          // if we can move the tail then we can move the head
          let canShift = true;

          // if we're at the edge of a month, move the tail's month downward
          // otherwise just decrement the index
          // in terms of iteration though, we are decrementing the messageIndex and incrementing the monthIndex
          if(tailMessageIndex === 0 && tailMonthIndex < yearMonths.length-1){
            tailMonthIndex++;
            tailMessageIndex = yearMonths[tailMonthIndex].length-1;
          }
          // we need more messages since we can't move the window
          else if (tailMessageIndex === 0){
            canShift = false;
          }
          // we can move the window and we're not at a boundary, just decrement the index
          else {
            tailMessageIndex--;
          }

          // if we can move the tail then do the same for the head.
          if(canShift){
            // log("getPastMessages canshift");
            if(headMessageIndex === 0){
              headMonthIndex++;
              headMessageIndex = this.messages[yearMonths[headMonthIndex]].length-1;
            }
            // we can move the window and we're not at a boundary, just decrement the index
            else {
              headMessageIndex--;
            }

          }
          // if we can't move the window then we've run out of messages, request some more
          else{
            // log(`getPastMessages retrieving messages because the window can't move`);

            // only retrieve messages if this is user initiated because we don't need infinite loops
            // if (checkRemote){
            //   let date = new Date(parseInt(this.messages[yearMonth][0].slice(13)));

            //   this.retrieveMessages('past', date, false, false);
            // }
            // just provide the messages we have so far
            break;
          }
        }

      }
      if(hitGap){
        // doing a nested loop breakout.
        break;
      }
    }

    this.messageTail.month = yearMonths[tailMonthIndex];
    this.messageTail.index = tailMessageIndex;
    this.messageHead.month = yearMonths[headMonthIndex];
    this.messageHead.index = headMessageIndex;
    this.messagesWindowSize = messagesWindowSize;
    // log(`getPastMessages End: head ${this.messageHead.month} @ ${this.messageHead.index}, tail ${this.messageTail.month} @ ${this.messageTail.index}`);
    // return if empty handed
    // if (messageFilePaths.length === 0){
    //   return [];
    // }

    this.save();
    window.conversations[this.conversationKey] = this;
    // if(messageFilePaths.length < this.messagesWindowLimit){
    return this.getPresentMessages();
    // }

    // // make them earliest to latest
    // messageFilePaths.reverse();

    // let messages = await Message.storedObjectBulkLoad(messageFilePaths);
    // this.save();
    // return messages;
  }

  async getLatestMessages(checkRemote=false){
    log(`getLatestMessages checkRemote: ${checkRemote}`);

    // we're going to retrieve the latest messages from the server
    // when we get the latest messages via pull we always check for a gap in messages.
    if(checkRemote){
      // getLatest==true, jump==true
      // this will get messages then jump after they're ingested
      this.retrieveMessages('latest', new Date(), false, true);
    }
    // this will only jump to the latest messages
    return this.setMessageWindow();
    
  }

  async getFutureMessages(checkRemote=false){
    log(`getFutureMessages`);
    // get all months with messages
    let yearMonthsAll = Object.keys(this.messages);
    if(yearMonthsAll.length === 0){
      return [];
    }


    // in order to go back to the past we shift the messageTail back by 50
    // and assign the messageHead to where the messageTail was or max(50 spaces away, #messages away)

    // get the year months that we care about
    let yearMonths = [];
    // log("conversation getMessages, before yearMonthsAll loop");
    for(let i=0;i<yearMonthsAll.length;++i){
      if(yearMonthsAll[i] <= this.messageHead.month){
        yearMonths.push(yearMonthsAll[i]);
      }
    }

    // sort the months we're left with in reverse order
    yearMonths.sort(); // ['2019-12', '2020-01', '2020-02', '2020-03', ..., yearMonth]

    let headMonthIndex = yearMonths.indexOf(this.messageHead.month); // used to avoid string comps
    let tailMonthIndex = yearMonths.indexOf(this.messageTail.month); // used to avoid string comps

    let headMessageIndex = this.messageHead.index; // keeps track of the head's index position as we're shifting the window
    let tailMessageIndex = this.messageTail.index; // keeps track of the tail's index position as we're shifting the window
    let messagesWindowSize = this.messagesWindowSize;

    let slideQuota = 25;
    let slideCount = 0;

    let messageFilePaths = [];
    let hitGap = false;

    for(let y=tailMonthIndex;y<yearMonths.length;++y){
      // log(`getFutureMessages outer loop`);
      let yearMonth = yearMonths[y];
      let lastMessageIndex = this.messages[yearMonth].length-1;

      // log(`getFutureMessages, yearMonth: ${yearMonth}, lastMessageIndex: ${lastMessageIndex}`);
      // log(`getFutureMessages, tailMessageIndex ${tailMessageIndex}, messageFilePaths.length ${messageFilePaths.length}, limit ${this.messagesWindowLimit}`);

      // for(let index = this.messageHead.index;index<this.messages[yearMonth].length && messageFilePaths.length < this.messagesWindowLimit;++index){
      for(let index = this.messageHead.index;index<this.messages[yearMonth].length && slideCount < slideQuota;++index){
        // if we hit a gap we need to request more messages
        // no need to wait for a return message, they'll fill in on their own
        log(`getFutureMessages innerloop messageKey ${this.messages[yearMonth][index]}`);

        if (this.messages[yearMonth][index].endsWith('/gapahead')){
          log(`getFutureMessages retrieving messages because we hit a gapahead -  month: ${yearMonth} index: ${index}`);
          if (checkRemote){
            let date = new Date(parseInt(this.messages[yearMonth][index].slice(0,13)));
            this.retrieveMessages('future', date, true, false, this.messages[yearMonth][index]);
          }
          // just provide the messages we have so far
          // nested loop breakout
          hitGap = true;
          break;
        }
        if(this.messages[yearMonth][index].endsWith('/gapbehind')){
          let message = await Message.load(`${this.messages[yearMonth][index].slice(14,36)}`);
          log(`getFutureMessages retrieving messages because we hit a gapbehind - month: ${yearMonth} index: ${index}, key: ${this.messages[yearMonth][index]}, message: ${message.message}`);
          if (checkRemote){
            let lookUpIndex = Math.max(index-1, 0);

            log(`getFutureMessages checking remote borderKey, ${this.messages[yearMonth][lookUpIndex]}`);
            let date = new Date(parseInt(this.messages[yearMonth][lookUpIndex].slice(0,13)));
            this.retrieveMessages('future', date, true, false, this.messages[yearMonth][lookUpIndex]);
          }
          hitGap = true;
          break;
        }

        slideCount++;
        // add the message
        // messageFilePaths.push(this.messages[yearMonth][index].slice(14));

        // if the window doesn't cover as many messages as the window limit,
        // move head to expand it
        if(messagesWindowSize < this.messagesWindowLimit){
          // log("getFutureMessages, window size is less than the window limit");

          // if we're at the edge of a month, move the head's month forward
          // otherwise just inecrement the index
          // in terms of iteration though, we are incrementing the messageIndex and incrementing the monthIndex
          if(headMessageIndex === lastMessageIndex && headMonthIndex < yearMonths.length-1){
            // log("getFutureMessages, headMessage is lastMessage and headMonthindex is less than last yearMonth, increasing window size");
            headMonthIndex++;
            headMessageIndex = 0;
            messagesWindowSize++;
          }

          else if (headMessageIndex === lastMessageIndex){
            // log(`getFutureMessages retrieving messages beause the headMessageIndex is at the lastMessageIndex ${headMessageIndex} and the headMonthIndex has reached the latest month we have ${headMonthIndex}`);
            // just provide the messages we have so far
            break;
          }
          // just increment the messageIndex since we can stay in the same month
          else {
            // log("getFutureMessages, staying in the same month but incrementing headMessageIndex and the message window size");
            headMessageIndex++;
            messagesWindowSize++;
          }
        }

        // if the window does cover as many messages as the window limit,
        // move both the tail and the head 
        // windowMessaagesSize === messagesWindowLimit in this case.
        // messagesWindowSize should never be large than the limit.
        // this is checked whenever the messageStream provides this conversation with messages
        else {
          // if we can move the head then we can move the tail
          let canShift = true;
          // log(`getFutureMessages canShift`);
          // if we're at the edge of a month, move the heads's month forward
          // otherwise just increment the index
          // in terms of iteration though, we are incrementing the messageIndex and incrementing the monthIndex
          if(headMessageIndex === lastMessageIndex && headMonthIndex < yearMonths.length-1){
            headMonthIndex++;
            headMessageIndex = 0;
          }
          // we need more messages since we can't move the window
          else if (headMessageIndex === lastMessageIndex){
            canShift = false;
          }
          // we can move the window and we're not at a boundary, just decrement the index
          else {
            headMessageIndex++;
          }

          // if we can move the tail then do the same for the head.
          if(canShift){
            if(tailMessageIndex === this.messages[yearMonths[tailMonthIndex]].length-1){
              tailMonthIndex++;
              tailMessageIndex = 0;
            }
            // we can move the window and we're not at a boundary, just increment the index
            else {
              tailMessageIndex++;
            }

          }
          // if we can't move the window then we've run out of messages, request some more
          // this should break out of the inner loop and if we're at the end of all of the -
          // messages the outer loop will be broken as well.
          else{
            // log(`getFutureMessages retrieving messages beause the window can't shift`);

            // only retrieve messages if this is user initiated because we don't need infinite loops
            // if (checkRemote){
            //   this.retrieveMessages();
            // }
            break;
          }
        }
      }
      if (hitGap){
        break;
      }
    }

    this.messageTail.month = yearMonths[tailMonthIndex];
    this.messageTail.index = tailMessageIndex;
    this.messageHead.month = yearMonths[headMonthIndex];
    this.messageHead.index = headMessageIndex;
    this.messagesWindowSize = messagesWindowSize;
    // return if empty handed
    // if (messageFilePaths.length === 0){
    //   return [];
    // }
    this.save();
    window.conversations[this.conversationKey] = this;
    // if (messageFilePaths.length < this.messagesWindowLimit){
    return this.getPresentMessages();
    //}

    // let messages = await Message.storedObjectBulkLoad(messageFilePaths);
    // this.save();
    // return messages;
  }

  async getPresentMessages(){
    log(`getPresentMessages`);
    // get all months with messages
    let yearMonthsAll = Object.keys(this.messages);
    if(yearMonthsAll.length === 0){
      return [];
    }

    // get the year months that we care about
    let yearMonths = [];
    // log("conversation getMessages, before yearMonthsAll loop");
    for(let i=0;i<yearMonthsAll.length;++i){
      if(yearMonthsAll[i] >= this.messageTail.month && yearMonthsAll[i] <= this.messageHead.month){
        yearMonths.push(yearMonthsAll[i]);
      }
    }

    // sort the months we're left with
    yearMonths.sort(); // ['2019-12', '2020-01', '2020-02', '2020-03', ..., yearMonth]

    let headMonthIndex = yearMonths.indexOf(this.messageHead.month); // used to avoid string comps
    let tailMonthIndex = yearMonths.indexOf(this.messageTail.month); // used to avoid string comps

    let messageFilePaths = [];
    // log(`getPresentMessages ${this.messageHead.month}:${headMonthIndex}, ${this.messageTail.month}:${tailMonthIndex} - yearMonths`, yearMonths);
    // log(`getPresentMessages this.messages`, this.messages);
    for(let y=tailMonthIndex;y<yearMonths.length;++y){
      let yearMonth = yearMonths[y];
      let lastMessageIndex = this.messages[yearMonth].length-1;

      for(let index = y === tailMonthIndex ? this.messageTail.index : 0; index<this.messages[yearMonth].length && !(y === headMonthIndex && index > this.messageHead.index);++index){
        // no shifting of the window happens in present,
        ///we just return what's in between the tail and head keep it simple

        // add the message
        messageFilePaths.push(this.messages[yearMonth][index].slice(14,36));
      }
    }

    // log(`getPresentMessages messageFilePaths`, messageFilePaths);
    // return if we're empty handed
    if (messageFilePaths.length === 0){
      return [];
    }

    // load the messages
    let messages = await Message.storedObjectBulkLoad(messageFilePaths);
    // log(`getPresentMessages messages`, messages);
    return messages;
  }


  async deleteAllMessages(){
    // log("deleting all messages for conversation:", this.personaFingerprint, this.otherPartyFingerprint);
    let messageArrArr = Object.values(this.messages);
    let messageFilePaths = [];
    for(let arr=0;arr<messageArrArr.length;++arr){
      messageFilePaths = messageFilePaths.concat(messageArrArr[arr]);
    }
    if (messageFilePaths.length > 0){
      await Message.storedObjectBulkDelete(messageFilePaths);
    }
    this.messages = {};
    await this.save();
  }

  static async bulkDelete(conversations){
    log("bulkDelete conversations: ", conversations);
    let messageKeys = [];
    let conversationFilePaths = [];
    for(let conversation of conversations){

      conversation.unsubscribe();
      delete window.conversations[conversation.conversationKey];
      messageKeys.push(Object.values(conversation.messages).flat());
      conversationFilePaths.push(conversation.filePath);
    }
    let messageFilePaths = messageKeys.map(x => x.slice(14,36));
    Message.storedObjectBulkDelete(messageFilePaths);
    return await Conversation.storedObjectBulkDelete(conversationFilePaths);
  }

  static async bulkWipe(identity, conversations){
    let conversationPersonae = {};
    // we need to wipe the messages of the second bunch.
    let messageKeys = [];
    for(let conversation in conversations){
      conversationPersonae[conversation.conversationKey] = conversation.getSenderPersona(identity);
      messageKeys.push(Object.values(conversation.messages).flat());
    }

    let messageFilePaths = messageKeys.map(x => x.slice(14,36));

    let alteredMessages = [];
    let messageAlteringPromises = [];

    for(let i=0;i<messageFilePaths.length;){
      let rangeEnd = Math.min(i+1000, messageFilePaths.length);
      let messageRange = messageFilePaths.slice(i,rangeEnd);
      messageAlteringPromises.push(Message.storedObjectBulkLoad(messageRange)
        .then((messages)=>{
          for(let m=0;m<messages.length;m++){
            if(messages[m].status.slice(-4) === 'sent'
              && (messages[m].personaFingerprint in conversationPersonae[messages[m].conversationKey])){
              messages[m].status = 'read';
              alteredMessages.push(messages[m]);
            }
          }
      }));
      
      i = rangeEnd;
    }

    // make sure all messages we're going to alter are added.
    await Promise.allSettled(messageAlteringPromises);
    // save all the altered messages
    return await Message.storedObjectBulkSave(alteredMessages);
  }

  async wipe(identity){
    let senderPersona = conversatino.getSenderPersona(identity);
    let messageFilePaths = Object.values(this.messages).flat().map(x => x.slice(14,36));
    
    let alteredMessages = [];
    let messageAlteringPromises = [];

    for(let i=0;i<messageFilePaths.length;){
      let rangeEnd = Math.min(i+1000, messageFilePaths.length);
      let messageRange = messageFilePaths.slice(i,rangeEnd);
      messageAlteringPromises.push(Message.storedObjectBulkLoad(messageRange)
        .then((messages)=>{
          for(let m=0;m<messages.length;m++){
            if(messages[m].status.slice(-4) === 'sent'
              && (messages[m].personaFingerprint in conversationPersonae[messages[m].conversationKey])){
              messages[m].status = 'read';
              alteredMessages.push(messages[m]);
            }
          }
      }));
      
      i = rangeEnd;
    }

    // make sure all messages we're going to alter are added.
    await Promise.allSettled(messageAlteringPromises);
    // save all the altered messages
    return await Message.storedObjectBulkSave(alteredMessages);

  }

  static async getConversationWithKey(conversationKey){
    log("Conversation getConversationWithKey key", conversationKey);
    const [identityFilePath, conversationType, circleFilePath, otherPartyFilePath] = conversationKey.split('/');
    // log('Conversation getConversationWithKey', identityFilePath, conversationType, circleFilePath, otherPartyFilePath);

    if (circleFilePath){
      let circle = window.circles[circleFilePath];
      if(!circle){throw("circle doesn't exist");}
      conversationKey = `null/${conversationType}/${circleFilePath}/${otherPartyFilePath}`;
      return await circle.getConversationWithKey(conversationKey);
    }

    let identity = window.identities[identityFilePath]; //window.circleManager.fingerprint2Instance('identity', identityFingerprint);
    if(!identity){throw("identity doesn't exist");}
    return await identity.getConversationWithKey(conversationKey);
  }


  async delete(){
    await this.deleteAllMessages();
    await this.unsubscribe();
    await Conversation.storedObjectDelete(this.filePath);
  }

  static async delete(filePath){
    let existingConversation = await Conversation.load(filePath);
    if (existingConversation){
      await existingConversation.deleteAllMessages();
      await existingConversation.delete();
    }
  }


}

class QueryData extends StoredObject {
  constructor(
    filePath = undefined,
    monthYear = '' // 2020-01, year-month
    ) {
    super(filePath=filePath);
    if (timeFrame == ''){
      let date = new Date();
      this.timeFrame = `${date.getFullYear()}-${date.getMonth()}`;
    }
    else{
      this.timeFrame = timeFrame;
    }
    this.terms = []; // list of strings objects, {circles: [filePath list], terms: 'search terms'}
    this.store = 'queries';
    this.circle = '';
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let queryData = new QueryData(inFilePath);
    // log("loading queryData", queryData);
    let loaded = await queryData.load(inFilePath);
    // log("checking queryData load", loaded);
    if (loaded)
      return queryData;
    return false;
  }

  static get store() {
    return 'queries';
  }
}

// Each identity gets at least one of these.
// This is the data that the identity builds up per circle
class CircleData extends StoredObject {
  constructor(
    filePath = undefined,
    circleFilePath = undefined,
    identityFilePath = undefined,
    identityData = false,
    revocations = {}, // {fingerprint: }
    internalQueries = {}, // {"date-year/month": filePath for QueryData}
    externalQueries = {},  // {"day-year/month": filePath for QueryData}
    sentVouchRequests = {}, // {fingerprint of persona voucher: filePath for AccessRequestObject}  I thought about deduplicating these things but damned if it doesn't make it easy to reason about when I'm tired.
    receivedVouchRequests = {}, // {fingerprint of persona vouchee: filePath for AccessRequestObject}
    sentVouchResponses = {}, // {fingerprint of persona vouchee: filePath for AccessRequestObject}
    receivedVouchResponses = {}, // {fingerprint of persona voucher: filepath for AccessRequestObject}
    sentAccessRequests = {}, // {fingerprint of persona requestee: filePath for AccessRequestObject}
    receivedAccessRequests = {}, // {fingerprint of persona requester: filePath for AccessRequestObject} this is ultimately passed back to the vouchee
    sentAccessResponses = {}, // {fingerprint of persona vouchee : filePath for AccessRequestObject}
    receivedAccessResponses = {}, // {fingerprint of persona voucher: filepath for AccessRequestObject}
    sentGeneralVotes = {}, // {"date-year/month": filePath for VoteData list}
    receivedGeneralVotes = {}, // {"date-year/month": filePath for VoteData list}
    subscriptions = []
  ){
    super(filePath = filePath);
    this.typeName = 'CircleData';
    this.circleFilePath = circleFilePath;
    this.identityFilePath = identityFilePath;
    this.identityData = identityData; // this 'circledata' actually belongs to an identity, not a circle
    this.revocations = revocations;
    this.internalQueries = internalQueries; // {"date-year/month": filePath for QueryData}
    this.externalQueries = externalQueries;  // {"day-year/month": filePath for QueryData}
    this.sentVouchRequests = sentVouchRequests;
    this.receivedVouchRequests = receivedVouchRequests; // {fingerprint of persona vouchee: filePath for VoteObject}
    this.sentVouchResponses = sentVouchResponses; // {fingerprint of persona vouchee: filePath for VoteObject}
    this.receivedVouchResponses = receivedVouchResponses; // {fingerprint of persona voucher: filepath for VoteObject}
    this.setAccessRequests = sentAccessRequests;
    this.receivedAccessRequests = receivedAccessRequests; // {fingerprint of persona voucher: filePath for VoteObject} this is ultimately passed back to the vouchee
    this.sentAccessRespones = sentAccessResponses; // {fingerprint of persona vouchee : filePath for VoteObject}
    this.receivedAccessResponses = receivedAccessResponses; // {fingerprint of persona voucher: filepath for VoteObject}
    this.sentGeneralVotes = sentGeneralVotes; // {"date-year/month": filePath for VoteData}
    this.receivedGeneralVotes = receivedGeneralVotes; // {"date-year/month": filePath for VoteData}
    this.store = "circledata";
  }

  async addVouchRequests(vouchRequests=[]){
    // add vouch requests
    let fingerprintPromises = [];
    for (let i=0;i<vouchRequests.length;++i){
      // log("adding vouch request", vouchRequests[i].personae_bundle.core.publicKey);
      fingerprintPromises.push(salty.getFingerprint(vouchRequests[i].personae_bundle.core.publicKey));
    }
    for(let i=0;i<fingerprintPromises.length;++i){
      let fingerprint = await fingerprintPromises[i];
      let avatar = (await utils.getIdenticon(fingerprint)).src;
      let name = await salty.getPublicKeyName(vouchRequests[i].personae_bundle.core.publicKey);
      vouchRequests[i].avatar = avatar;
      //// console.log("addvouchrequests", avatar);
      vouchRequests[i].fingerprint = fingerprint;
      vouchRequests[i].name = name;
      // vouchRequests[i].name 
      if (fingerprint.length){
        this.receivedVouchRequests[fingerprint] = vouchRequests[i];
      }
    }
    await this.save();
  }

  static get store() {
    return "circledata";
  }

  static get typeName(){
    return "CircleData";
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let circleData = new CircleData(inFilePath);
    // log("loading circleData", circleData);
    let loaded = await circleData.load(inFilePath);
    // log("checking circleData load", loaded);
    if (loaded)
      return circleData;
    return false;
  }

  getCircle(){
    if (this.identityData){
      return null;
    }
    return window.circles[this.circleFilePath];
  }

  getIdentity(){
    return window.identities[this.identityFilePath];
  }

  static async bulkDelete(circleDatae){
    // for the time being this only deletes the object itself.
    // when we add more things to it like all the stuff in the constructor above this will be a bit more complex
    let filePaths = circleDatae.map(x => x.filePath);
    return CircleData.storedObjectBulkDelete(filePaths);
  }
}


class Message extends StoredObject {
  // All messages MUST belong to a living conversation.
  // If not, they will be deleted if anyone tries to save or alter them.
  // Orphaned Objects are just the WORST.
  constructor(
    filePath = undefined,
    conversationKey = undefined,
    signedDate = undefined,
    receivedDate = undefined,
    networkReceivedDate = undefined,
    personaFingerprint = "",
    signature = "",
    outerSignature = "",
    message = "",
    messageType = "",
    status = 'unsent'
  ){
    super(filePath = filePath);
    this.conversationKey = conversationKey;
    this.typeName = 'Message';

    this.signedDate = signedDate; // utc time as milliseconds
    if (signedDate && (signedDate <= Number.MIN_SAFE_INTEGER || signedDate >= Number.MAX_SAFE_INTEGER)){
      throw new Error("Could not construct message, signedDate is invalid");
    }

    this.receivedDate = receivedDate; // this will only be defined when the message is either read or unread,  utc time as milliseconds
    if (receivedDate && (receivedDate <= Number.MIN_SAFE_INTEGER || receivedDate >= Number.MAX_SAFE_INTEGER)){
      throw new Error("Could not construct message, receivedDate is invalid");
    }

    this.networkReceivedDate = networkReceivedDate; // utc time as milliseconds
    if (networkReceivedDate && (networkReceivedDate <= Number.MIN_SAFE_INTEGER || networkReceivedDate >= Number.MAX_SAFE_INTEGER)){
      throw new Error("Could not construct message, networkReceivedDate is invalid");
    }

    this.personaFingerprint = personaFingerprint;
    this.message = message;
    this.messageType = messageType;
    this.signature = signature;
    this.outerSignature = outerSignature;
    this.status = status; // unread, read, unsent, sent, throttled, error.  i.e. we've read it or haven't, sent it or haven't.  or something screwed up
    this.store = "messages";
  }

  async save(){

    return super.save();
  }

  static get store() {
    return "messages";
  }

  static get typeName(){
    return "Message";
  }

  static async load(inFilePath){
    if (!inFilePath){
      throw new Error("inFilePath is undefined");
    }
    // log("message infilepath", inFilePath);
    let outMessage = new Message(inFilePath);
    // log("loading message", outMessage);
    let loaded = await outMessage.load(inFilePath);
    // log("checking message load", loaded);
    if (loaded)
      return outMessage;
    return false;
  }

  static async bulkSave(inObjects){
    // log("message bulkSave inObjects", inObjects);
    return this.storedObjectBulkSave(inObjects);
  }

  static async bulkLoad(inFilePaths){
    // log("message infilepaths", inFilePaths);
    let loadedMessages = await this.storedObjectBulkLoad(inFilePaths);
    let messagesObject = {}; 
    for (let i=0;i<loadedMessages.length;++i){
      if (loadedMessages[i] !== undefined){
        messagesObject[inFilePaths[i]] = loadedMessages[i];
      }
    }
    return messagesObject;
  }

  static async getMessage(messageKey){
    // for convenience, I don't want to slice it myself everytime for debugging
    // there's also a version in conversation.
    let message = await Message.load(messageKey.slice(14,36));
    return message;
  }

  get messageKey(){
    // no need to save it.  It's quick enough to generate
    let messageKeyString = `${this.date}/${this.filePath}`;
    return messageKeyString;
  }

  get yearMonth(){
    let date = new Date(this.date);
    let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
    return yearMonth
  }

  getSafeMessage(){
    return {
      personaFingerprint: this.personaFingerprint,
      signedDate: this.signedDate,
      networkReceivedDate: this.networkReceivedDate,
      receivedDate: this.receivedDate,
      status: this.status,
      message: this.message,
      signature: this.signature
    };
  }

  getSafeMessageNotification(){
    return {
      personaFingerprint: this.personaFingerprint,
      signedDate: this.signedDate,
      networkReceivedDate: this.networkReceivedDate,
      receivedDate: this.receivedDate,
      status: this.status,
    };
  }

  static messageObjectCompare(msg1, msg2){
    let cmpDate1 = msg1.receiptDate? msg1.receiptDate: msg1.dateStamp;
    let cmpDate2 = msg2.receiptDate? msg2.receiptDate: msg2.dateStamp;

    return cmpDate1 < cmpDate2;
  }

  get date(){
    // the date we can say it was first verified
    if(this.networkReceivedDate){
      return this.networkReceivedDate;
    }
    if(this.receivedDate){
      return this.receivedDate;
    }
    return this.signedDate;
  }

  get systemDate(){
    // the date when it entered our system
    if(this.receivedDate){
      return this.receivedDate;
    }
    return this.signedDate;
  }

  async getConversation(){
    // log("Message getConversation", this.conversationKey);
    let conversation = await Conversation.getConversationWithKey(this.conversationKey);
    return conversation;
  }

  static async createIncoming(messageObject, conversation){
    // log("Message createIncoming", messageObject, conversation);
    // this is only for incoming messages, not messages that originate from us
    let circle = window.circleManager.fingerprint2Instance('circle', conversation.circleFingerprint);
    let senderPersona = await Persona.lookUp(messageObject.senderPersonaPublicKey, circle);
    // log("Message createIncoming the persona", senderPersona);
    let receivedDate = new Date();
    let signedDate = new Date(messageObject.dateStamp);
    let networkReceivedDate = new Date(messageObject.receiptDate);

    let incomingMessage = new Message(
      undefined, // filePath
      conversation.conversationKey, // conversationFilePath, this links the sender, receiver, verifiers, messages, identities and circles
      signedDate.getTime(), // signedDate
      receivedDate.getTime(), //  receivedDate this is only set for messages that we've received.  for messages we send it's never set
      networkReceivedDate.getTime(), // networkReceivedDate this is only set for messages that we've received.  for message we send it's never set.  this date is when it arrived at the the message hub that we're retrieving it from.
      senderPersona.fingerprint, // personaFingerprint
      messageObject.signature, // signature
      messageObject.outerSignature, // signature of the outerMessage that we check against for duplicates
      messageObject.message, // message
      messageObject.messageType, // messageType
      status=senderPersona.internal ? 'sent': 'unread' // status
    );


    //await incomingMessage.save();

    return incomingMessage;
  }
}

class MessageStreamData extends StoredObject {
  constructor(
    filePath = undefined,
    messageHub = '',
    handlerClassName = '',
    confirmationHandlerName = '',
    denialHandlerName = '',
    connectionHandlerName = '',
    pushHandlerName = '',
    pullHandlerName = '',
    subscriptions = {},
    transmittedMessages = {},
    pendingSubscriptions = {},
    pendingMessages = {},
    messageCount = 0
    ){
    super(filePath = filePath);
    this.store = "messageStreamData";
    this.typeName = "MessageStreamData";

    this.messageHub = messageHub;
    this.handlerClassName = handlerClassName;
    this.confirmationHandlerName = confirmationHandlerName;
    this.denialHandlerName = denialHandlerName;
    this.connectionHandlerName = connectionHandlerName;
    this.pushHandlerName = pushHandlerName;
    this.pullHandlerName = pullHandlerName;

    this.subscriptions = subscriptions; // {subscription key: {lastViewedDate: Date(), keys: [conversationKey1, ...]}] | // max 100, Last recently viewed
    this.transmittedMessages = transmittedMessages; // The messages that have been sent to the server and are waiting for a reply
    this.pendingSubscriptions = pendingSubscriptions; // list of pending subscriptions.
    this.pendingMessages = pendingMessages;  // object of { messageID : { filepath : message } } tuples
    this.sendingMessages = {};  // object of { messageID : { filepath : message } } tuples
    this.messageCount = messageCount;
  }

  async save(){
    return super.save();
  }

  static get store() {
    return "messageStreamData";
  }

  set typeName(typeName){
    //this.tipnm = "MessageStreamData";
  }

  get typeName(){
    return "MessageStreamData";
  }

  static async load(inFilePath){
    // log("message infilepath", inFilePath);
    let outMessageStreamData = new MessageStreamData(inFilePath);
    // log("loading message", outMessageStreamData);
    let loaded = await outMessageStreamData.load(inFilePath);
    // log("checking message load", loaded);
    if (loaded)
      return outMessageStreamData;
    return false;
  }

  static async bulkLoad(inFilePaths){
    // log("message infilepaths", inFilePaths);
    let loadedMessageStreamData = await this.storedObjectBulkLoad(inFilePaths);
    let dataObject = {}; 
    for (let i=0;i<loadedMessageStreamData.length;++i){
      if (loadedMessageStreamData[i] !== undefined){
        dataObject[inFilePaths[i]] = loadedMessageStreamData[i];
      }
    }
    return dataObject;
  }

  static async bulkLoadAll(){
    // log("MessageStreamData bulkLoadAll");
    return this.storedObjectBulkLoadAll();
  }
}

class MessageStream {  // only one active MessageStream per messageHub.  Saved to storage to keep track of subscriptions and whether we're polling or allowing pushes
  constructor(
    msData = undefined
  ){
    if (!msData){
      throw Error("MessageStream requires a MessageStreamData object to instantiate");
    }
    this.msData = msData;
    //this.url = this.msData.messageHub.url;
    this.url = `${this.msData.messageHub.url.replace('https', 'wss')}/`;
    //this.socket = new WebSocket(this.url);



    if (this.msData.handlerClassName){
      // console.log("window handlerclassname", this.msData.handlerClassName, window[this.msData.handlerClassName]);
      this.confirmationHandler = window[this.msData.handlerClassName][this.msData.confirmationHandlerName];
      this.denialHandler = window[this.msData.handlerClassName][this.msData.denialHandlerName];
      this.connectionHandler = window[this.msData.handlerClassName][this.msData.connectionHandlerName];
      this.pushHandler = window[this.msData.handlerClassName][this.msData.pushHandlerName];
      this.pullHandler = window[this.msData.handlerClassName][this.msData.pullHandlerName];
    }
    else{
      this.confirmationHandler = this.msData.confirmationHandlerName;
      this.denialHandler = this.msData.denialHandlerName;
      this.connectionHandler = this.msData.connectionHandlerName;
      this.pushHandler = this.msData.pushHandlerName;
      this.pullHandler = this.msData.pullHandlerName;
    }

    // required connection management info, not saved
    this.connecting = false;
    this.shuttingDown = false;
    this.pingFunctionId = -1;
    this.reopener = -1;
    this.reconnectionFallOff = 1;
    this.failedPingAttempts = 0;


  }

  async save(){
    this.msData.save();
  }

  sendPendingMessages() {
    // log("attempting to send pending messages");
    if (this.connecting === true){
      warn("MessageStream not ready yet, checking again later so we can try to send messages", this.socket);
      //wait(1000).then(()=>{this.sendPendingMessages()});
      return;
    }
    else if(!this.socket || this.socket.readyState > 1){
      warn("MessageStream not connected, will try again upon reconnection.", this);
      return;
    }

    // the socket is ready, lets send stuff.

    //log("pendingMessages Length", this.url, this.msData.pendingMessages.size);
    let messageSendingPromises = [];

    // stop pinging
    window.clearInterval(this.pingFunctionId);
    this.pingFunctionId = -1;

    // send each one with a delay to not dos the server.  right now only un/subscriptions are sent jointly
    // normal messages are sent individually for ease and maybe congestion.  Benchmarking latter if necessary

    // we move all of the pending messages into sending messages
    // so we don't accidently send duplicate messages
    // in this way we also avoid the need to keep track of whether we're sending messages or not
    // because of how we space out messages being sent when they're backlogged.
    let i = 0;
    for (let id in this.msData.pendingMessages){
      this.msData.sendingMessages[id] = this.msData.pendingMessages[id];
      delete this.msData.pendingMessages[id];

      messageSendingPromises.push(wait(i*200)
        .then(() => {
          let outMessage = {};
          if (this.msData.sendingMessages[id].purpose.includes("subscribe")){
            // log("sending subscribe message");
            outMessage = {
              id: this.msData.sendingMessages[id].id,
              purpose: this.msData.sendingMessages[id].purpose,
              subscriptions: this.msData.sendingMessages[id].messageTuple.subscriptions
            };
          }
          else if(this.msData.sendingMessages[id].purpose.includes("getMessages")){
            // log("sending getMessages message");
            outMessage = {
              id: this.msData.sendingMessages[id].id,
              purpose: this.msData.sendingMessages[id].purpose,
              verifier: this.msData.sendingMessages[id].messageTuple.verifier,
              receiver: this.msData.sendingMessages[id].messageTuple.receiver,
              date: this.msData.sendingMessages[id].messageTuple.date,
              verificationType: this.msData.sendingMessages[id].messageTuple.verificationType
            };
            if(this.msData.sendingMessages[id].messageTuple.ascending){
              outMessage.ascending = this.msData.sendingMessages[id].messageTuple.ascending;
            }
            if(this.msData.sendingMessages[id].messageTuple.sender){
              outMessage.sender = this.msData.sendingMessages[id].messageTuple.sender;
            }
          }
          else if(this.msData.sendingMessages[id].purpose.includes("sendMessage")) {
            // log("sending sendMessage message");
            outMessage = {
              id: this.msData.sendingMessages[id].id,
              purpose: this.msData.sendingMessages[id].purpose,
              verificationType: this.msData.sendingMessages[id].messageTuple.verificationType,
              message: this.msData.sendingMessages[id].messageTuple.message
            };
          }

          this.msData.transmittedMessages[id] = this.msData.sendingMessages[id];
          delete this.msData.sendingMessages[id];

          // if the send fails there will be an onclose event
          this.socket.send(JSON.stringify(outMessage));
          // log("pending message sent", outMessage);
      }));
    }
 
    Promise.allSettled(messageSendingPromises).then(()=>{
      if (this.pingFunctionId == -1){
        // start pinging again to keep the connection open
        this.pingServer();
      }
    });
  }

  subscriptionExists(subscriptionKey){
    // Checks to see if it's an active subscription
    return subscriptionKey in this.msData.subscriptions;
  }

  subscriptionPending(subscriptionKey){
    // Checks to see if it's a pending subscription
    for(let k=0;k<this.msData.pendingSubscriptions.length;++k){
      if (subscriptionKey == this.msData.pendingSubscriptions[k]){
        return true;
      }
    }
    return false;
  }

  reQueueSubscriptions(){
    // combine the subscriptions and pending subscriptions so that we can resubscribe
    let newPS = Object.assign({}, this.msData.subscriptions);
    let conversationIndex = -1;
    for(let sub in this.msData.pendingSubscriptions){
      if (!(sub in newPS)){
        newPS[sub] = this.msData.pendingSubscriptions[sub];
      }
      else{
        if (!Array.isArray(newPS[sub])){
          newPS[sub] = [];
        }
        for(let convoKey of this.msData.pendingSubscriptions[sub]){
          conversationIndex = newPS[sub].indexOf(convoKey);
          if (conversationIndex === -1){
            newPS.push(convoKey);
          }
        }
      }
    }

    for(let sub in newPS){
      if(newPS[sub].length === 0){
        delete newPS[sub];
      }
    }
    delete this.msData.subscriptions;
    this.msData.subscriptions = {};
    this.msData.pendingSubscriptions = newPS;

    let subscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'subscribe',
      messageTuple: {filePath: null, subscriptions: Object.keys(this.msData.pendingSubscriptions)}
    };

    // log("requeuing subscriptions", this.msData.pendingMessages);
    for(let key in this.msData.pendingMessages){
      // log("this.msData.pendingMessages i", this.msData.pendingMessages[key]);
      if (this.msData.pendingMessages[key].purpose.includes("subscribe")){
        // log("deleting message because the purpose is a subscription task");
        delete this.msData.pendingMessages[key];
      }
    }
    let existingRequests = {};
    for(let key in this.msData.transmittedMessages){
      // log("this.msData.transmittedMessages i", this.msData.transmittedMessages[key]);
      if (this.msData.transmittedMessages[key].purpose.includes("subscribe")){
        // log("deleting message because the purpose is a subscription task");
        delete this.msData.transmittedMessages[key];
      }
      
      if(this.msData.transmittedMessages[key] && this.msData.transmittedMessages[key].purpose.includes("getMessages")){
        let msgName = `${this.msData.transmittedMessages[key].purpose}/${this.msData.transmittedMessages[key].verificationType}/${this.msData.transmittedMessages[key].receiver}/
          ${this.msData.transmittedMessages[key].verifier}/${this.msData.transmittedMessages[key].date}`;
        if(msgName in existingRequests){
          delete this.msData.transmittedMessages[key]
        }
        else{
          existingRequests[msgName] = 1;
        }
      }
    }

    this.msData.pendingMessages[subscribeMessage.id] = subscribeMessage;
    this.save();
    this.sendPendingMessages();
  }

  subscriptionSorter(left, right){
    if (left[1].lastUsed < right[1].lastUsed){
      return -1;
    }
    if(left.lastUsed > right.lastUsed){
      return 1;
    }
    return 0;
  }

  addSubscriptions(inSubscriptions = {}) {
    // log("MessageStream adding subscriptions", inSubscriptions);
    let keys = [];

    // handle each subscription key that the conversation needs to be subscribed to
    // {subscription key: identityfingerprint/conversationtype/circlefingerprint(optional)/otherpersonafingerprint}
    for (let key in inSubscriptions) {
      let conversationKey = inSubscriptions[key];
      if (this.subscriptionExists(key)){
        // log("MessageStream the subscription exists", key);
        // subscription already exists, add the circle data to the array to be updated about received messages
        // add the conversationKey if it's unique
        if (this.msData.subscriptions[key].indexOf(conversationKey) < 0){
          this.msData.subscriptions[key].push(conversationKey);
        }
      }
      else if(this.subscriptionPending(key)) {
        // The subscription is pending and should become active soon, add the conversation so it will be updated.
        // log("MessageStream the subscription is pending", key);

        // don't add the same conversationKey
        if (this.msData.pendingSubscriptions[key].indexOf(conversationKey) < 0){
          // log("MessageStream the conversationKey already exists in the pending subscription");
          this.msData.pendingSubscriptions[key].push(conversationKey);
        }
      }
      else{
        // The pending subscription does exist yet, create it and add a message to the queue
        this.msData.pendingSubscriptions[key] = [conversationKey];
        keys.push(key);
      }
    }

    // skip the rest if there's nothing to add
    if (keys.length === 0){
      // log("MessageStream no new subscriptions were added");
      return;
    }
    let subscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'subscribe',
      messageTuple: {filePath: null, subscriptions: keys}
    };
    // log("MessageStream subscribe message addsubscriptions", subscribeMessage);
    this.msData.pendingMessages[subscribeMessage.id] = subscribeMessage;
    this.sendPendingMessages();

    // remove the ones that haven't been used in a while
    let subscriptionsLRU = Object.entries(this.msData.subscriptions);
    if (subscriptionsLRU.length > 100){
      subscriptionsLRU.sort(this.subscriptionSorter);
      let subscriptionKeys = [];
      for(let i=100;i<subscriptionsLRU.length;++i){
        subscriptionKeys.push(subscriptionsLRU[0]);
      }
      this.truncateSubscriptions(subscriptionKeys);
    }
    this.save();
    window.messageStreams[this.url] = this;
  }

  truncateSubscriptions(keys = []){
    // remove it from our local subscriptions
    for (let key of keys){
      delete this.msData.subscriptions[key];
    }

    let unsubscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'unsubscribe',
      messageTuple: {filePath: null, subscriptions: keys}
    };


    // unsubscribe at the server
    this.msData.pendingMessages[unsubscribeMessage.id] = unsubscribeMessage;
    this.sendPendingMessages();
    this.save();
  }


  removeSubscriptions (subscriptionKeys = {}){
    let keys = [];

    for (let key in subscriptionKeys){
      let conversationKey = subscriptionKeys[key];
      let shouldUnsubscribe = false;

      // Check active subscriptions
      if (this.subscriptionExists(key)){
        let conversationKeyIndex = this.msData.subscriptions[key].indexOf(conversationKey);
        if (conversationKeyIndex >= 0){
          // remove the subscription if the conversation is subscribed.
          log("splicing conversationKey out of subscriptions", key, conversationKey);
          this.msData.subscriptions[key].splice(conversationKeyIndex, 1);
        }
        // If it's not empty the messageStream should still remain subscribed to the key
        if (this.msData.subscriptions[key].length == 0){
          shouldUnsubscribe = true;
        }
      }

      // Check pending subscriptions
      if(this.subscriptionPending(key)) {
        let conversationKeyIndex = this.msData.pendingSubscriptions[key].indexOf(conversationKey);
        if (conversationKeyIndex >= 0){
          log("splicing conversationKey out of pending subscriptions", key, conversationKey);

          this.msData.pendingSubscriptions[key].splice(conversationKeyIndex, 1);
        }
        // If it's not empty the messageStream should not be unsubscribed at the remoteService level
        if (this.msData.pendingSubscriptions[key].length >0){
          shouldUnsubscribe = false;
        }
      }

      // The key is in neither subscriptions or pendingSubscriptions, add the key to array for an unsubscribe message
      if (shouldUnsubscribe){
        keys.push(key);
      }
    }

    let unsubscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'unsubscribe',
      messageTuple: {filePath: null, subscriptions: keys}
    };
    
    this.msData.pendingMessages[unsubscribeMessage.id] = unsubscribeMessage;
    this.sendPendingMessages();
  }

  removeSubscriptionKeys(keys){
    let unsubscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'unsubscribe',
      messageTuple: {filePath: null, subscriptions: keys}
    };
    
    this.msData.pendingMessages[unsubscribeMessage.id] = unsubscribeMessage;
    this.sendPendingMessages();
  }

  forceUnsubscribe(subscriptionKey){
    let unsubscribeMessage = {
      id: this.msData.messageCount++,
      purpose: 'unsubscribe',
      messageTuple: {filePath: null, subscriptions: [subscriptionKey]}
    };
    this.msData.pendingMessages[unsubscribeMessage.id] = unsubscribeMessage;
    this.sendPendingMessages();
  }

  get subscriptions(){
    return this.msData.subscriptions;
  }

  send(messageBundle, callback, callbackParams){
    // log("MessageStream send - messageBundle", messageBundle);
    let pendingMessage = {id: this.msData.messageCount++, purpose: 'sendMessage', messageTuple: messageBundle, callback, callbackParams};
    this.msData.pendingMessages[pendingMessage.id] = pendingMessage;
    this.sendPendingMessages();
  }

  get(messageBundle, callback, callbackParams){
    // log("MessageStream get - messageBundle", messageBundle);
    let pendingMessage = {id: this.msData.messageCount++, purpose: 'getMessages', messageTuple: messageBundle, callback, callbackParams};
    this.msData.pendingMessages[pendingMessage.id] = pendingMessage;
    this.sendPendingMessages();
  }


  handleMessage(messageJson){
    //log("handleMessage", messageJson);
    // Check to see if it's a message confirmation
    let message = {};

    try{
      message = JSON.parse(messageJson.data);
    }
    catch(err){
      error("unable to parse the message", message);
      return;
    }
    //log("handleMessage before validate messageHubResponse", message);
    if (validate.messageHubResponse(message)){
      // This is a response message from the service.  check for confirmation signals
      // i should probably check for the type of message then the status but i'll fix it when it becomes a problem.
      // log("checking for confirmation message", message.status, messageJson);
      //log("handleMessage before message.status check", message);
      if (message.status === "202 Accepted"){
        // the serve is responding to data we've submitted.
        // log("message confirmation");
        let id = message.id;
        let confirmedMessage = this.msData.transmittedMessages[id];
        // log("receviedMessage confirmation for message", confirmedMessage);
        if (!confirmedMessage){
          error("recieved a confirmed message that we weren't expecting.  Bailing out.");
          return;
        }

        // remove the transmitted message
        delete this.msData.transmittedMessages[id];

        if (confirmedMessage.purpose == "subscribe"){
          // log("handleMessage subscription confirmation", confirmedMessage);
          // log("handleMessage confirmedmessage subscriptions:", confirmedMessage.messageTuple.subscriptions);

          for(let i=0;i<confirmedMessage.messageTuple.subscriptions.length;++i){
            // log("the pending subscriptions:", i, this.msData.pendingSubscriptions, this.msData.subscriptions, confirmedMessage.messageTuple.subscriptions);
            let subscriptionKey = confirmedMessage.messageTuple.subscriptions[i];

            // create the array if it doesn't exist
            if (!this.msData.subscriptions[subscriptionKey]){
              this.msData.subscriptions[subscriptionKey] = [];
            }

            // concatenate the arrays of recievers
            // the amount of subscribers for each subscription should never be high. 
            // if it is the user might be doing something wrong or sneaky.  so I'm going to leave this as n^2.
            // maybe this should be a set but I don't like Set or Map...
            // Objects are overall faster than both and serialize in a straightforward manner that I have already checked via storage and json
            // don't care enough
            if(this.msData.pendingSubscriptions[subscriptionKey]){
              let conversationIndex;
              for(let j=0;j<this.msData.pendingSubscriptions[subscriptionKey].length;++j){ // each of these is an array

                conversationIndex = this.msData.subscriptions[subscriptionKey].indexOf(this.msData.pendingSubscriptions[subscriptionKey][j]);
                // log("handleMessage conversationIndex", conversationIndex, `${this.msData.pendingSubscriptions[subscriptionKey][j]}`);
                // the conversation is not already inside of the existing subscriptions, add it.
                if (conversationIndex === -1){
                  // log("the subscription does not exist, adding it. conversationIndex, key, subscriptions@key, pendingSubscription at key-j", conversationIndex, subscriptionKey, this.msData.subscriptions[subscriptionKey], this.msData.pendingSubscriptions[subscriptionKey][j]);
                  this.msData.subscriptions[subscriptionKey].push(this.msData.pendingSubscriptions[subscriptionKey][j]);
                }
              }
            }
            
            // remove the pending subscription
            delete this.msData.pendingSubscriptions[subscriptionKey];
            // notify the subscribers that we're subscribed
            this.connectionHandler();
          }
        }
        else if (confirmedMessage.purpose == "unsubscribe"){
          log("UNSUBSCRIBING", confirmedMessage);
          for(let i=0;i<confirmedMessage.messageTuple.subscriptions.length;++i){
            let subscriptionKey = confirmedMessage.messageTuple.subscriptions[i];
            delete this.msData.subscriptions[subscriptionKey];
            delete this.msData.pendingSubscriptions[subscriptionKey];
          }
        }
        else{
          // let's handle the confirmation.  we hit this when we're the ones sending a message to someone else
          this.confirmationHandler(message.message, confirmedMessage);
        }
      }
      else if(message.status === "200 OK" // there are more messages to request
        || message.status === "204 No Content" // we've run out of messages to request in this bucket
        || message.status === "206 Partial Content" // there are more messages to request at the same time, use the sender. this is rare
        || message.status === "404 Not Found" // there are no more messages
        ){
        // the server is responding positively to a pulling request
        // log("request response", message);
        let id = message.id;
        let transmittedMessage = this.msData.transmittedMessages[id];
        // log("handleMessage response for message", transmittedMessage);
        if(!transmittedMessage){
          error("received a transmitted message that we weren't expecting. Bailing out.");
          return;
        }
        delete this.msData.transmittedMessages[id];
        delete this.msData.pendingMessages[id];

        // send it to the pullHandler
        this.pullHandler(message, transmittedMessage);
      }
      else{
        let id = message.id;
        let transmittedMessage = this.msData.transmittedMessages[id];
        // TODO: handle what happens when the server doesn't like our message.
        // message.status in the 400s and 500s.
        error("handleMessage - the server didn't like our message", message);

        if(!transmittedMessage){
          error("received a transmitted message that we weren't expecting. Bailing out.");
          return;
        }
        this.denialHandler(message, transmittedMessage);
      }
    }
    else if (validate.pushedUserMessages(message)) {
      // log("received pushed user messages", message);
      // this is not a response
      // rather it's an incoming message coming from a channel that we're subscribed to.
      // pass it to the pushHandler
      this.pushHandler(message);
    }
    else if (validate.pushedSystemMessage(message)){
      // log("received a system message, handle it somehow", message);
    }
    else{
      error("could not validate message", message);
    }

    this.save();
  }

  open(){
    // if the websocket is in a good state just return
    if (this.socket && this.socket.readyState == 1){
      // log("The message stream is connected");
      window.clearInterval(this.reopener);
      return;
    }

    // If the websocket is not set up then set it up
    if (this.socket === undefined || this.socket === null){
      this.connecting = true;
      this.socket = new WebSocket(this.url);
    }
    
    // set the onopen handler to send messages and proper states
    this.socket.onopen = () => {
      backend.messageFrontend({
        reason: "connection",
        status: "open"
      });
      // handle connection tasks
      // log("socket open! sending messages", this);
      // let mstr = window.messageStreams[this.url];
      this.connecting = false;
      this.reQueueSubscriptions();
      window.clearInterval(this.reopener);
      this.reconnectionFallOff = 1;
      this.reopener = -1;
      this.connecting = false;

      // keep connection alive
      this.pingServer();

      // log("is this messagStreamConnecting", this.connecting);
      // start doing work
      this.sendPendingMessages();
    };

    // set the message handler and if a handler wasn't provided just print any messages that come through
    this.socket.onmessage = (message) => {
      //log("MessageEvent received", message);
      if (message.data == "p"){
        //log("got pong");
        return;
      }
      this.handleMessage(message);
    };

    // set the on close handler to reopen the socket if we're not shutting down the message stream
    this.socket.onclose = () => {
      backend.messageFrontend({
        reason: "connection",
        status: "closed"
      });
      // log("The socket is closing");
      window.clearInterval(this.pingFunctionId);

      if (!this.shuttingDown){
        error("the socket shouldn't be closing, initiating reconnection");
        this.connecting = true;
        this.reQueueSubscriptions();
        // all messages that we haven't received confirmation of need to go back in the queue
        let nonGetTransmitted = {};
        for(let i in this.msData.transmittedMessages){
          if(!this.msData.transmittedMessages[i].purpose === "getMessages"){
            nonGetTransmitted[i] = this.msData.transmittedMessages[i];
          }
        }
        this.msData.transmittedMessages = {};
        // this.msData.pendingMessages = Object.assign(this.msData.pendingMessages, this.msData.sendingMessages, this.msData.transmittedMessages);
        this.msData.pendingMessages = Object.assign(this.msData.pendingMessages, this.msData.sendingMessages, nonGetTransmitted);

        // run all of this open stuff again
        this.socket = null;

        // are we already trying to reopen the connection?  If not then do it.
        if (this.reopener == -1){
          // log("we're opening again!!!!");
          // log(this);
          this.open();
        }
      }
    };

    this.socket.onerror = (err) => {

      error("MessageStream - WebSocketError", err);
    };

    this.reopener = window.setInterval(()=>{
      window.clearInterval(this.reopener);
      this.reopener = -1;

      if(!this.socket){
        this.open();
      }
      else if(this.socket && this.socket.readyState !== 1){
        // setting the on close to null is ok because:
        // the reopener is active only when the MessageStream is first open so no messages have been transmitted
        // or the socket has already been closed so all transmitted but unconfirmed messages have been placed back in pending
        this.socket.onclose = null;
        this.socket.close()
        this.socket = null;
        this.open();
      }

      this.reconnectionFallOff = Math.min(this.reconnectionFallOff*2, 30);

    }, this.reconnectionFallOff*1000 + Math.random() % 3000);
  }

  close (){
    // make sure socket knows we're sutting down
    this.shuttingDown = true;

    // close it.
    this.socket.close();
  }

  pingServer(){
    window.clearInterval(this.pingFunctionId);
    this.pingFunctionId = window.setInterval(()=>{
      try {
        this.socket.send("p");
      }
      catch(err){
        error("MessageStream server couldn't be pinged");
        window.clearInterval(this.pingFunctionId);
      }

    }, 8000);
  }

  static async loadAll(){
    // log("MessageStream loadAll");
    let messageStreamDatas = await MessageStreamData.storedObjectBulkLoad(window.user.messageStreams);
    // log("MessageStream LoadAll datas", messageStreamDatas);
    let mStreams = {};
    let deletedStream = false;

    for (let d of messageStreamDatas){
      if (!d){continue;}
      if (`${d.messageHub.url.replace('https', 'wss')}/` in mStreams){
        MessageStreamData.storedObjectDelete(d.filePath);
        window.user.messageStreams.splice(window.user.messageStreams.indexOf(d.filePath), 1);
        deletedStream = true;
        continue;
      }
      let mStream = new MessageStream(d);
      mStream.open();
      mStreams[mStream.url] = mStream;
    }
    if (deletedStream){
      await window.user.save();
    }
    return mStreams;
  }


  static async getOrCreate(messageHub, handlerClass, confirmationHandler, denialHandler, connectionHandler, pushHandler, pullHandler){
    // log("MessageStream - getOrCreate");
    let webSocketEndpoint = `${messageHub.url.replace('https', 'wss')}/`;

    // all MessageStreams (one per domain) are loaded at the beginning of the session
    let messageStream = window.messageStreams[webSocketEndpoint];
    if(messageStream){return messageStream;}
    // log("messagestream doesn't exist, trying to create a new one", webSocketEndpoint, window.messageStreams);

    // the message stream doesn't exist so start creating it, and keep other branches from doing the same
    if (!window.unopenedMessageStreams) {
      window.unopenedMessageStreams = {};
    }

    // the messageStreamData for the messageStream
    let msd;

    // only once guard
    if (webSocketEndpoint in window.unopenedMessageStreams){

      // we're currently making a messageStreamData for this messageStreamDomain, await it 
      msd = await window.unopenedMessageStreams[webSocketEndpoint];
      // log("awaiting 3rdparty branch msd", msd);
      if(window.messageStreams[webSocketEndpoint]){
        messageStream = window.messageStreams[webSocketEndpoint];
      }
    }
    else{
      // it's not being made yet, start it up and shove the promise in a global so it can be awaited by other branches

      ///// messageStreamData stuff, DO NOT AWAIT IN BETWEEN THIS STUFF
      let handlerClassName;
      if (handlerClass){
        handlerClassName = handlerClass.typeName;
      }

      let confirmationHandlerName = confirmationHandler? confirmationHandler.name:'confirmationHandler';
      let denialHandlerName = denialHandler? denialHandler.name:'denialHandler';
      let connectionHandlerName = connectionHandler? connectionHandler.name:'connectionHandler';
      let pushHandlerName = pushHandler? pushHandler.name:'pushHandler';
      let pullHandlerName = pullHandler? pullHandler.name:'pullHandler';

      // log("before new MessageStreamData");
      msd = new MessageStreamData(
        undefined,
        messageHub,
        handlerClassName,
        confirmationHandlerName,
        denialHandlerName,
        connectionHandlerName,
        pushHandlerName,
        pullHandlerName
      );


      // log("before msd save");
      let msdPromise = msd.save();
      window.unopenedMessageStreams[webSocketEndpoint] = msdPromise;
      msd = await msdPromise;
      // log("awaiting 1stparty nrach msd");
      ///// end messageStreamData stuff DO NOT USE AWAIT ANYWHERE IN BETWEEN THE ABOVE AND HERE
      delete window.unopenedMessageStreams[webSocketEndpoint];  
      if(window.messageStreams[webSocketEndpoint]){
        messageStream = window.messageStreams[webSocketEndpoint];
      }
    }

    if(messageStream){
      return messageStream;
    }

    // finalize the messageStream creation
    // log("MessageStream finalizing messageStream", msd);
    messageStream = new MessageStream(msd);
    // log("adding messageStream to window", messageStream, window.messageStreams);
    window.messageStreams[webSocketEndpoint] = messageStream;
    window.user.messageStreams.push(msd.filePath);
    await window.user.save();
    messageStream.open();
    return messageStream;
  }
}

class Identity extends StoredObject {
  constructor(
    filePath = undefined,
    corePersona = undefined, // Persona
    in_personae = '', // filepath to a PersonaeStruct
    primaryCircle = '', // filepath
    circles = {}, // {Circle filePath: CircleData filePath}
    sentVouchRequests = [], // This should be empty unless the induction process is in progress
    receivedVouchResponses = [], // This should be empty unless the induction process in in progress
    sentAccessRequests = [], // This should be empty unless the induction process is in progress
    receivedAccessResponses = [], // This should be empty unless the induction process is in progress
    settings = {}
  ) {
    super(filePath=filePath);
    this.typeName = "Identity";
    // It duplicates the Persona stuff but I want it anyway.  It's shorter to retrieve.  We don't need all of the fields
    if (corePersona === undefined){
      // log("Since core persona is not being provided for Identity constructor, it's expected that the object is being assigned.");
    }
    else{
      this.name = corePersona.name;
      this.publicKey = corePersona.publicKey;
      this.privateKey = corePersona.privateKey;
      this.fingerprint = corePersona.fingerprint;
      this.avatar = corePersona.avatar;
      this.circleData = {};
    }

    // The induction persona is always created
    this.personae = in_personae;  
    this.primaryCircle = primaryCircle;
    this.friends = [];
    this.queries = [];
    this.listed = [];
    this.bought = [];
    this.sold = [];
    this.polls = [];
    this.conversationSummaries = {};
    this.sentVouchRequests = sentVouchRequests;
    this.receivedVouchResponses = receivedVouchResponses;
    this.sentAccessRequests = sentAccessRequests;
    this.receivedAccessResponses = receivedAccessResponses;
    this.circleData = circles; // {circle filepath : circleData filepath}
    this.conversations = {}; // {"this.identityFingerprint/conversationType/circleFingerprint/otherPartyFingerprint": conversationFilePath} // circleFingerprint is optionally null
    this.settings = settings;
    this.store = 'identities';
  }

  getIdentifier(){
    return this.fingerprint;
  }

  getPersona(personaType){
    // all persona are loaded into memory
    log("getPersona window.personaeStructs this.personae personaeType", window.personaeStructs[this.personae][personaType], window.personae);
    return window.personae[window.personaeStructs[this.personae][personaType]];
  }

  getPersonaeFingerprints(){
    // log("getPersonaeFingerprints", this.personae, window.personaeStructs);
    let personaeFingerprints = {};
    for(let i=0;i<PERSONA_TYPES.length;++i){
      if (PERSONA_TYPES[i] === 'external'){continue;}
      // // log("getpersonaefingerprints loop", PERSONA_TYPES[i]);
      personaeFingerprints[PERSONA_TYPES[i]] = window.personae[window.personaeStructs[this.personae][PERSONA_TYPES[i]]].fingerprint;
      // // log("getpersonaefingerprints loop", PERSONA_TYPES[i], this.personae, window.personaeStructs[this.personae][PERSONA_TYPES[i]]);

    }
    // log("getpersonaeFingerprints returning", personaeFingerprints);
    return personaeFingerprints;
  }

    // everything that has to do with conversations inside of this class can probably be deduplicated somehow later one.
  updateSummary(convo){
    // This does not save because we'll probably be doing other things as well.

    if (convo.conversationKey.slice(0,5) === 'null/'){
      // this is a circle conversation, replace the conversationkey identity filePath prefix i.e. (null) with this.filePath
      let keyPieces = convo.conversationKey.split('/');
      keyPieces[0] = this.filePath;
      this.conversationSummaries[keyPieces.join('/')] = {
        unreads: convo.unreads,
        lastMessageDate: convo.lastMessageDate,
        circleFingerprint: convo.circleFingerprint,
        coreCircleFingerprint: convo.coreCircleFingerprint,
        identityFingerprint: this.fingerprint,
        personaFingerprint: convo.personaFingerprint,
        otherPartyFingerprint: convo.otherPartyFingerprint,
      };
      return;
    }

    this.conversationSummaries[convo.conversationKey] = {
      unreads: convo.unreads,
      lastMessageDate: convo.lastMessageDate,
      circleFingerprint: convo.circleFingerprint,
      coreCircleFingerprint: convo.coreCircleFingerprint,
      identityFingerprint: this.fingerprint,
      personaFingerprint: convo.personaFingerprint,
      otherPartyFingerprint: convo.otherPartyFingerprint,
    };
  }

  getAllConversationSummaries(){
    // This returns an object of objects, summaries are updated when a conversation is updated for any reason.
    // { 
    //   'spamMessaging':{
    //     'otherPartyFingerprint':{
    //       'unreads': 10,
    //       'lastMessageDate': Date.now()
    //     }
    //   },
    //   'directMessaging':...,
    //
    //   'directCircleMessaging':{
    //     'circleFingerprint':{
    //       'otherPartyFingerprint':{
    //         'unreads': 0,
    //         'lastMessageDate': undefined
    //       }
    //     }
    //   },
    //   'vouchedMessaging':...,
    //   'generalCircleMessaging':...
    // }
    // log("Identity - getAllConversationsSummary", this);
    let summaries = {};
    Object.assign(summaries, this.conversationSummaries);
    return summaries;
  }

  conversationSorter(left, right){
    if (this.conversationSummaries[left[0]].lastMessageDate < this.conversationSummaries[right[0]].lastMessageDate){
      return -1;
    }
    if (this.conversationSummaries[left[0]].lastMessageDate < this.conversationSummaries[right[0]].lastMessageDate){
      return 1;
    }

    return 0;
  }

  async getAllConversations(){
    // this gets all conversations regardless of whether it belongs to a circle or not
    // so long as this identity is involved
    let conversationEntries = Object.entries(this.conversations).filter((x) => { const [ifp, ctype, cfp, opfp] = x[0].split('/'); return cfp === 'null'});
    let conversations = [];

    let identityOwnedConversations = [];
    let circleOwnedConversations = [];

    let diskOnlyIdentityConversationFilePaths = [];
    let diskOnlyCircleConversationFilePaths = [];
    
    for(let [convoKey, filePath] of Object.entries(this.conversations)) {
      log(`Identity, getAllconversations, ${convoKey}: ${filePath}`, this.conversations);
      const [ifp, ctype, cfp, opfp] = convoKey.split('/');

      // if it's a circle convo, make the convoKey generic by removing this.filePath
      if(cfp !== 'null'){
        convoKey = [null,ctype,cfp,opfp].join('/');
        let conversation = window.conversations[convoKey];
        if(!conversation){
          diskOnlyCircleConversationFilePaths.push(filePath);
          continue;
        }
        circleOwnedConversations.push(conversation);
      }
      else{
        let conversation = window.conversations[convoKey];
        if(!conversation){
          diskOnlyIdentityConversationFilePaths.push(filePath);
          continue;
        }
        identityOwnedConversations.push(conversation);
      }
    }

    identityOwnedConversations = identityOwnedConversations.concat(await Conversation.storedObjectBulkLoad(diskOnlyIdentityConversationFilePaths));
    circleOwnedConversations = circleOwnedConversations.concat(await Conversation.storedObjectBulkLoad(diskOnlyCircleConversationFilePaths));

    return {identityOwnedConversations, circleOwnedConversations};
  }

  async loadAllConversations(){
    // this should only be run when we first log in.  This function should never be awaited as it can take a long time.
    // make sure we don't get the ones that a circle will be loading.
    let conversationEntries = Object.entries(this.conversations).filter((x) => { const [ifp, ctype, cfp, opfp] = x[0]; return cfp === 'null'});
    // log("Identity loadAllConversations", conversationEntries);
    // if we've hit the max number of active conversations, sort them and only load the most recently updated ones.
    // everything else should be skipped until the user requests it somehow
    if (conversationEntries.length > 100){
      conversationEntries.sort(this.conversationSorter);
    }

    // remove the less active ones from the loading list
    conversationEntries.splice(100, conversationEntries.length-100-1);

    // get the filePaths
    let filePaths = [];
    for(let i=0;i< conversationEntries.length;++i){
      filePaths.push(conversationEntries[i][1]);
    }

    // log("Identity loadAllConversations", this, filePaths);
    // load the conversations
    let conversations = await Conversation.storedObjectBulkLoad(filePaths);

    // cache it in memory
    // log("Identity loaded conversations", conversations);
    for (let conversation of conversations){

      //open the conversation, this connects it to a messageHub.
      conversation.open();

      // cache it in memory
      window.conversations[conversation.conversationKey] = conversation;
    }
  }

  async getOrCreateConversation(conversationType, circle, persona){
    // log("Identity - getorCreateConversation", conversationType, circle, persona);

    let conversationKey = `${circle?null:this.filePath}/${conversationType}/${circle?`${circle.filePath}`:null}/${persona.filePath}`;

    let conversation = window.conversations[conversationKey];

    // cached in memory?  return it
    if (conversation){
      // log("conversation exists in memory", conversation);
      return conversation;
    }

    // not cached in memory, do we have the filepath?
    let conversationFilePath = this.conversations[conversationKey];
    
    // if it does not exist, create it
    if (!conversation && !conversationFilePath){
      if (circle){
        // we don't create circleConversations this way.
        // Why?  Dunno, this might change at some point in the future but for right now keep circle conversation creation in Circles
        throw new Error("cannot create a circleConversation through the identity");
      }
      // log("unable to load conversation, creating new one");
      conversation = new Conversation(undefined, conversationType, this, circle, persona);
      await conversation.save();
      // log("created new conversation", conversation);
      this.conversations[conversation.conversationKey] = conversation.filePath;

      // add its summary to this identity's summaries
      this.updateSummary(conversation);
      await this.save();
      window.identities[this.filePath] = this;
      window.conversations[conversationKey] = conversation;
      // log("added conversation to identity,", this.fingerprint, conversation);
    }

    // if it does exist, load it and cache it in memory
    else if (!conversation){
      conversation = await Conversation.load(conversationFilePath);
      if (conversation){
        // log("loaded conversation", conversation);
        window.conversations[conversationKey] = conversation;
      }
    }

    return conversation;
  }


  async getConversationWithKey(conversationKey){
    // log("Identity - getConversationWithKey", conversationKey);

    // does the conversation belong to this identity?
    let conversationFilePath = this.conversations[conversationKey];

    // the conversation doesn't belong to this identity
    if (!conversationFilePath){
      error("This conversation doesn't belong to this identity", conversationKey, this.fingerprint);
      return;
    }

    // check to see if it's cached in memory
    let conversation = window.conversations[conversationKey];
    if (conversation){
      // log("Identity getConversationWithKey conversation exists in memory", conversationKey, conversation);
      return conversation;
    }

    // not cached in memory, we need to use the filePath and load it.
    conversation = await Conversation.load(conversationFilePath);
    if (conversation){
      // log("Identity getConversationWithKey loaded conversation", conversation);

      // cache it
      window.conversations[conversationKey] = conversation;
    }
    
    // if it is not in memory or does not exist on disk this returns undefined
    // we only want conversations that this identity owns.
    return conversation;
  }


  async getCircleData(circleFilePath){
    // log("Identity-getCircleData", circleFilePath);
    if(circleFilePath === null){
      return window.circleDatae[this.filePath][null];
    }
    let circle = window.circles[circleFilePath];
    let circleData = window.circleDatae[this.filePath][circle.filePath];
    if (circleData){
      // log("returning circleData from window")
      return circleData;
    }

    circleData = await CircleData.load(this.circleData[circleFilePath]);
    window.circleDatae[this.filePath][circle.filePath] = circleData;
    // log("returning circledata from storage");
    return circleData;
  }

  async getCircleDataAll(){
    // log("in identity getcircledataall");
    let circleData = [];
    //let circleDataPromises = [];

    // log("attempting bulkGet from dexie");

    let filePaths = Object.values(this.circleData);
    // log("infilepaths", filePaths);
    let loadedCircleDataList = await CircleData.storedObjectBulkLoad(filePaths);
    // log("LOADED CIRCLE DATA LIST", loadedCircleDataList);
    //let identitiesObject = {}; 
    for (let i=0;i<loadedCircleDataList.length;++i){
      if (loadedCircleDataList[i] !== undefined){
        //identitiesObject[inFilePaths[i]] = loadedIdentities[i];
        circleData.push(loadedCircleDataList[i]);
      }
    }
    // log("bulkGetCircleData", circleData);
    return circleData;
  }

  getCirclesAll(){
    let circles = Object.keys(this.circles).map(filePath => window.circles[filePath]);
    return circles;
  }
  getPrimaryCircle(){
    return window.circles[this.primaryCircle];
  }

  getPersonae(){
    return window.personaeStructs[this.personae];
  }

  async acceptInvite(inviteUrl){
    // get the linkobject we saved
    let linkObject = window.invites[inviteUrl];
    let result = {status: "failure"};

    if (!validate.link(linkObject)) {
      error("unable to validate the linkObject");
      return result;
    }

    // get the sigil objects which contain public keys, vouchers and vouchees
    let sigils = linkObject.sigils;

    let sigilPromises = [];
    let sigilBlobs = [];
    for(let i=0;i<sigils.length;++i){
      sigilPromises[i] = salty.readSigil(sigils[i]).then((sigilBlob) => {sigilBlobs[i] = sigilBlob;});
    }

    // we're using all settled here because verify check just below will handle any errors.
    let sigilResults = await Promise.allSettled(sigilPromises);
    // log("sigilResults", sigilResults);

    // this throws on errors
    try {
      // make sure the permission chain has all the keys and the permnissions have valid dates and has the correct permissions
      Conversation.verifyLink(sigilBlobs, ["message"], new Date());
    }
    catch(err){
      // something's wrong with the chain, th so we need to check for an update.  For now we're just going to fail out
      // because it's a safe assumption that the sigils are set to never expire.
      // when we're in a better dev spot we should send a message out for new permissions
      error(err)
      return result;
    }

    // prepare the keypairs
    let circleKeyPair = {publicKey: sigilBlobs[0].voucher};
    let adminKeyPair = {publicKey: sigilBlobs[0].vouchee};
    let verifierKeyPair = linkObject.keys; // {publicKey, privateKey}


    // create the 3rd party circle
    let circle = await Circle.createOrGetExternalCircle(circleKeyPair, linkObject.config);
    let circleData = new CircleData(undefined, circle.filePath, this.filePath);
    await circleData.save();
    // create the personas that utilize the circle's permissions
    // log("Identity processInvite before persona creation:", adminKeyPair, verifierKeyPair);


    let adminFingerprint = await salty.getFingerprint(adminKeyPair.publicKey);
    let verifierFingerprint = await salty.getFingerprint(verifierKeyPair.publicKey);
    let admin = window.personae[window.personaTable[adminFingerprint]];
    let verifier = window.personae[window.personaTable[verifierFingerprint]];

    let circlePersona = await circle.getPersona('induction');
    
    if(!admin){
      admin = await Persona.create('', "induction", '', adminKeyPair, false);
    }

    if(!verifier){
      verifier = await Persona.create('', "message", '', verifierKeyPair, false);
    }

    // set up the proper relationships for the admin
    admin.setOwner(circle);
    circle.addAdministrator(admin);

    window.backend.keyUpload(circle.fingerprint, this.fingerprint);

    admin.addSigil(circlePersona, sigils[0]);

    // set up the proper relationships for the conversationPersona
    verifier.setOwner(circle);
    verifier.setAdministrator(admin);
    verifier.addSigil(admin, sigils[1]);
    let resolved = await Promise.all([circle.save(), admin.save(), verifier.save()]);

    await window.user.save();

    this.circleData[circle.filePath] = circleData.filePath;
    this.save();
    window.circles[circle.filePath] = circle;

    // all of the initial pieces have been created and set.

    // let's join the conversation.  we need the conversationType, the conversationPersona and the identity
    // the identity offers up the correct persona based on the conversationType
    let conversation = await circle.joinConversation("publicCircleMessaging", verifier, this);

    // this line right here opens up a message stream to the server.
    // I really, really don't know if it's good bad or doesn't matter because it means if you're on a conversation
    // page then you are automatically connected by websocket.
    conversation.open();
    
    // log("Identity conversation from invite:", conversation);
    result.status = "success";
    result.redirectionPath = `/social/identity/${this.fingerprint}/circle/${circle.fingerprint}/convo/${verifier.fingerprint}`;
    await window.user.setCurrentPage(`#/social/identity/${this.fingerprint}/circle/${circle.fingerprint}/convo/${verifier.fingerprint}`);
    return result;
  }

  getSafeVersion(){
    // log("Identity getSafeVersion");
    throw new Error('Not Implemented');
  }

  getAllPersona(){    
    let personae = [];
    for(let personaType of PERSONA_TYPES){
      let persona = this.getPersona(personaType);
      if(persona){
        personae.push(persona);
      }
    }

    return personae;
  }

  static get store() {
    return 'identities';
  }

  static get typeName(){
    return "Identity";
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let identity = new Identity(inFilePath, undefined);
    // log("loading identity", identity);
    let loaded = await identity.load(inFilePath);
    // log("checking identity load", loaded);
    if (loaded)
      return identity;
    return false;
  }

  static async bulkLoad(inFilePaths){
    // log("infilepaths", inFilePaths);
    let loadedIdentities = await this.storedObjectBulkLoad(inFilePaths);
    let identitiesObject = {};
    // log("bulkloaded identities", loadedIdentities);
    for (let i=0;i<loadedIdentities.length;++i){
      if (loadedIdentities[i] !== undefined){
        identitiesObject[inFilePaths[i]] = loadedIdentities[i];
      }
    }
    return identitiesObject;
  }

  async excise(){
    // This removes as much stuff as possible that has to do with this identity.
    // without removing things that other identities have access to.

    // an identity's persona is always in memory, gather then all and delete
    let personae = this.getAllPersona();
    log(`IDENTITY EXCISING - personae filePaths`, personae);

    let otherIdentities = Object.entries(window.identities)
      .filter(([filePath, identity]) => {return filePath !== this.filePath;})
      .map(x => x[1]);

    log(`IDENTITY EXCISING - otherIdentities`, otherIdentities);

    // Get all of the circles that are not used by other identites
    let ourCircleFilePaths = Object.keys(this.circleData);
    let otherCircleFilePathObject = {};

    // get all of their circleFilePaths
    for(let identity of otherIdentities){
      let cfps = Object.keys(identity.circleData);
      for(let cfp  of cfps){
        otherCircleFilePathObject[cfp] = 1;
      }
    }

    // here's the filter for unique circles
    let uniqueCircleFilePaths = ourCircleFilePaths.filter(fp => {return !(fp in otherCircleFilePathObject)});

    // get the circle objects, they're always in memory
    let circles = uniqueCircleFilePaths.map(cfp => window.circles[cfp]);

    log(`IDENTITY EXCISING - circles`, circles);
    // delete them
    await Circle.bulkDelete(circles);

    // delete the circleDatae owned by this identity
    let circleDatae = await this.getCircleDataAll();
    log(`IDENTITY EXCISING - circleDatae`, circleDatae);
    await CircleData.bulkDelete(circleDatae);



    // handle all of the conversations connected to this identity
    let {identityOwnedConversations, circleOwnedConversations} = await this.getAllConversations();
    log(`IDENTITY EXCISING - conversations`, identityOwnedConversations, circleOwnedConversations);



    log(`IDENTITY EXCISING - circle owned conversations`, circleOwnedConversations);
    // for the circle conversations we need to consider whether
    // this identity is the only one accessing it or not.
    // if it is we delete it.
    // if there are other identities we own that access it then we wipe this identity's messages
    // just check if the other identities have that conversation summary or not.  if not, delete it.
    // if so, wipe the messages of sent, or unsent.
    let multiIdentityCircleConversations = {};

    for(let convo of circleOwnedConversations){
      for(let identity of otherIdentities){
        let otherIdentityConvoFilePaths = Object.values(identity.conversations);
        if(otherIdentityConvoFilePaths.includes(convo.filePath)) {
          multiIdentityCircleConversations[convo.filePath] = convo;
          break;
        }
      }
    }

    let singleIdentityConversations = identityOwnedConversations
      .concat(circleOwnedConversations.filter(x => {return !(x.filePath in multiIdentityCircleConversations);}));


    log(`IDENTITY EXCISING - multi identity conversations`, multiIdentityCircleConversations);
    await Conversation.bulkWipe(this, multiIdentityCircleConversations);


    log(`IDENTITY EXCISING - identity owned conversations`, identityOwnedConversations);

    // we can just delete identityOwnedConversations
    // each in turn deletes all of their messages
    log(`IDENTITY EXCISING - single identity conversations`, singleIdentityConversations);
    await Conversation.bulkDelete(singleIdentityConversations);

    log(`IDENTITY EXCISING - personae`, personae);
    // delete all of this identity's personae
    await Persona.bulkDelete(personae);

    log(`IDENTITY EXCISING - personae struct`, this.personae);
    // delete this identity's personaeStruct
    await PersonaeStruct.delete(this.personae);

    log(`IDENTITY EXCISING - this`);
    await this.delete();

    log(`IDENTITY EXCISING - done`);

    return true;
  }

  async exciseCircle(circle){
    let otherIdentities = Object.entries(window.identities)
      .filter(([filePath, identity]) => {return filePath !== this.filePath;})
      .map(x => x[1]);

    let unique = true;
    for(let i of otherIdentities){
      if(circle.filePath in i.circleData){
        unique = false;
        break;
      }
    }

    await CircleData.storedObjectDelete(this.circleData[circle.filePath]);
    // get all of the circle conversation filepaths so we
    // can either remove them or wipe them.
    let circleConversationFilePaths = Object.entries(this.conversations)
      .filter(([conversationKey, filePath]) => {return conversationKey.includes(circle.filePath)})
      .map(x => x[1]);

    // load them all.
    let circleConversations = await Conversation.storedObjectBulkLoad(circleConversationFilePaths);

    if(unique){
      // no other identity has this circle so it's safe to delete it and all of it's conversations.
      await circle.delete();
      await Conversation.bulkDelete(circleConversations);
    }
    else{
      // another identity has this circle
      // we need to check each conversation to see if other identities participating.
      // wipe the conversation if there are 
      // delete it if not.

      // fill an object for O(1) checking
      let circleConversationsOb = {};
      for (let c of circleConversations){
        circleConversationsOb[c.filePath] = c;
      }


      // multiIdentityCircleConversations will hold any conversations with more than one local participant.
      // they will be wiped of this identity's messages.
      let multiIdentityCircleConversations = [];

      // check each other identities
      for(let identity of otherIdentities){
        for(let convoFilePath of Object.values(identity.conversations)){
          if(convoFilePath in circleConversationsOb){
            multiIdentityCircleConversations.push(circleConversationsOb[convoFilePath]);
            delete circleConversationsOb[convoFilePath];
          }
        }
      }

      // any conversation still left in the circleConverSationsOb is only used by this identity
      // delete them.
      let singleIdentityConversations = Object.values(circleConversationsOb);
      
      // wipe the multis
      await Conversation.bulkWipe(this, multiIdentityCircleConversations);
      
      // delete the singles
      await Conversation.bulkDelete(singleIdentityConversations);
    }

    delete this.circleData[circle.filePath];
    await this.save();
    return true;
  }

  async exciseConversation(conversationKey){
    log("EXCISING CONVERSATION - conversationKey", conversationKey);
    // remove the conversation from the 
    let conversation = await this.getConversationWithKey(conversationKey);
    if(!conversation){
      return false;
    }

    log("EXCISING CONVERSATION - conversation", conversation);
    let otherIdentities = Object.entries(window.identities)
      .filter(([filePath, identity]) => {return filePath !== this.filePath;})
      .map(x => x[1]);

    log("EXCISING CONVERSATION - other identities", otherIdentities);
    let unique = true;
    for(let identity of otherIdentities){
      let otherIdentityConvoFilePaths = Object.values(identity.conversations);
      if(otherIdentityConvoFilePaths.includes(convo.filePath)){
        unique = false;
        break;
      }
    }

    let neutralizedConversation = unique ? await conversation.delete() : await conversation.wipe(this);
    delete this.conversations[conversationKey];
    delete this.conversationSummaries[conversationKey];
    this.save();

    return true;
  }

  async delete(){
    await Identity.storedObjectDelete(this.filePath);
    delete window.identities[this.filePath];
    delete window.identityTable[this.fingerprint];
  }

  static async delete(filePath){
    let identity = await Identity.load(filePath);
    if(identity){
      identity.delete();
    }
  }

}

class Persona extends StoredObject {
    constructor(
      filePath = undefined,
      assignedName='',
      personaeStruct=''){
      super(filePath=filePath);
      this.typeName = "Persona";
      this.store = "personae";
      this.name = assignedName;
      this.personaeStruct = personaeStruct; // filePath to a personaeStruct
      this.publicKey = 'dummyPublicKey'; // the current publicKey
      this.privateKey = 'dummyPrivateKey'; // the current privateKey
      this.fingerprint = 'dummybase58String';
      this.avatar = 'dummyBase64String'; // data:/imageurl thingy
      this.administratorFilePath = ""; // this is straight path for finding the highest authority for a persona.
      this.ownerFilePath = '';
      this.ownerType = '';
      this.type = 'core';
      this.keyHistory = []; // this holds previously utilized public and private Keys as {publicKey: "blah", privateKey: "blabla"} objects.
      this.ownershipProof = {};     // encrypted (with user password) circle signature of public key + a password.
                                    // - incase everything else everything identity and lower is compromised
      this.voucherSignatures = {};  // person fingerprint : signature - people who've signed for us
      this.voucheeSignatures = {};  // 3rd party  fingerprint : signature - people we've signed for
      this.circleSignatures = {};   // circle fingerprint : signature - circles this key has access to
      this.revocationSignatures = {}; // fingerprint : signature - people who we've revoked signatures for
      this.serviceToken = ''; // this saves the token from auth...what auth?
      this.internal = true;
      this.sigils = {}; // {persona filePath: [sigil1, sigil2, ...]}  // the lowest index sigil is the newest one
    }

    getIdentifier(){
      return this.fingerprint;
    }

    static async load(inFilePath){
      // log("infilepath", inFilePath);
      let persona = new Persona(inFilePath);
      // log("loading persona", persona);
      let loaded = await persona.load(inFilePath);
      // log("checking conversation load", loaded);
      if (loaded)
        return persona;
      return false;
    }

    static async bulkLoad(inFilePaths){
      // log("personae bulkload infilepaths", inFilePaths);
      let loadedPersonae = await Persona.storedObjectBulkLoad(inFilePaths);
      let personaeObject = {};
      // log("bulkloaded personae", loadedPersonae);
      for (let i=0;i<loadedPersonae.length;++i){
        if (loadedPersonae[i] !== undefined){
          personaeObject[inFilePaths[i]] = loadedPersonae[i];
        }
      }
      return personaeObject;
    }

    static async bulkSave(inObjects){
      // log("Persona bulkSave inObjects", inObjects);
      return this.storedObjectBulkSave(inObjects);
    }

    static async bulkDelete(personae){
      let filePaths = [];
      log("bulkDelete", personae);
      for(let persona of personae){
        log("deleting: ", persona);
        delete window.personaTable[persona.fingerprint];
        delete window.personae[persona.filePath];
        filePaths.push(persona.filePath);
      }

      filePaths.sort();
      let userPersonaeIndex = 0;
      // hopefully this isn't too slow.
      // splcing is o(n) i think.  maybe it would be better to move to an obj
      for(let fp of filePaths){
        userPersonaeIndex = window.user.personae.indexOf(fp, userPersonaeIndex);
        window.user.personae.splice(userPersonaeIndex, 1);
      }

      await window.user.save();
      // log("Persona bulkSave inObjects", inObjects);
      return this.storedObjectBulkDelete(filePaths);
    }


    static get store() {
      return 'personae';
    }

    static get typeName(){
      return "Persona";
    }

    static async create(name='', type='core', personaeStructFilePath='', keys=null, internal=true){
      let persona;
      if(keys){
        persona = new Persona(undefined, await salty.getPublicKeyName(keys.publicKey));
      }
      else if (name.length === 0){
        persona = new Persona(undefined, await utils.getRandomName());
      }
      else{
        persona = new Persona(undefined, name);
      }

      // original
      //let persona = new Persona(undefined, (name.length == 0 ? await utils.getRandomName() : name));

      let creations = 0;
      do{
        if (!keys || creations > 0){
          // log("Persona Create - keys don't exist or aren't unique, creating them.", persona, keys);
          keys = await salty.createKeyPair(persona.name);
        }
        persona.fingerprint = await salty.getFingerprint(keys.publicKey);
        creations = 1;
      }
      while(persona.fingerprint in window.personaTable);

      persona.publicKey = keys.publicKey;
      persona.privateKey = keys.privateKey;
      persona.keyHistory.push(keys)
      persona.type = type;
      persona.avatar = (await utils.getIdenticon(persona.fingerprint)).src;
      persona.personaeStruct = personaeStructFilePath;
      persona.internal = internal;
      // log("Persona create, type", persona.type, type);
      persona = await persona.save();
      // log("created persona:", persona);
      window.personae[persona.filePath] = persona;
      window.personaTable[persona.fingerprint] = persona.filePath;
      return persona;
    }

    static async bulkCreate(personaObjects=[]){
      log("Persona bulkCreate", personaObjects);
      // each persona object is like this:
      // personaObject = {
      //   name: 'persona Name',
      //   personaeStructFilePath: 'fsdfljsdfljsdfsf',
      //   type: 'PERSONA_TYPE',
      //   internal: true, // or false
      //   ownerType: 'identity', // or 'circle'
      //   ownerFilePath: 'sdfkjsdfjksjfslf'
      // };
      // this function does not take personas with existing keys.
      // If you need that, create them individually
      // this function only uses bulk functions itself

      let personae = [];
      for(let p of personaObjects){
        const persona = new Persona(undefined,p.name);
        personae.push(persona);
      }

      // get all of the keypairs at once, they include the fingerprint
      const fkps = (await Promise.allSettled(personae.map(p => salty.createKeyPair(p.name, true)))).map(x => x.value);
      
      // add all of the existing fingerprints to the set
      const fpChecker = {};
      for(let fp in window.personaTable){
        fpChecker[fp] = 1;
      }

      log("Persona bulkCreate fkps", fkps);
      // if it exists in fkpChecker, redo it individually.
      // There shouldn't many, if any at all
      for(let i=0;i<fkps.length;++i){
        if(fkps[i].fingerprint in fpChecker){
          log(`Persona bulkCreate remaking the keyPair,  fingerprint: ${fkps[i].fingerprint}`);
          // remake it
          fkps[i] = await salty.createKeyPair(personae[i].name, true);
          // back it up and check it again.
          i--;
        }
        else{
          // mark it
          fpChecker[fkps[i].fingerprint] = 1;
          window.personaTable[fkps[i].fingerprint] = 'reserved';

          // fill in the persona
          personae[i].publicKey = fkps[i].publicKey;
          personae[i].privateKey = fkps[i].privateKey;
          personae[i].fingerprint = fkps[i].fingerprint;
          const kp = Object.assign({}, fkps[i]);
          delete kp.fingerprint;
          personae[i].keyHistory.push(kp);
          personae[i].type = personaObjects[i].type;
          personae[i].avatar = utils.getIdenticon(personae[i].fingerprint); // this is an async function
          personae[i].personaeStruct = personaObjects[i].personaeStructFilePath;
          personae[i].internal = personaObjects[i].internal;
          personae[i].ownerType = personaObjects[i].ownerType;
          personae[i].ownerFilePath= personaObjects[i].ownerFilePath;
        }
      }

      // get the avatars
      let avatarPromises = [];
      personae.forEach(async (p) => {
        avatarPromises.push(p.avatar);
        p.avatar = (await p.avatar).src;
      });

      await Promise.allSettled(avatarPromises);


      // save everything at once
      personae = await Persona.bulkSave(personae);

      log("Persona bulkCreate, personae", personae);
      // cache it all
      for(const p of personae){
        log("Persona bulkCreate", p);
        window.personae[p.filePath] = p;
        window.personaTable[p.fingerprint] = p.filePath;
      }
      log("Persona bulkCreate, after last");
      // we're done!
      return personae;
    }

    static getPersona(fingerprint){
      let filePath = window.personaTable[fingerprint];
      return window.personae[filePath];
    }

    // This function finds the persona if we have it and if we don't we download the public key
    // the public key is used to to create a persona which we then store.
    static async lookUp(keyOrFilePathOrFingerprint, circle, local = false){
      //log("Persona lookup - ", keyOrFilePathOrFingerprint, circle);
      if (!keyOrFilePathOrFingerprint){
        if(!local){
          return Promise.reject(new Error("the keyOrFilePathOrFingerprint is undefined"));
        }
        return;
      }
      // must be a key or fingerprint or filePath, if it's a key then make it a fingerprint
      // fingerprints are what are used for normal lookups.
      // we cache the key after we look it up once though, bit of a shortcut.

      // all existing personae are already cached in memory and accisble by the filePath
      let persona = window.personae[keyOrFilePathOrFingerprint];
      if(persona){
        return persona;
      }

      //it's not a filePath, check if it's a key
      let isFingerprint = utils.isFingerprint(keyOrFilePathOrFingerprint);
      let fingerprint;
      let key;

      // it's a fingerprint
      if (isFingerprint){
        fingerprint = keyOrFilePathOrFingerprint;
      }
      // it's a key
      else{
        key = keyOrFilePathOrFingerprint;
        persona = window.keyPersona[key];
        // see if we've cached the persona to the key
        if (persona){
          return persona;
        }
        // we're gonna need the fingerprint since we haven't cached it at all
        fingerprint = await salty.getFingerprint(keyOrFilePathOrFingerprint);
      }

      // if we don't have a fingerprint then we couldn't even get the key, reject this.
      if (!fingerprint){
        return Promise.reject(new Error("A proper key or fingerprint must be provided for Persona lookups"));
      }

      // check to see if we already have that persona. 
      persona = window.personae[window.personaTable[fingerprint]];

      
      // if we don't have it, either create it if we have the key or download it if not
      if (!persona){
        log("Persona lookup - persona doesn't exist but we had the key or fingerprint");

        let keys;
        // we already have the key, no need to go look for it.
        if(key){
          log("Persona lookup - we've got the key and fingerprint");
          keys = {publicKey: key, privateKey: null};
        }
        // we don't have the key BUT we do have a fingerprint, lets look for it.
        else{
          // if we're only looking locally then we can't look, reject
          if(local){
            log("Persona lookUp - we have the key and fingerprint but we since we're only looking for local persona, we can't get the key");
            return Promise.reject(new Error("Could not find a persona on the local system"));
          }
          // yeah, we can do everything we want, look for the key
          else {
            log("Persona lookup -  key doesn't exist");

            let keyHubUrl = circle ? circle.config.keyHub.url : window.user.default_circle_config.keyHub.url;
            // log("Persona - lookup - before request");

            let response = await external.makeRequest(
              'GET',
              `${keyHubUrl}/keys/${fingerprint}`
            );

            // log("keyLookup responsePayload - ", response);
            if (!("publicKey" in response)){
              error("Persona - lookup: publicKey isn't in response", response);
              return Promise.reject(new Error("Couldn't locate the Public Key"));
            }
            keys = {publicKey: response.publicKey, privateKey: null};
          }
        }

        
        log("Persona lookUp, creating external persona");
        // create the new persona
        persona = await Persona.create('', 'external', '', keys, false);  
        console.table("Persona lookUp, created persona", persona);
        await window.user.save(); // user.save() takes all window.personae and saves them, among other things.  just fyi.
      }
      window.keyPersona[persona.publicKey] = persona;
      return persona;
    }


    async createSigil(persona, permissionList = []){
      // this create a sigil with an expiration of 30 days.
      // TODO: add modifiable expiration dates
      let permissions = {};
      for (let permission of permissionList){
        // 30 days
        permissions[permission] = new Date(new Date().setDate(new Date().getDate() + 30)).getTime();
      }

      log("persona createSigil", persona, permissionList, permissions);
      await window.sodiumReady;
      log(`persona \n\n${this.privateKey}, \n\n${this.publicKey}, \n\n${persona.publicKey}\n\n`, permissions);
      let sigil = await salty.createSigil(this.privateKey, this.publicKey, persona.publicKey, permissions);
      log("persona createSigil sigil", sigil);
      return sigil;
    }

    async getSigil(persona, permissionList = []){
      // log("Persona, getting sigil", this, persona, permissionList);
      // get sigil granted by persona
      let providedSigils = this.sigils[persona.filePath];
      if (!providedSigils){
        return;
      }
      let hasAllPermissions = false;
      for(let i=0;i<providedSigils.length;++i){
        let sigilBlob = await salty.readSigil(providedSigils[i]);
        // log("persona get sigil sigilBlob", sigilBlob);
        for(let permission of permissionList){
          // if it doesn't have all of the permissions required 
          if (!(permission in sigilBlob.permissions)) {
            hasAllPermissions = false;
            break;
          }
          hasAllPermissions = true;
        }
        if (hasAllPermissions){
          return providedSigils[i];
        }
      }
    }

    async getOrCreateSigil(persona, permissionList = []){
      // this is a special case, get the sigil from the input persona and if we don't have oen then create it.
      // in the event that the sigil doesn't exist but the persona exists then this persona will be saved which hits the DB
      // this function is for convenience, if you need a non-saving function use createSigil and getSigil separately
      // this function is expected to always work. it throws an error if it can't get or create a sigil
      // because it means that the private key does not exist and the permission cannot be granted.  big no no
      let sigil = await this.getSigil(persona, permissionList);
      if (sigil){
        return sigil;
      }
      sigil = await persona.createSigil(this, permissionList);
      
      if (sigil){
        this.addSigil(persona, sigil);
        this.save(); // don't await.
        return sigil;
      }
      throw new Error(`the sigil by ${persona.name}:${persona.fingerprint} for ${this.name}:${this.fingerprint} cannot be created and cannot be found`);
    }

    async getSigils(persona, permissionsList = []){

    }

    addSigil(persona, sigil){
      if(!this.sigils[persona.filePath]){
        this.sigils[persona.filePath] = [];
      }
      if (this.sigils[persona.filePath].indexOf(sigil) != -1){
        // log("Persona sigil exists, success");
        return;
      }
      this.sigils[persona.filePath].push(sigil);
      // log("Persona addSigil success", this, persona, sigil);
    }

    async deleteSigil(persona, permissionList){
      // delete sigil granted by persona
      let providedSigils = this.sigils[persona.filePath];
      let hasAllPermissions = false;
      for(let i=0;i<providedSigils.length;++i){
        for(let permission of permissionList){
          // if it doesn't have all of the permissions required 
          if (!providedSigils[i].permissions.includes(permission)){
            hasAllPermissions = false;
            break;
          }
          hasAllPermissions = true;
        }
        if (hasAllPermissions){
          delete providedSigils[i];
          this.sigils[persona.filePath] = providedSigils[i];
          // log("Persona deleteSigil success",this, persona, sigil);
          window.persona[this.filePath] = await this.save();
          // deleted the sigil
          return true;
        }
      }
      // couldn't delete the sigil, it doesn't exist
      return false;
    }

    refreshSigils(personaList){
      // refresh the sigils with a new expiration date
    }

    getSafeVersion(){
      // log("Persona getSafeVersion");
      let safeVersion = {
        avatar: this.avatar,
        fingerprint: this.fingerprint,
        name: this.name,
        type: this.type
      };

      return safeVersion;
    }

    addPermissions(personaList = [], permissionList = []){
      // add the permissions for personas and push the updated sigils out to them
    }

    revokePermissions(personaList = [], permissionList = []){
      // remove the permissions for personas and push the updated sigils out to them if they still have permissions
      // blacklist at the service for the revoked permissionsuntil the sigils expire
    }

    blackList(servicePersonaList = [], personaList = []){
      // prevent the personas from using your credentials for these services
    }


    async update(publicKey, privateKey=''){
      if (publicKey === undefined){
        throw Error("update requires a public key");
      }
      if (this.privateKey !== undefined && privateKey == ''){
        throw Error("update of a Persona with a private key requires a private key");
      }
      this.publicKey = publicKey;
      this.fingerprint = await salty.getFingerprint(this.publicKey);
      this.privateKey = privateKey;
      this.avatar = (await utils.getIdenticon(this.fingerprint)).src;
    }

    getOwner(){
      if (this.ownerType == 'Identity'){
        return identities[this.ownerFilePath];
      }
      else if(this.ownerType == 'Circle'){
        return circles[this.ownerFilePath];
      }
    }

    setOwner(owner){
      if (!owner || !owner.filePath){
        throw `could not set owner, doesn't exist`;
      }
      this.ownerType = owner.typeName;
      this.ownerFilePath = owner.filePath;
    }

    setAdministrator(administrator){
      if (!administrator || !administrator.filePath){
        throw `could not set administrator, doesn't exist`;
      }

      this.administratorFilePath = administrator.filePath;
    }

    async getAdministrator(){
      // the administrator should already exist.
      return Persona.lookUp(this.administratorFilePath);
    }

    static getPersona(fingerprint){
      return window.personae[window.personaTable[fingerprint]];
    }
}

// these could also be considered permissions except for core
const PERSONA_TYPES = [
  'core',
  'induction',
  'message',
  'search',
  'files',
  'buy',
  'sell',
  'poll',
  'vote',
  'access',
  'admin',
  'external'
];

class PersonaeStruct extends StoredObject {
  constructor(
    filePath = undefined,
  ){
    super(filePath=filePath);
    this.typeName = "PersonaeStruct";
    this.store = "personaeStructs";
    this.core = null;
    this.induction = null;
    this.message = null;
    this.generalMessage = null;
    this.search = null;
    this.files = null;
    this.buy = null;
    this.sell = null;
    this.poll = null;
    this.vote = null;
    this.access = null;
    this.admin = null;
    this.external = null;
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let personaeStruct = new PersonaeStruct(inFilePath);
    // log("loading persona", personaeStruct);
    let loaded = await personaeStruct.load(inFilePath);
    // log("checking conversation load", loaded);
    if (loaded){
      return personaeStruct;
    }
    return false;
  }

  static async bulkLoad(inFilePaths){
    // log("infilepaths", inFilePaths);
    let loadedPersonaeStructs = await this.storedObjectBulkLoad(inFilePaths);
    let personaeStructsObject = {};
    // log("bulkloaded identities", loadedPersonaeStructs);
    for (let i=0;i<loadedPersonaeStructs.length;++i){
      if (loadedPersonaeStructs[i] !== undefined){
        personaeStructsObject[inFilePaths[i]] = loadedPersonaeStructs[i];
      }
    }
    return personaeStructsObject;
  }

  static async delete(filePath){
    let personaeStruct = await PersonaeStruct.load(filePath);
    if(personaeStruct){
      delete window.personaeStructs[personaeStruct.filePath];
      await this.storedObjectDelete(personaeStruct.filePath);
    }
  }

  static get store() {
    return 'personaeStructs';
  }

  static get typeName(){
    return "PersonaeStruct";
  }

  get current(){
    // log("getting current", this.core);
    return this.core;
  }

  get previous(){
    return this.core.previous; // this is a list of filepaths
  }

}


class Circle extends StoredObject {
  constructor(
    filePath = undefined,
    corePersona = undefined,  // Persona
    in_personae = '',  // filePath
    admins = [], // list of fingerprints for persona lookup
    members = [],  // list of fingerprints for Persona lookup
    sentAccessReponses = {},
    receivedAccessRequests = {},
    settings = {},
    configSignature = '',
    circleConfig = {},
    bundleSignature = '',
    amalgamatorBundle = '' // filePath to a binary blob that is encrypted for the amalgamator
  ) {
    super(filePath=filePath);
    this.typeName = 'Circle';
    // It duplicates the Persona stuff but I want it anyway.  It's shorter to retrieve.  We Don't need all of the fields
    if (corePersona === undefined){
      // log("Since core persona is not being provided for Identity constructor, it's expected that the object is being assigned.");
    }
    else{
      this.name = corePersona.name;
      this.publicKey = corePersona.publicKey;
      this.privateKey = corePersona.privateKey;
      this.fingerprint = corePersona.fingerprint;
      this.avatar = corePersona.avatar;
      this.circleData = {};
    }
    this.members = members;  // this is a list of fingerprints of all the members in the circle
    this.admins = admins; // fingerprints of the people who have admin privileges
    this.config = default_circle_config; // just use the hard coded one, add others when API specs are released
    this.personae = in_personae; // this is a PersonaeStruct type, the private keys only exist if this Circle is 1st Party
    this.configSignature = configSignature; // the signature of the circle that the config belongs to
    this.circleConfig = circleConfig; // where the circle links to in order to get or send data and encryption stuff for search
    this.amalgamatorBundle = amalgamatorBundle; // encrypted for the amalgamator

    // {"null/conversationType/circleFingerprint/otherPartyFingerprint": conversationFilePath} // circleFingerprint is optionally null
    // the otherPartyFingerprint is the fingerprint of the jointly used persona in the case of public or privateCircleMessaging
    this.conversations = {}; 
    this.conversationSummaries = {};
    this.settings = settings; // How the circle should behave.  very diffrent from config. don't confuse them.
    this.settings["autoConnect"] = true;
    this.store = 'circles';
  }

  static async load(inFilePath){
    // log("infilepath", inFilePath);
    let circle = new Circle(inFilePath);
    // log("loading circle", circle);
    let loaded = await circle.load(inFilePath);
    // log("checking circle load", loaded);
    if (loaded)
      return circle;
    return false;
  }

  static async bulkLoad(inFilePaths){
    // log("infilepaths", inFilePaths);
    let loadedCircles = await this.storedObjectBulkLoad(inFilePaths);
    let circlesObject = {}; 
    for (let i=0;i<loadedCircles.length;++i){
      if (loadedCircles[i] !== undefined){
        circlesObject[inFilePaths[i]] = loadedCircles[i];
      }
    }
    return circlesObject;
  }

  static async bulkDelete(circles){
    let filePaths = [];
    for (let circle of circles){
      delete window.circleTable[circle.fingerprint];
      delete window.circles[circle.filePath];
      filePaths.push(circle.filePath);
    }
    return await Circle.storedObjectBulkDelete(filePaths);
  }

  getPersona(personaType){
    // all persona are loaded into memory
    // log("getPersona window.personaeStructs this.personae personaeType", window.personaeStructs[this.personae][personaType]);
    return window.personae[window.personaeStructs[this.personae][personaType]];
  }


  getAllPersona(){    
    let personae = [];
    for(let personaType of PERSONA_TYPES){
      let persona = this.getPersona(personaType);
      if(persona){
        personae.push(persona);
      }
    }

    return personae;
  }

  async delete(){
    delete window.circles[this.filePath];
    delete window.circleTable[this.fingerprint];
    await Circle.storedObjectDelete(this.filePath);
  }


  getIdentifier(){
    return this.fingerprint;
  }

  getPersona(personaType){
    // log("Circle getPersona window.personaeStructs this.personae personaeType", personaType, this.personae, window.personaeStructs[this.personae], window.personaeStructs[this.personae][personaType]);
    return window.personae[window.personaeStructs[this.personae][personaType]];
  }

  getPersonae(){
    return window.personaeStructs[this.personae];
  }

  getPersonaeFingerprints(){
    // log("getPersonaeFingerprints", this.personae, window.personaeStructs);
    let personaeFingerprints = {};
    for(let i=0;i<PERSONA_TYPES.length;++i){
      if (PERSONA_TYPES[i] === 'external'){continue;}
      // // log("getpersonaefingerprints loop", PERSONA_TYPES[i]);
      personaeFingerprints[PERSONA_TYPES[i]] = window.personae[window.personaeStructs[this.personae][PERSONA_TYPES[i]]].fingerprint;
      // // log("getpersonaefingerprints loop", PERSONA_TYPES[i], this.personae, window.personaeStructs[this.personae][PERSONA_TYPES[i]]);

    }
    // log("getpersonaeFingerprints returning", personaeFingerprints);
    return personaeFingerprints;
  }

  static get typeName(){
    return "Circle";
  }

  static get store(){
    return "circles";
  }

  // this is for including a foreign circle into our system.
  // we aren't going to have a private key in most cases.
  static async createOrGetExternalCircle(keyPair= {}, config = {}){
    
    // we need a publicKey at the very least
    if (!keyPair.publicKey){
      return;
    }

    let fingerprint = await salty.getFingerprint(keyPair.publicKey);
    let circleFilePath = window.circleTable[fingerprint];

    // the circle exists, send it back
    if (circleFilePath){
      return window.circles[circleFilePath];
    }

    // the circle doesn't exist, create it.
    let name = await salty.getPublicKeyName(keyPair.publicKey);

    // need something to hold the "core" persona for the circle
    let circlePersonae = new PersonaeStruct();
    await circlePersonae.save();
    
    // external circles are always created with an induction persona as the core persona.
    // the user getting this always starts out with this before getting anything else.
    let persona = await Persona.create(name, "induction", circlePersonae.filePath, keyPair, false);
    circlePersonae.core = persona.filePath;
    circlePersonae.induction = persona.filePath;
    let circle = new Circle(undefined, persona, circlePersonae.filePath);

    circle.circleConfig = {...circle.circleConfig, ...config};
    circlePersonae.save();
    circle = await circle.save();
    persona.setOwner(circle);
    persona = await persona.save();
    // log("Circle createOrGetExternalCircle", circle);

    window.circles[circle.filePath] = circle;
    window.circleTable[circle.fingerprint] = circle.filePath;
    window.personaeStructs[circle.personae] = circlePersonae;
    window.user.circles.push(circle.filePath);

    await window.user.save();

    
    return circle;
  }

  getSafeVersion(){
    // log("Circle getSafeVersion");
    throw new Error("not implemented");
  }

  isAdmin(identityOrPersona){
    return this.admins.includes(identityOrPersona.fingerprint);
  }

  async addAdministrator(identityOrPersona){
    if (!this.isAdmin(identityOrPersona)){
      this.admins.push(identityOrPersona.fingerprint);
    }
    this.save();
  }

  async removeAdministrator(identityOrPersona){
    let adminIndex = this.admins.indexOf(identityOrPersona.fingerprint);
    if(adminIndex > 0){
      this.admins.pop(adminIndex);
    }
    this.save();
  }

  // everything that has to do with conversations inside of this class can probably be deduplicated somehow later one.
  updateSummary(convo){
    // This does not save because we'll probably be doing other things as well.
    // this.conversationSummaries[convo.conversationKey] = {unreads: convo.unreads, lastMessageDate: convo.lastMessageDate};
    this.conversationSummaries[convo.conversationKey] = {
      unreads: convo.unreads,
      lastMessageDate: convo.lastMessageDate,
      circleFingerprint: convo.circleFingerprint,
      coreCircleFingerprint: this.fingerprint,
      identityFingerprint: convo.identityFingerprint,
      personaFingerprint: convo.personaFingerprint,
      otherPartyFingerprint: convo.otherPartyFingerprint
    };
  }

  getAllConversationSummaries(){
    // This returns an object of objects, summaries are updated when a conversation is updated for any reason.
    // { 
    //   'spamMessaging':{
    //     'otherPartyFingerprint':{
    //       'unreads': 10,
    //       'lastMessageDate': Date.now()
    //     }
    //   },
    //   'directMessaging':...,
    //
    //   'directCircleMessaging':{
    //     'circleFingerprint':{
    //       'otherPartyFingerprint':{
    //         'unreads': 0,
    //         'lastMessageDate': undefined
    //       }
    //     }
    //   },
    //   'vouchedMessaging':...,
    //   'generalCircleMessaging':...
    // }
    // log("Circle - getAllConversationsSummary", this);
    let summaries = {};
    Object.assign(summaries, this.conversationSummaries);
    return summaries;
  }

  async loadAllConversations(){
    // this should only be run when we first log in.  This function should never be awaited as it can take a long time.
    let conversationEntries = Object.entries(this.conversations);
    // log("Circle loadAllConversations", conversationEntries);
    // if we've hit the max number of active conversations, sort them and only load the most recently updated ones.
    // everything else should be skipped until the user requests it somehow
    if (conversationEntries.length > 100){
      conversationEntries.sort(this.conversationSorter);
    }

    // remove the less active ones from the loading list
    conversationEntries.splice(100, conversationEntries.length-100-1);

    // get the filePaths
    let filePaths = [];
    for(let i=0;i< conversationEntries.length;++i){
      filePaths.push(conversationEntries[i][1]);
    }

    // log("Circle loadAllConversations", filePaths);
    // load the conversations
    let conversations = await Conversation.storedObjectBulkLoad(filePaths);

    // cache it in memory
    // log("Circle loaded conversations", conversations);
    for (let conversation of conversations){

      //open the conversation, this connects it to a messageHub.
      conversation.open();

      // cache it in memory
      window.conversations[conversation.conversationKey] = conversation;
    }
  }


  async createConversation(conversationName, conversationType, identity){
    log("Circle - createConversation", this, conversationType, identity);
    if (!this.isAdmin(identity)){
      throw new Error(`identtity ${identity.name}:${identity.fingerprint} cannot create a conversation in this circle, ${this.name}:${this.fingerprint}`);
    }

    //static async create(name='', type='core', personaeStructFilePath='', keys=null, internal=true){
    let persona = await Persona.create(conversationName, "message", ''); // Personae used as the specific conversation persona do not get linked to a PersonaeStruct
    log("Circle - createConversation", persona);
    let personaType = 'induction';

    // pick the right persona type for the conversation
    switch (conversationType){
      case "publicCircleMessaging":
        personaType = 'induction';
        break;
      case "generalCircleMessaging":
        personaType = 'messaging';
        break;
      default:
        personaType = 'induction';
    }

    log("Circle - createConversation, before adminPersona", identity);
    let adminPersona = identity.getPersona(personaType);
    log("Circle - createConversation, before adminMessagingSigil", adminPersona);

    // need to create a sigil for the conversation specific persona
    // the identity's personae should already have all of the sigils required for further signing or vouching later.
    let adminMessagingSigil = await adminPersona.createSigil(persona, ['message']);
    
    log("Circle - createConversation adminMessagingSigil", adminMessagingSigil);
    // add the sigil
    persona.addSigil(adminPersona, adminMessagingSigil);
  
    // set the owner of the persona to this circle
    persona.setOwner(this);

    // set the administrator
    persona.setAdministrator(adminPersona);

    persona.save(); // don't need to await, everything that's needed imediately is already saved.

    await window.user.save(); // always used to save newly created Personae filepaths to the user.
    window.keyPersona[persona.publicKey] = persona;
    // let conversationKey = `null/${conversationType}/${this.fingerprint}/${persona.fingerprint}`; // for reference. we use the conversationKey in conversation to make sure things work
    
    // identities need to be able to reference the conversation and
    // keeping track of which identity is accessing the conversation from the front end is convenient
    let identityConversationKey = `${identity.filePath}/${conversationType}/${this.filePath}/${persona.filePath}`;

    let conversation = new Conversation(undefined, conversationType, identity, this, persona);

    await conversation.save();

    log("created new conversation", conversation);
    this.conversations[conversation.conversationKey] = conversation.filePath;
    identity.conversations[identityConversationKey] = conversation.filePath;

    identity.updateSummary(conversation);
    identity.save();


    window.identities[identity.filePath] = identity;
    // add its summary to this circle's summaries
    this.updateSummary(conversation);
    await this.save();
    window.circles[this.filePath] = this;

    // cache the conversation for both routes
    window.conversations[conversation.conversationKey] = conversation;
    window.conversations[identityConversationKey] = conversation;
    log("added conversation to this circle,", this.fingerprint, conversation);

    return conversation;
  }

  async joinConversation(conversationType, conversationPersona, identity){
    // log("Circle - joinConversation", conversationType, conversationPersona);

    let circle = conversationPersona.getOwner();
    let admin = conversationPersona.getAdministrator();

    let identityConversationKey = `${identity.filePath}/${conversationType}/${this.filePath}/${conversationPersona.filePath}`;

    let conversation = new Conversation(undefined, conversationType, identity, this, conversationPersona);
    await conversation.save();

    // log("Circle - joinConversation, joined it:", conversation);

    this.conversations[conversation.conversationKey] = conversation.filePath;
    identity.conversations[identityConversationKey] = conversation.filePath;

    identity.updateSummary(conversation);
    identity.save();

    window.identities[identity.filePath] = identity;
    
    // add the conversation summary to the circle's conversationSummaries
    this.updateSummary(conversation);
    await this.save();

    window.circles[this.filePath] = this;

    // cache the conversation for both routes
    window.conversations[conversation.conversationKey] = conversation;
    window.conversations[identityConversationKey] = conversation;
    // log("Circle - joinConversation in this circle", this.fingerprint, conversation);

    return conversation;
  }

  async getConversationWithKey(conversationKey){
    // log("Circle - getConversationWithKey", conversationKey);

    // does the conversation belong to this circle?
    let conversationFilePath = this.conversations[conversationKey];

    // the conversation doesn't belong to this circle
    if (!conversationFilePath){
      error("This conversation doesn't belong to this circle", conversationKey, this.fingerprint);
      return;
    }

    // check to see if it's cached in memory
    let conversation = window.conversations[conversationKey];
    if (conversation){
      log("Circle getConversationWithKey conversation exists in memory", conversationKey, conversation);
      return conversation;
    }

    log("Circle getConversationWithKey, conversation doesn't exist in memory");

    // not cached in memory, we need to use the filePath and load it.
    conversation = await Conversation.load(conversationFilePath);
    if (conversation){
      // log("Circle getConversationWithKey loaded conversation", conversation);

      // cache it
      window.conversations[conversationKey] = conversation;
    }
    
    // if it is not in memory or does not exist on disk this returns undefined
    // we only want conversations that this circle owns.
    return conversation;
  }

  // creates all of the sigils required for a new member of the circle or an administrator
  async createAllSigils(identityOrPersonaeStruct, isAdmin = false){
    // log("Circle createAllSigils", identityOrPersonaeStruct, isAdmin);
    let personaeStruct;
    let circlePersonae = this.getPersonae();

    // it's a an identity, get its personaeStruct
    if (identityOrPersonaeStruct.typeName === 'Identity'){
      personaeStruct = identityOrPersonaeStruct.getPersonae();
    }
    // it's a personaeStruct, just assign it
    else{
      personaeStruct = identityOrPersonaeStruct;
    }

    // collect all of the promises so we can await them.
    let personaPromises = [];
    let sigilFilledPersonae = [];

    // go through each persona that we have and create a sigil for the incoming persona
    for(let personaType in personaeStruct){
      // log("Circle createAllSigils, inside loop", personaType);

      if (personaType === 'external'){continue;}
      if (personaType === 'admin' && !isAdmin){continue;}
      if (!PERSONA_TYPES.includes(personaType)){continue;}
      let circlePersona = this.getPersona(personaType);
      // log("Circle createAllSigils, circlePersona", circlePersona);
      let persona = personae[personaeStruct[personaType]];
      // kick off async tasks.
      let permission = personaType === "induction"? "message" : personaType;
      personaPromises.push(circlePersona.createSigil(persona, [permission])
        .then((sigil) => {
          // log("Circle createAllSigils, adding sigil for", personaType, sigil);
          persona.addSigil(circlePersona, sigil);
          sigilFilledPersonae.push(persona);
        })
      );
    }

    // log("Circle createAllSigils all personaPromises after loop", personaPromises);
    await Promise.allSettled(personaPromises); // this thing returns a bunch of fulfilled or rejected promises and not the return values
    // log("Circle createAllSigils, personas with new sigils", sigilFilledPersonae);

    // no need to await the bulkSave, we just need it done.
    Persona.bulkSave(sigilFilledPersonae);
  }
}

class VisitedLink {
  constructor(access_date, access_id, url, key) {
    this.accessDate = access_date;
    this.accessId = access_id; // base64string
    this.url = url;
    this.key = key;
    this.file_path;
    this.file_hash;
    this.helper_type; // Steward || Seeder.  Steward is a reuploader, a seeder will help via p2p.  Can do both or neither(shaaaame).
  }
}

class UploadInstance extends StoredObject {
  // This is created when the user initiates an upload.
  constructor(
    obj = {},
    local_key = '',
    local_torrent_key = '',
    local_file_keys = [],
    torrents = {},
    files = [],
    circle_fingerprint = '',
  ) {
    super()
    if (arguments.length == 1) {
      // console.log('THE LENGTH IS ONE')
      obj && Object.assign(this, obj)
    } else {
      this.local_key = local_key
      this.local_torrent_key = local_torrent_key
      this.local_file_keys = local_file_keys
      this.start_date = Date.now() // date it started, epoch
      this.finish_date // date it finished, epoch
      this.torrents // the distributed torrents.
      this.chunks // the distributed FileChunks,
      this.circle_fingerprint = circle_fingerprint
      this.store = upload_store
    }
  }
  static get store() {
    return upload_store
  }
  async getFiles() {
    let local_files = []
    for (let k of this.local_file_keys) {
      local_files.push(new FellowaryFile(await this.getItem(file_store, k)))
    }
    return local_files
  }
  async getTorrent() {
    //let torrent = await new FellowaryTorrent(this.getItem(torrent_store, this.local_torrent_key));
    //return torrent;
    return await this.getItem(torrent_store, this.local_torrent_key)
  }
}


class FileSystemObject extends StoredObject {
  constructor(
    parentDirectory = 'UUIDPlaceHolder',
    name='placeHolder',
    owner='fingerprintPlaceHolder',
    circle='fingerprintPlaceHolder'
  ){
    super();
    this.parentDirectory = parentDirectory;
    this.createdDate = Date.now();
    this.modifiedDate = this.createdDate;
    this.accessedDate = this.createdDate;
    this.name = '';
    this.size = 0;
    this.diskSize = 0;
    this.owner = owner;
    this.circle = circle;
  }
}

class Directory extends FileSystemObject {
  constructor(
    parentDirectory = null,
    directoryName = 'stuff',
    children = {},
    ){
    super(parentDirectory = parentDirectory);
    this.parentDirectory = directoryName;
    this.name = directoryName;
    this.children = children;
    this.store = 'directories';
  }

  static get store(){
    return 'directories';
  }

  async add(inFilePath, fso){
    this.children[inFilePath] = fso;
    this.size += 1;
    this.increaseDiskSize(fso.diskSize);
    this.save();
  }

  async increaseDiskSize(diskBytes){
    this.diskSize += diskBytes;
    let parent = await Directory.load(this.parentDirectory);
    parent.increaseDiskSize(diskBytes);
    parent.save();
  }

  async remove(inFilePath){
    this.size -= 1;
    this.decreaseDiskSize(this.children[inFilePath].diskSize);
    delete this.children[inFilePath];
    await this.save();
  }

  async decreaseDiskSize(diskBytes){
    this.diskSize -= diskBytes;
    let parent = await Directory.load(this.parentDirectory);
    parent.decreaseDiskSize(diskBytes);
    parent.save();
  }

  async delete(force = false){
    if (Object.entries(this.children).length === 0 || force){
      let parent = await Directory.load(this.parentDirectory);
      parent.decreaseDiskSize(this.diskSize);
      await window.db[this.store].delete(this.filePath);
      return true;
    }
    return false;
  }

  static async load(inFilePath){
    let directory = new Directory();

  }
}

class FellowaryFile extends StoredObject {
  constructor(
    obj = {},
    local_key = '',
    name = '',
    local_torrent_key = '',
    circle_fingerprint = '',
    chunk = [],
    res_id = '',
  ) {
    super()
    if (arguments.length == 1) {
      // console.log('THE LENGTH IS ONE')
      obj && Object.assign(this, obj)
    } else {
      this.local_key = local_key
      this.local_torrent_keys = local_torrent_keys
      this.local_upload_keys
      this.start_date
      this.finish_date
      this.processing
      this.name = name
      this.hash
      this.torrent_offset // what number file in the torrent is this?  0 indexed
      this.circle_fingerprint = circle_fingerprint // the circle that this file has been uploaded for
      this.chunks = chunks // list of FileChunk resource ids
      this.search_tokens = [] // list of individual words or whatever that this can be looked up by
      this.resource_id = res_id // this is the torrent's resource_id
    }
    this.store = file_store
  }
  static get store() {
    return file_store
  }

  async getChunks() {
    let local_chunks = []
    // console.log('getting chunks')
    for (let k of this.chunks) {
      local_chunks.push(new FileChunk(await this.getItem(chunk_store, k)))
    }
    // console.log('got chunks', local_chunks)
    return local_chunks
  }
  static async getItem(local_key) {
    let pulled_file = await super.getItem(local_key)
    // console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&')
    // console.log(pulled_file)
    let newfile = new FellowaryFile(await super.getItem(local_key))
    // console.log(newfile)
    // console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&')
    return newfile
    //let local_bytes_enc = await this.store.getItem(local_key);
    //let local_bytes = await decryptWithPassword(local_bytes_enc, config.local_password);
    //return getObject(local_bytes);
  }
}

class FellowaryTorrent extends StoredObject {
  // Every. Single. File.  Must be linked to a torrent.
  constructor(
    obj = {},
    local_key = '',
    raw = {},
    mag_link = '',
    f_path = '',
    pass = '',
    outer_pass = '',
    torrent_links = [],
    verifier_sig = '',
    uploader = '',
  ) {
    super()
    if (arguments.length == 1) {
      // console.log('THE LENGTH IS ONE')
      obj && Object.assign(this, obj)
    } else {
      this.local_key = local_key
      this.local_upload_keys
      this.local_file_keys
      this.raw = raw
      this.magnet_link = mag_link
      this.password = pass
      this.outer_password = outer_pass
      this.resource_id
      this.links = torrent_links
      this.verifier_signature = verifier_sig
      this.uploader = uploader
      this.store = torrent_store
    }
  }

  static get store() {
    return torrent_store
  }

  async getFiles() {
    let local_files = []
    for (k of this.local_file_keys) {
      local_files.push(await this.getItem(file_store, k))
    }
    return local_files
  }
}

class FileChunk extends StoredObject {
  // A File chunk's byte range can also take up the entire byte range of the file.  Check sizes 'n stuff
  constructor(
    obj = {},
    local_key = '',
    local_torrent_key = '',
    local_blob_key = '',
    local_file_keys = [],
    chunk_hash = '',
    password = '',
    outer_password = '',
    start_piece = 0,
    end_piece = 0,
  ) {
    super()
    if (arguments.length == 1) {
      // console.log('THE LENGTH IS ONE')
      obj && Object.assign(this, obj)
    } else {
      this.local_key = local_key
      this.local_torrent_key = local_torrent_key // to the torrent this file belongs to.  TODO change to list/multiple refs when not as sleepy.
      this.local_file_keys = local_file_keys // to the file(s) this chunk can belong to or even hold
      this.local_blob_key = local_blob_key // to the actual file data slice blob
      this.start_piece = start_piece // the first torrent piece that is contained in this chunk
      this.end_piece = end_piece // the last torrent piece that is contained in this chunk
      this.processing = false
      this.uploading = false
      this.start_date // when the file is first brought into the aggyinym system
      this.finish_date // when the file is uploaded to the storage server
      this.password = password
      this.outer_password = outer_password
      this.hash = chunk_hash // has of the raw chunk
      this.inner_shell_hash // determined at upload
      this.resource_id // determined at upload
      this.chunk_name
      this.links // determined at upload
      this.verifier_signature
      this.uploader
      this.store = chunk_store
    }
  }
  static get store() {
    return chunk_store
  }
  async getBlob() {
    return await this.getItem(blob_store, this.local_blob_key, true)
  }
}

class ChunkBlob extends StoredObject {
  constructor(local_key = '', blob = null) {
    super()
    this.local_key = local_key
    this.blob = blob // This is a UInt8Array, fyi
    this.store = blob_store
  }
  static get store() {
    return blob_store
  }
}

class AccessRequest {
  constructor(
    request_type,
    circle_fingerprint,
    circle_signature,
    voucher_fingerprint,
    voucher_public_key,
    voucher_signature,
    personae_bundle,
    inSignature
  ) {
    this.request_type = request_type;
    this.circle_fingerprint = circle_fingerprint; // the circle fingerprint that will do the access request 
    this.circle_to_voucher_signature = circle_signature; // the circle signature for the receiver, will be used for a /verified_post call in access request only
    this.circle_to_user_signature = circle_signature; // the circle signature for the receiver, will be used for a /verified_post call in access request only
    this.voucher_fingerprint = voucher_fingerprint; // The fingerprint of the voucher - used for both the vouch and access requests
    this.voucher_public_key = voucher_public_key; // the public key of the voucher - used for both the vouch and access reqeusts
    this.voucher_signature = voucher_signature;
    this.personae_bundle = personae_bundle; // this holds the personae public keys and signatures that are to be signed.
    this.signature = inSignature;
  }
}



async function dbInit(){
  window.db = new Dexie('fellowary');

  window.db.version(1).stores({
    logins: "&filepath",
    histories: "&filepath",
    users: "&filepath",
    identities: "&filepath",
    messages: "&filepath",
    messageStreamData: "&filepath",
    conversations: "&filepath",
    circles: "&filepath",
    personae: "&filepath",
    personaeStructs: "&filepath",
    configs: "&filepath",
    pages: "&filepath",
    torrents: "&filepath",
    directories: "&filepath",
    files: "&filepath",
    circledata: "&filepath",
    chunks: "&filepath",
    blobs: "&filepath"
  });

  await window.db.open().catch(function (err) {
      console.error('Failed to open db: ' + (err.stack || err));
  });
}
window.dbInit = dbInit;

window.genpass = genpass;
window.genname = genname;
window.db = db;
window.wait = wait;
window.Settings = Settings;
window.StoredObject = StoredObject;
window.Config = Config;
window.User = User;
window.Identity = Identity;
window.PERSONA_TYPES = PERSONA_TYPES;
window.PersonaeStruct = PersonaeStruct;
window.Persona = Persona;
window.Directory = Directory;
window.Conversation = Conversation;
window.PageHistory = PageHistory;
window.Message = Message;
window.MessageStream = MessageStream;
window.MessageStreamData = MessageStreamData;
window.VisitedLink = VisitedLink;
window.UploadInstance = UploadInstance;
window.FellowaryFile = FellowaryFile;
window.FellowaryTorrent = FellowaryTorrent;
window.FileChunk = FileChunk;
window.ChunkBlob = ChunkBlob;
window.QueryData = QueryData;
window.Circle = Circle;
window.CircleData = CircleData;
window.AccessRequest = AccessRequest;
}
},{}]},{},[1]);
