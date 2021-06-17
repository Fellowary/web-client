(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var validate = {};
var validator = window.validator;
var log = console.log;
var warn = console.warn;
var error = console.error;

validate.messageHubResponse = function(msg){
  if (typeof msg !== 'object'){
    return false;
  }
  for (let [key, value] of Object.entries(msg)){
    switch(key){
      case 'id':
        // log('validating key:', key);
        if (typeof value !== 'number' || value < 0){
          error(`${key} validation failed`);
          return false;
        }
        break;
      case 'status':
        // log('validating key:', key);
        if (typeof value !== 'string' || value.length < 3 || value.length > 40){
          error(`${key} validation failed`);
          return false;
        }
        break;
      case 'message': // This message is what validate.message will validate
        // log('validating key:', key);
        if(typeof value !== 'object' || value === null){
          error(`${key} validation failed`, typeof value !== 'object', value === null);
          return false;
        }
        break;
      default:
        // no unchecked fields allowed
        warn(`The message has an unspecified field`);
        return false;
    }
  }

  return true;
};

validate.messageHubConfirmation = function(msg){
  if(typeof msg !== 'object'){
    return false;
  }
  if(!msg.location || typeof msg.location !== 'string'){
    return false;
  }
  if(!msg.receiptDate || typeof msg.receiptDate !== 'string'){
    return false;
  }

  return true;
};

validate.messageHubDenial = function(msg){
  if(typeof msg !== 'object'){
    return false;
  }
  if(!msg.status || typeof msg.status !== 'string'){
    return false;
  }

  if(msg.status.slice(0,3) === '429'){
    if(!msg["message"] || typeof msg["message"] !== 'object'){
      return false;
    }
    if(msg["message"]["dateStamp"] === undefined || typeof msg["message"]["dateStamp"] !== 'string'){
      return false;
    }

    let date = new Date(msg["message"]["dateStamp"]);
    let today = new Date();
    if (date.toJSON() === null || date < today){
      return false;
    }
  }

  if(msg.status.slice(0,1) === '4'){
    return true;
  }
  if(msg.status.slice(0,1) === '5'){
    return true;
  }

  return false;
};

validate.messageWithReceipt = async function(msg){

  if (!msg.masterToServiceSignature 
    || typeof msg.masterToServiceSignature !== 'string'
    || msg.masterToServiceSignature.length < 84 || msg.masterToServiceSignature.length > 88){

    return new Promise.reject("Message receipt invalid because of the masterToServiceSignature");
  }

  if (!msg.servicePublicKey
    || typeof msg.servicePublicKey !== 'string'){

    return new Promise.reject("Message receipt invalid because of the servicePublicKey");
  }

  if (!msg.receiptSignature
    || typeof msg.receiptSignature !== 'string'
    || msg.receiptSignature.length < 84 || msg.receiptSignature.length > 88){

    return new Promise.reject("Message receipt invalid because of the receiptSignature");
  }

  if (!msg.receiptDate
    || typeof msg.receiptDate !== 'string'
    || msg.receiptDate.length !== 24){
    return new Promise.reject("Message receipt invalid because of the receiptDate");
  }

  if (!msg.data
    || typeof msg.receiptDate !== 'string'){
    return new Promise.reject("Message receipt invalid because of the receiptDate");
  }

  return msg;
};


validate.pulledMessage = function(msg){

};

validate.pushedUserMessages = function(msg){
  if(typeof msg !== "object"){
    return false;
  }
  // must have a reason
  if (msg.reason === undefined || typeof msg.reason !== "string"){
    return false;
  }
  else{
    // acceptable reasons are user messages and provider messages
    if (msg.reason !== "userMessages"){
      return false;
    }
  }

  if (msg.fingerprintChain === undefined || typeof msg.fingerprintChain !== "string"){
    return false;
  }

  if(!msg.messages || !Array.isArray(msg.messages)){
    return false;
  }

  return true;
}

validate.pushedSystemMessage = function(msg){
  if(typeof msg !== "object"){
    return false;
  }
  // must have a reason
  if (msg.reason === undefined || typeof msg.reason !== "string"){
    return false;
  }
  else{
    // acceptable reasons are user messages and provider messages
    if (msg.reason !== "systemMessage"){
      return false;
    }
  }

  // TODO: there should be a reason for this but I don't know what for yet.
  return true;
}

validate.link = function(link){
  // console.log(link);
  if(typeof link !== 'object'){
    return false;
  }

  if(!link.config || !link.keys || !link.sigils){
    return false;
  }

  if(typeof link.config !== 'object'
    || typeof link.config.publicKey !== 'string' || link.config.publicKey.length > 300 || link.config.publicKey.length < 100 || !utils.isBase64(link.config.publicKey)
    || typeof link.config.url !== 'string' || link.config.url.length > 300 || link.config.publicKey.url < 3 && link.config.url.startsWith("https://")) {
    return false;
  }

  if(typeof link.keys !== 'object'
    || typeof link.keys.publicKey !== 'string' || link.keys.publicKey.length > 300 || link.keys.publicKey.length < 100 || !utils.isBase64(link.keys.publicKey)
    || typeof link.keys.privateKey !== 'string' || link.keys.privateKey.length > 300 || link.keys.privateKey.length < 100 || !utils.isBase64(link.keys.privateKey)){
    return false;
  }

  if(typeof link.sigils !== 'object' || !Array.isArray(link.sigils) || link.sigils.length !== 2
    || typeof link.sigils[0] !== 'string' || link.sigils[0].length > 600 || link.sigils[0].length < 400 || !utils.isBase64(link.sigils[0])
    || typeof link.sigils[1] !== 'string' || link.sigils[1].length > 600 || link.sigils[1].length < 400 || !utils.isBase64(link.sigils[1])){
    return false;
  }
  
  return true;
}

// this is the object people send to each other to make sure they're a valid speaker.
// the message itself hold within it a user specific 
validate.outerMessage = async function(msg){
  if (typeof msg !== 'object'){
    return Promise.reject("outerMessage invalid because it's not even an object");
  }

  let hasSender = false;
  let hasReceiver = false;
  let hasSignature = false;
  let hasMessage = false;
  let hasSigils = false;

  for (let [key, value] of Object.entries(msg)){
    switch(key){
      case 'sender':
        // log("validating key:", key);
        if (typeof value !== 'string' || value.length < 42 || value.length > 300){
          log(`${key} validation failed`);
          return Promise.reject("outerMessage invalid because of the sender");
        }
        hasSender = true;
        break;
      case 'receiver':
        // log("validating key:", key);
        if (typeof value !== 'string' || value.length < 42 || value.length > 300){
          log(`${key} validation failed`);
          return Promise.reject("outerMessage invalid because of the receiver");
        }
        hasReceiver = true;
        break;
      case 'message':
        // log("validating key:", key);
        if (typeof value !== 'string' || value.length < 20){
          log(`${key} validation failed`);
          return Promise.reject("outerMessage invalid because of the message");
        }
        hasMessage = true;
        break;
      case 'signature':
        // log("validating signature", key);
        if(typeof value !== 'string' || value.length < 20){
          log(`${key} validation failed`);
          return Promise.reject("outerMessage invalid because of the signature");
        }
        hasSignature = true;
        break;
      case 'sigils':
        // log("validating signature", key);
        if (typeof value !== 'object' || !Array.isArray(value) || value.length > 4){
          log(`${key} validation failed`);
          return Promise.reject("outerMessage invalid because of the sigils");
        }
        hasSigils = true;
        break;
      default:
        // no unchecked fields allowed.
        return Promise.reject("outerMessage invalid because of an unspecified field");
    }
  }

  if (hasSender && hasReceiver && hasSignature && hasMessage && hasSigils){
    return msg;
  }

  return Promise.reject(`message invalid because not all fields were included,
    hasSender = ${hasSender}
    hasReceiver = ${hasReceiver}
    hasSignature = ${hasSignature}
    hasMessage = ${hasMessage}
    hasSigils = ${hasSigils}`
  );
};

validate.directMessage = async function(msg){
  if (typeof msg !== 'object'){
    return Promise.reject("directMessage invalid because msg wasn't an object");
  }
  if (msg["dateStamp"] === undefined
    || typeof msg["dateStamp"] !== 'string'){
    return Promise.reject("directMessage invalid because the dateStamp isn't a string.");
  }
  let earliestDate = new Date(-5752494000000);
  let date = new Date(msg["dateStamp"]);
  let today = new Date();
  if (date.toJSON() === null || date < earliestDate || date > today){
    return Promise.reject("directMessage invalid because the dateStamp isn't a valid date");
  }

  if (msg["message"] === undefined || typeof msg["message"] !== "string" || msg["message"].length > 1000){
    return Promise.reject("directMessage invalid because of the message");
  }
  if(msg["messageType"] === undefined || typeof msg["messageType"] !== "string"
    || (msg["messageType"] !== "directMessage" && msg["messageType"] !== "vouchRequest" && msg["messageType"] !== "vouchResponse") ){
    return Promise.reject("directMessage invalid because of the messageType");
  }
  if(msg["signature"] === undefined || typeof msg["signature"] !== "string"){
    return Promise.reject("directMessage invalid because of the signature");
  }
  return msg;
};


validate.publicCircleMessage = async function(msg){
  if (typeof msg !== 'object'){
    return Promise.reject("publicCircleMessage invalid because msg wasn't an object");
  }
  if (msg["dateStamp"] === undefined
    || typeof msg["dateStamp"] !== 'string'){
    return Promise.reject("publicCircleMessage invalid because the dateStamp isn't a string.");
  }
  let earliestDate = new Date(-5752494000000);
  let date = new Date(msg["dateStamp"]);
  if (date.toJSON() === null || date < earliestDate){
    return Promise.reject("publicCircleMessage invalid because the dateStamp isn't a valid date");
  }

  if (msg["message"] === undefined || typeof msg["message"] !== "string" || msg["message"].length > 1000){
    return Promise.reject("publicCircleMessage invalid because of the message");
  }
  if(msg["messageType"] === undefined || typeof msg["messageType"] !== "string"
    || (msg["messageType"] !== "publicCircleMessage" && msg["messageType"] !== "vouchRequest" && msg["messageType"] !== "vouchResponse") ){
    return Promise.reject("publicCircleMessage invalid because of the messageType");
  }
  if(msg["signature"] === undefined || typeof msg["signature"] !== "string"){
    return Promise.reject("publicCircleMessage invalid because of the signature");
  }
  return msg;
};


validate.vouchRequest = function(ar){

  if(typeof ar !== 'object')
    return false;
  if (Object.keys(ar).length !== 9)
    return false;
  for (let [key, value] of Object.entries(ar)){
    switch(key){
      case 'request_type':
        // log("validating key", key);
        if (typeof value !== 'string' || value !== 'vouch_request'){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'voucher_fingerprint':
        // log("validating key", key);
        if (typeof value !== 'string' || value.length < 42 || value.length > 46){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'voucher_public_key':
        // log("validating key", key);
        if (typeof value !== 'string' || value.length < 100 || value.length > 2000){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'voucher_signature':
        // log("validating key", key);
        if (typeof value !== 'string' || value !== ''){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'circle_admin_fingerprint':
        // log("validating key", key);
        if (typeof value !== 'string' || value !== ''){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'circle_admin_public_key':
        // log("validating key", key);
        if (typeof value !== 'string' || value !== ''){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'circle_admin_signature':
        // log("validating key", key);
        if (typeof value !== 'string' || value !== ''){
          log(`${key} validation failed`);
          return false;
        }
        break;
      case 'personae_bundle':
        // log("validating key", key);
        if (typeof value !== 'object'){
          log(`${key} validation failed - not an object`);
          return false;
        }
        else{
          for (let [iKey, iValue] of Object.entries(value)){
            // log("---validating", iKey, iValue);
            if (typeof iValue !== 'object'){
              log('not an object');
              log(`${key} validation failed`);
              return false;
            }
            else if (!iValue.publicKey || typeof iValue.publicKey !== 'string' || 
                     iValue.publicKey.length < 100 ||
                     iValue.publicKey.length > 2000){
              log(`${key} validation failed`);
              log("publicKey valdation fail");
              return false;
            }
          }
        }
        break;
      case 'signature':
        // log("validating key", key);
        if (typeof value !== 'string' || value.length > 88 || value.length < 84){
          log("signature validation failed");
          return false;
        }
        break;
      default:
        // there should no unchecked fields
        log(`the message has an unspecified field: ${key}`);
        return false;
    }
  }
  return true;
};



window.validate = validate;
}
},{}]},{},[1]);
