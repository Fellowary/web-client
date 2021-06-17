//console.log("insaltworker");
// self.sodium = {
//   onload: function (sodium) {
//     self.sodium = sodium; 
//   }
// };

function temporarySafariCheck() {
  let num = new Uint8Array(8);
  let dv = new DataView(num.buffer);
  if(!dv.getBigUint64){
    self.salty.createSigil = self.salty.safariCreateSigil;
    self.salty.readSigil = self.salty.safariReadSigil;
  }
}


self.sodiumReady = new Promise((resolve, reject) => {
  self.sodium = {
    onload: function(sodium) {
      self.sodium = sodium;
      resolve(true);
      self.sodiumReady = true;
    }
  };
});

importScripts("sodium.js");

importScripts("comlink.js");

//self._sodium = _sodium = require('libsodium-wrappers');
//self.sodium = null;
//console.log("printing from saltworker");
salty = {};

// salty.initSodium = async function(){
//   await _sodium.ready;
//   sodium = _sodium;
// };


salty.base58_map = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
salty.to_base58 = function(B,A){var d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/58|0;d[j]=n%58;j++}}while(j--)s+=A[d[j]];return s};
salty.from_b58 = function(S,A){var d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*58+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};


salty.concat = function(a, b){
  let c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
};


// this is a waste of a bunch of lines and should be combind with the other concat function when I have time.
salty.concat3 = function(a, b, c){
  let d = new Uint8Array(a.length + b.length + c.length);
  d.set(a);
  d.set(b, a.length);
  d.set(c, a.length+b.length);
  return d;
};

salty.getFingerprint = async function(publicKey64){
  
  if(!publicKey64 || typeof publicKey64 !== 'string' || publicKey64.length < 46){
    return '';
  }
  
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  //let pk = publicKey.slice(sodium.crypto_sign_BYTES, sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES);
  let fingerprint = sodium.crypto_generichash(sodium.crypto_generichash_BYTES, publicKey);
  let fingerprint58 = salty.to_base58(fingerprint, salty.base58_map);
  return fingerprint58;
};

// honestly i don't know if this is worth doing. hash here, transfer value then b58 it or hash and b58 it on the other side.
// there's probably a better way.  using this for now.
// this is not async because it's only called internally to the webworker
salty.getFingerprintRaw = function(publicKey){
  let fingerprint = sodium.crypto_generichash(sodium.crypto_generichash_BYTES, publicKey);
  return fingerprint;
};

salty.getPublicKeyName = async function(publicKey64){
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let nameBytesLength = publicKey.length - sodium.crypto_sign_BYTES - sodium.crypto_sign_PUBLICKEYBYTES - sodium.crypto_box_PUBLICKEYBYTES - 1;
  let nameBytes = new Uint8Array(nameBytesLength);
  nameBytes.set(publicKey.slice(publicKey.length-nameBytesLength, publicKey.length));
  let name = sodium.to_string(nameBytes);
  return name;
}

