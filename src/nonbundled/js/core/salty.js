if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var log = console.log;
// async function initSodium(){
//   // await window._sodium.ready;

//   // window.sodium = _sodium;
//   console.log("sodium", window.sodium);
// }
salty = {};

salty.base58_map = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
salty.to_base58 = function(B,A){var d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/58|0;d[j]=n%58;j++}}while(j--)s+=A[d[j]];return s};
salty.from_b58 = function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};


salty.saltWorkers = [];
salty.currentSaltWorker = 0; // round robin
// apple doesn't support navigator.hardwareconcurrency...
salty.fullWorkerCount = window.isSafari ? 8 : window.navigator.hardwareConcurrency;
salty.workerCount = 1;

async function initSalty(){
  // log("initializing saltworkers");
  let url = window.browser ? browser.extension.getURL("js/saltworker.js") : `/js/saltworker.js`;
  let started = false;
  // log("before saltworker loop");
  for (let i=0;i<salty.fullWorkerCount;++i){
    // log("before new Worker");
    let worker = new Worker(url);
    // log("after new Worker");
    let saltWorker = window.comlink.wrap(worker);
    // log("after comlink");
    // The reason we're awaiting is to make sure that before we try to create anymore workers
    // we've cached the first worker's script.  otherwise it will download them in parallel
    // which wastes tons of bandwidth
    salty.saltWorkers.push(saltWorker);
    await salty.saltWorkers[i].init();
  }
  salty.workerCount = salty.fullWorkerCount;
}

salty.concat = function(a, b){
  let c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
};

salty.randomString = async function(size){
  await window.sodiumReady;
  let rb = sodium.randombytes_buf(size);
  return sodium.to_base64(rb, sodium.base64_variants.URLSAFE_NO_PADDING);
};

salty.randomNumber = async function(){
  await window.sodiumReady;
  // log("randomNumber", sodium);
  // log("sodium randombytesbuf", window.sodiumReady);
  let rb = sodium.randombytes_buf(8);
  let dv = new DataView(rb.buffer);
  let num = dv.getUint32(); // little endian
  return num;
};


salty.getFingerprint = async function(publicKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  try{
    return await this.saltWorkers[this.currentSaltWorker++].getFingerprint(publicKey64);
  }
  catch(e){
    throw new Error("unable to get fingerprint from provided key");
  }
};

salty.getPublicKeyName = async function(publicKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].getPublicKeyName(publicKey64);
};


salty.createKeyPair = async function(name, getFingerprint=false){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  let keyPairs = await this.saltWorkers[this.currentSaltWorker++].createKeyPair(name, getFingerprint);
  // let nameOut = keyPairs.publicKey.slice(sodium.crypto_sign_BYTES+sodium.crypto_box_PUBLICKEYBYTES+sodium.crypto_box_PUBLICKEYBYTES);

  let nameBytesLength = keyPairs.publicKey.length - sodium.crypto_sign_BYTES - sodium.crypto_sign_PUBLICKEYBYTES - sodium.crypto_box_PUBLICKEYBYTES - 1;
  let nameBytes = new Uint8Array(nameBytesLength);
  nameBytes.set(keyPairs.publicKey.slice(keyPairs.publicKey.length-nameBytesLength, keyPairs.publicKey.length));
  let nameOut = sodium.to_string(nameBytes);

  keyPairs64 = {
    name: nameOut,
    publicKey: sodium.to_base64(keyPairs.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
    privateKey: sodium.to_base64(keyPairs.privateKey, sodium.base64_variants.URLSAFE_NO_PADDING)
  };
  if(getFingerprint){
    keyPairs64.fingerprint = salty.to_base58(keyPairs.fingerprint, salty.base58_map);
  }
  // log(`CREATE KEYPAIR ${keyPairs.fingerprint}`);
  keyPairs = null;
  return keyPairs64;
};

salty.encryptWithPassword = async function(inBytes, password){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].encryptWithPassword(inBytes, password);
};

salty.decryptWithPassword = async function(inBytes, password){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].decryptWithPassword(inBytes, password);
};

salty.signCombined = async function(message, privateKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].signCombined(message, privateKey64);
};

salty.verifyCombined = async function(signedMessage, publicKey64){
  /*let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let pk = publicKey.slice(sodium.crypto_sign_BYTES, sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES);
  let message = sodium.crypto_sign_open(signedMessage, pk);
  if (!message) {
    return null;
  }
  return message;*/
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].verifyCombined(signedMessage, publicKey64);
};

salty.signStringDetached = async function(messageString, privateKey64){
  let messageBytes = sodium.from_string(messageString);
  return await salty.signDetached(messageBytes, privateKey64);
}

salty.signDetached = async function(message, privateKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  let signature = await this.saltWorkers[this.currentSaltWorker++].signDetached(message, privateKey64);
  let signature64 = sodium.to_base64(signature, sodium.base64_variants.URLSAFE_NO_PADDING);
  return signature64;
};


salty.verifyDetached = async function(signature64, message, publicKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  let signature = sodium.from_base64(signature64, sodium.base64_variants.URLSAFE_NO_PADDING);
  return await this.saltWorkers[this.currentSaltWorker++].verifyDetached(signature, message, publicKey64);
};

salty.encryptStringWithKey = async function(inString, publicKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].encryptStringWithKey(inString, publicKey64);
}

salty.decryptStringWithKey = async function(cipher64, publicKey64, privateKey64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].decryptStringWithKey(cipher64, publicKey64, privateKey64);
}

// 256 bits
salty.hashToString = async function(message){
  if(this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].hashToString(message);
};

// 256 bits
salty.hashToBytes = async function(message){
  if(this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].hashToBytes(message);
};

// 128 bits
salty.hashToString16 = async function(message){
  if(this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].hashToString16(message);
};

salty.hashToBase5816 = async function(message){
  if(this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].hashToBase5816(message);
};

// 128 bits
salty.hashToBytes16 = async function(message){
  if(this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }

  return await this.saltWorkers[this.currentSaltWorker++].hashToBytes16(message);
};


/*
  A Sigil is just a permission granting object.  Sigil sounds cooler than Permission Token.
  It's composed of 4 types of things:
  Voucher Signature of the rest of this object crypto_sign_BYTES
  VoucherPublicKey crypto_sign_PUBLICKEYBYTES
  VoucheePublicKey crypto_sign_BYTES + crypto_sign_PUBLICKEYBYTES + crypto_box_PUBLICKEYBYTES + 100 bytes name
  Permission Name 16 Bytes utf-8 encoded text
  Permissions Expiration Date 8 bytes, milliseconds from utc epoch
  Permission Name etc.
  Permission Expiration Date etc.
  can contain up to 256 permission combos
*/
salty.createSigil = async function(privateKey64, publicKey64, voucheePublicKey64, permissionDatePairs){
  log("createSigil", privateKey64, publicKey64, voucheePublicKey64, permissionDatePairs);
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  log("createSigil, before worker call");
  return await this.saltWorkers[this.currentSaltWorker++].createSigil(privateKey64,
    publicKey64, voucheePublicKey64, permissionDatePairs);
};

salty.readSigil = async function(sigil64){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].readSigil(sigil64);
};

/*
salty.encryptStringWithKeysAuth = async function(inString, publicKey, privateKey){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].encryptStringWithKeysAuth(inString, publicKey, privateKey);
}

salty.decryptStringWithKeysAuth = async function(inString, publicKey, privateKey){
  if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].decryptStringWithKeysAuth(inString, publicKey, privateKey);
}*/


window.salty = salty;
//initSodium();
initSalty();
}