salty.createKeyPair = async function(name="", getFingerprint=false){
  await self.sodiumReady;
  let crypt = sodium.crypto_box_keypair();
  let sign = sodium.crypto_sign_keypair();
  let publicKey = salty.concat(sign.publicKey, crypt.publicKey);
  let privateKey = salty.concat3(sign.privateKey, crypt.privateKey, crypt.publicKey);
  let privateKey64 = sodium.to_base64(privateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  let nameBytes = sodium.from_string(name);
  let paddedNameByteLength = Math.min(nameBytes.length, 100);

  let paddedName = new Uint8Array(paddedNameByteLength + 1); // that '1' is for the flag byte.  we'd better not run out of space in case we need more flags.  right now we only use it for public or private.  i don't think it'll grow.
  paddedName.set(nameBytes.slice(0,100), 1);
  publicKey = salty.concat(publicKey, paddedName);

  publicKey[sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES+sodium.crypto_box_PUBLICKEYBYTES] = 1; // public key flag
  let signedPublicKey = salty.signCombined(publicKey, privateKey64);
  privateKey = salty.concat(privateKey, paddedName);
  if(getFingerprint){
    let fingerprint = salty.getFingerprintRaw(signedPublicKey);
    return Comlink.transfer({publicKey: signedPublicKey, privateKey, fingerprint},
                          [signedPublicKey.buffer, privateKey.buffer, fingerprint.buffer]);
  }
  return Comlink.transfer({publicKey: signedPublicKey, privateKey},
                          [signedPublicKey.buffer, privateKey.buffer]);
};

salty.signCombined = function(message, privateKey64) {
  let privateKey = sodium.from_base64(privateKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let sk = privateKey.slice(0,sodium.crypto_sign_SECRETKEYBYTES);
  let signedMessage = sodium.crypto_sign(message, sk);
  return Comlink.transfer(signedMessage, [signedMessage.buffer]);
};

salty.verifyCombined = function(signedMessage, publicKey64) {
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let pk = publicKey.slice(sodium.crypto_sign_BYTES, sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES);
  let message = sodium.crypto_sign_open(signedMessage, pk);
  if (!message) {
    return null;
  }
  return Comlink.transfer(message, [message.buffer]);
};

salty.signDetached = function(message, privateKey64) {
  let privateKey = sodium.from_base64(privateKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let sk = privateKey.slice(0,sodium.crypto_sign_SECRETKEYBYTES);
  let signature = sodium.crypto_sign_detached(message, sk);
  return Comlink.transfer(signature, [signature.buffer]);
};

salty.verifyDetached = async function(signature, message, publicKey64) {
  await self.sodiumReady;

  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let pk = publicKey.slice(sodium.crypto_sign_BYTES, sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES);
  let valid = sodium.crypto_sign_verify_detached(signature, message, pk);
  return valid;
};

salty.encryptStringWithKey = function(message, publicKey64) {
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let pk = publicKey.slice(sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES,
                           sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES+sodium.crypto_box_PUBLICKEYBYTES);
  let messageBytes = sodium.from_string(message);
  return sodium.to_base64(sodium.crypto_box_seal(messageBytes, pk), sodium.base64_variants.URLSAFE_NO_PADDING);
};

salty.decryptStringWithKey = function(cipher64, publicKey64, privateKey64) {
  let privateKey = sodium.from_base64(privateKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let pk = publicKey.slice(sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES,
                           sodium.crypto_sign_BYTES+sodium.crypto_sign_PUBLICKEYBYTES+sodium.crypto_box_PUBLICKEYBYTES);
  let sk = privateKey.slice(sodium.crypto_sign_SECRETKEYBYTES,
                            sodium.crypto_sign_SECRETKEYBYTES+sodium.crypto_box_SECRETKEYBYTES);
  let cipher = sodium.from_base64(cipher64, sodium.base64_variants.URLSAFE_NO_PADDING);
  if (cipher.length < sodium.crypto_box_MACBYTES) {
      throw "Short message";
  }
  return sodium.to_string(sodium.crypto_box_seal_open(cipher, pk, sk));
};

salty.encryptWithPassword = async function(inBytes, password){
  await self.sodiumReady;
  
  let passwordBytes = sodium.crypto_generichash(32, sodium.from_string(password));
  let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(passwordBytes);
  let [state_out, header] = [res.state, res.header];
  let c = sodium.crypto_secretstream_xchacha20poly1305_push(state_out,
    inBytes, null,
    sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL);
  let encryptedBytes = salty.concat(header, c);
  return Comlink.transfer(encryptedBytes, [encryptedBytes.buffer]);
};
salty.decryptWithPassword = async function(inBytes, password){
  await self.sodiumReady;
  let passwordBytes = sodium.crypto_generichash(32, sodium.from_string(password));
  let header = inBytes.slice(0, sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES);
  let encryptedBytes = inBytes.slice(sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES);
  let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, passwordBytes);
  let r1 = sodium.crypto_secretstream_xchacha20poly1305_pull(state_in, encryptedBytes);
  let [decryptedBytes, tag1] = [r1.message, r1.tag];
  return Comlink.transfer(decryptedBytes, [decryptedBytes.buffer]);
};

// 256 bits
salty.hashToString = function(message){
  let hashBytes = sodium.crypto_generichash(sodium.crypto_generichash_BYTES, message);
  let hash64 = sodium.to_base64(hashBytes, sodium.base64_variants.URLSAFE_NO_PADDING);

  return hash64;
};

// 256 bits
salty.hashToBytes = function(message){
  let hashBytes = sodium.crypto_generichash(sodium.crypto_generichash_BYTES, message);
  return hashBytes;
};

// 128 bits
salty.hashToString16 = function(message){
  let hashBytes = sodium.crypto_generichash(sodium.crypto_generichash_BYTES_MIN, message);
  let hash64 = sodium.to_base64(hashBytes, sodium.base64_variants.URLSAFE_NO_PADDING);

  return hash64;
};

// 128 bits base58
salty.hashToBase5816 = function(message){
  let hashBytes = sodium.crypto_generichash(sodium.crypto_generichash_BYTES_MIN, message);
  let hash58 = this.to_base58(hashBytes, this.base58_map);

  return hash58;
};

// 128 bits
salty.hashToBytes16 = function(message){
  let hashBytes = sodium.crypto_generichash(sodium.crypto_generichash_BYTES_MIN, message);
  return hashBytes;
};

salty.createSigil = async function(privateKey64, publicKey64, voucheePublicKey64, permissionDatePairs){
  await self.sodiumReady;

  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let voucheePublicKey = sodium.from_base64(voucheePublicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let dpLength = Object.entries(permissionDatePairs).length;
  let permissions = new Uint8Array(dpLength*24);
  let i=0;


  for (let [key, value] of Object.entries(permissionDatePairs)){
    let permissionName = sodium.from_string(key);

    //console.log(key, permissionName);
    permissions.set(permissionName, 24*i); // wasted space but screw it.
    //console.log(permissions);
    let num = new Uint8Array(8);
    let dv = new DataView(num.buffer);
    dv.setBigUint64(0, BigInt(value), true/*little endian*/);

    //console.log(num);
    //console.log("setting exp date @", i*24+16);
    permissions.set(num, i*24+16);
    //console.log(permissions);
    ++i;
  }
  let sigil = salty.concat(voucheePublicKey,permissions);
  let vpkLen = new Uint8Array(8);
  let dv = new DataView(vpkLen.buffer);


  dv.setBigUint64(0,BigInt(voucheePublicKey.length),true/*little endian*/);
  sigil = salty.concat(vpkLen,sigil);
  sigil = salty.concat(publicKey, sigil);
  let pkLen = new Uint8Array(8);
  dv = new DataView(pkLen.buffer);

  dv.setBigUint64(0,BigInt(publicKey.length),true/*little endian*/);
  sigil = salty.concat(pkLen, sigil);

  sigil = await salty.signCombined(sigil, privateKey64);

  let sigil64 = sodium.to_base64(sigil, sodium.base64_variants.URLSAFE_NO_PADDING);
  return sigil64; //{sigil64, sigil, pkLen, vpkLen, dpLength};
}

salty.readSigil = async function(sigil64){
  // this reads the sigil and if the sigil is valid an object will be returned
  // if it's not valid an empty string will be returned
  /*if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].createSigil(privateKey64,
    publicKey64, subPublicKey64, permissionDatePairs);*/
  if(!sigil64){
    return;
  }
  let sigil = sodium.from_base64(sigil64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let dv = new DataView(sigil.buffer, sodium.crypto_sign_BYTES, 8);
  let voucherLengthBytes = new Uint8Array(sigil.buffer, sodium.crypto_sign_BYTES, 8);
  let voucherLength = Number(dv.getBigUint64(0, true)); // true is for little endian always little endian
   // console.log(voucherLength);
  let voucher = sigil.slice(sodium.crypto_sign_BYTES+8, sodium.crypto_sign_BYTES+8+voucherLength);
  let voucher64 = sodium.to_base64(voucher, sodium.base64_variants.URLSAFE_NO_PADDING);
  let isValid = await salty.verifyCombined(sigil, voucher64);
   // console.log("here");
  if (!isValid){
    console.error("sigil cannot be verified");
    return "";
  }
   // console.log("here2");
  let sig = sigil.slice(0, sodium.crypto_sign_BYTES);
  dv = new DataView(sigil.buffer, sodium.crypto_sign_BYTES+8+voucherLength,8);
  let voucheeLength = Number(dv.getBigUint64(0, true));
   // console.log(voucheeLength);
  let vouchee = sigil.slice(sodium.crypto_sign_BYTES+8+voucherLength+8,
    sodium.crypto_sign_BYTES+8+voucherLength+8+voucheeLength);
  let vouchee64 = sodium.to_base64(vouchee, sodium.base64_variants.URLSAFE_NO_PADDING);
  let permissionsStart = sodium.crypto_sign_BYTES + 8 + 
                        voucherLength + 8 + 
                        voucheeLength;
  let permissionsLength = sigil.length - permissionsStart;
  if (permissionsLength % 24 && permissionsLength < 256*24){
     // console.log("permissions length is incorrect", sigil.length, permissionsStart, permissionsLength);
    return "";
  }

  let sigilBlob = sigil.slice(permissionsStart);
  let permissions = {};
   // console.log("permissionsstart and length", permissionsStart, permissionsLength);
   // console.log("permissionsLength  / 24", permissionsLength / 24);
  for (let i=0;i<permissionsLength/24;++i){
    let nameBytes = sigilBlob.slice(i*24, i*24+16);
    let name = sodium.to_string(nameBytes);
    name = name.split('\0')[0];
    let num = new Uint8Array(8);
    let dv = new DataView(sigilBlob.buffer, i*24+16, 8);
    let expirationDate = Number(dv.getBigUint64(0, true/*little endian*/));
     // console.log(name, expirationDate);
    permissions[name] = expirationDate;
  }
  let sigilObject = {
    voucher: voucher64,
    signature: sodium.to_base64(sig, sodium.base64_variants.URLSAFE_NO_PADDING),
    vouchee: vouchee64,
    permissions
  };
  return sigilObject;
};


salty.safariCreateSigil = async function(privateKey64, publicKey64, voucheePublicKey64, permissionDatePairs){

  await self.sodiumReady;


  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let voucheePublicKey = sodium.from_base64(voucheePublicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let dpLength = Object.entries(permissionDatePairs).length;
  let permissions = new Uint8Array(dpLength*24);
  let i=0;

  for (let [key, value] of Object.entries(permissionDatePairs)){

    let permissionName = sodium.from_string(key);
    //console.log(key, permissionName);
    permissions.set(permissionName, 24*i); // wasted space but screw it.

    //console.log(permissions);
    let num = new Uint8Array(8);
    let dv = new DataView(num.buffer);
    let bigValue = BigInt(value);
    dv.setUint32(0, Number(bigValue), true/*little endian*/);
    dv.setUint32(4, Number(bigValue >> 32n), true/*little endian*/);

    //console.log(num);
    //console.log("setting exp date @", i*24+16);
    permissions.set(num, i*24+16);
    //console.log(permissions);

    ++i;
  }
  let sigil = salty.concat(voucheePublicKey,permissions);
  let vpkLen = new Uint8Array(8);
  let dv = new DataView(vpkLen.buffer);

  let bigLength = BigInt(voucheePublicKey.length);
  dv.setUint32(0,Number(bigLength),true/*little endian*/);
  dv.setUint32(4,Number(bigLength >> 32n),true/*little endian*/);
  sigil = salty.concat(vpkLen,sigil);
  sigil = salty.concat(publicKey, sigil);
  let pkLen = new Uint8Array(8);
  dv = new DataView(pkLen.buffer);

  bigLength = BigInt(publicKey.length)
  dv.setUint32(0,Number(bigLength),true/*little endian*/);
  dv.setUint32(4,Number(bigLength >> 32n),true/*little endian*/);
  sigil = salty.concat(pkLen, sigil);

  sigil = await salty.signCombined(sigil, privateKey64);

  let sigil64 = sodium.to_base64(sigil, sodium.base64_variants.URLSAFE_NO_PADDING);
  return sigil64; //{sigil64, sigil, pkLen, vpkLen, dpLength};
}

salty.safariReadSigil = async function(sigil64){
  // this reads the sigil and if the sigil is valid an object will be returned
  // if it's not valid an empty string will be returned
  /*if (this.currentSaltWorker == this.workerCount){
    this.currentSaltWorker = 0;
  }
  return await this.saltWorkers[this.currentSaltWorker++].createSigil(privateKey64,
    publicKey64, subPublicKey64, permissionDatePairs);*/
  if(!sigil64){
    return;
  }
  let sigil = sodium.from_base64(sigil64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let dv = new DataView(sigil.buffer, sodium.crypto_sign_BYTES, 8);
  let voucherLengthBytes = new Uint8Array(sigil.buffer, sodium.crypto_sign_BYTES, 8);
  let voucherLength = Number((BigInt(dv.getUint32(4, true)) << 32n) + BigInt(dv.getUint32(0, true)));
   // console.log(voucherLength);
  let voucher = sigil.slice(sodium.crypto_sign_BYTES+8, sodium.crypto_sign_BYTES+8+voucherLength);
  let voucher64 = sodium.to_base64(voucher, sodium.base64_variants.URLSAFE_NO_PADDING);
  let isValid = await salty.verifyCombined(sigil, voucher64);
   // console.log("here");
  if (!isValid){
    console.error("sigil cannot be verified");
    return "";
  }
   // console.log("here2");
  let sig = sigil.slice(0, sodium.crypto_sign_BYTES);
  dv = new DataView(sigil.buffer, sodium.crypto_sign_BYTES+8+voucherLength,8);
  let voucheeLength = Number((BigInt(dv.getUint32(4, true)) << 32n) + BigInt(dv.getUint32(0, true)));
   // console.log(voucheeLength);
  let vouchee = sigil.slice(sodium.crypto_sign_BYTES+8+voucherLength+8,
    sodium.crypto_sign_BYTES+8+voucherLength+8+voucheeLength);
  let vouchee64 = sodium.to_base64(vouchee, sodium.base64_variants.URLSAFE_NO_PADDING);
  let permissionsStart = sodium.crypto_sign_BYTES + 8 + 
                        voucherLength + 8 + 
                        voucheeLength;
  let permissionsLength = sigil.length - permissionsStart;
  if (permissionsLength % 24 && permissionsLength < 256*24){
     // console.log("permissions length is incorrect", sigil.length, permissionsStart, permissionsLength);
    return "";
  }

  let sigilBlob = sigil.slice(permissionsStart);
  let permissions = {};
   // console.log("permissionsstart and length", permissionsStart, permissionsLength);
   // console.log("permissionsLength  / 24", permissionsLength / 24);
  for (let i=0;i<permissionsLength/24;++i){
    let nameBytes = sigilBlob.slice(i*24, i*24+16);
    let name = sodium.to_string(nameBytes);
    name = name.split('\0')[0];
    let num = new Uint8Array(8);
    let dv = new DataView(sigilBlob.buffer, i*24+16, 8);
    let expirationDate = Number((BigInt(dv.getUint32(4, true)) << 32n) + BigInt(dv.getUint32(0, true)));
     // console.log(name, expirationDate);
    permissions[name] = expirationDate;
  }
  let sigilObject = {
    voucher: voucher64,
    signature: sodium.to_base64(sig, sodium.base64_variants.URLSAFE_NO_PADDING),
    vouchee: vouchee64,
    permissions
  };
  return sigilObject;
};

/*
salty.encryptStringWithKeysAuth = function(message, publicKey64, privateKey64) {
  let sodium = self.sodium;
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let privateKey = sodium.from_base64(privateKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let messageBytes = sodium.from_string(message);
  nonce = self.sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
   // console.log("nonce:", nonce);
  return this.concatArray(nonce, sodium.crypto_box_easy(messageBytes, nonce, publicKey, privateKey));
};

salty.decryptStringWithKeysAuth = function(noncecipher64, publicKey64, privateKey64) {
  let sodium = self.sodium;
  let publicKey = sodium.from_base64(publicKey64, sodium.base64_variants.URLSAFE_NO_PADDING);
  let privateKey = sodium.from_base64(privateKey64, sodium.base64_variants.URLSAFE_NO_PADDING);

  let nonce_and_ciphertext = sodium.from_base64(noncecipher64, sodium.base64_variants.URLSAFE_NO_PADDING);
  if (nonce_and_ciphertext.length < sodium.crypto_box_NONCEBYTES + sodium.crypto_box_MACBYTES) {
      throw "Short message";
  }
  let nonce = nonce_and_ciphertext.slice(0, sodium.crypto_box_NONCEBYTES),
      ciphertext = nonce_and_ciphertext.slice(sodium.crypto_box_NONCEBYTES);
  return sodium.crypto_box_open_easy(ciphertext, nonce, publicKey, privateKey);
};
*/

//initSodium();

// safari team, why does DataView's set/getBigUint64 not exist here?
// having to do this kind of feature detection hurts my soul.
temporarySafariCheck();

salty.init = async function(){
  return Promise.resolve("worker is loaded");
}

Comlink.expose(salty);