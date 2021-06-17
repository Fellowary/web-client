(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var makeBlockie = window.makeBlockie;
var anybase = window.anyBase;
var names = window.names;
var chineseRange = window.chineseRange;
var base2048 = window.base2048;
var base65536 = window.base65536;
var utils = {};

utils.textToBytes = function(input){
	const encoder = new TextEncoder();
	return encoder.encode(input); // Uint8Array created
};

utils.textToB64 = function(input){
	const textBuffer = utils.textToBytes(input);
	return btoa(textBuffer);
}

utils.bytesToString = function(input_bytes){
	let dec = new TextDecoder("utf-8");
	return dec.decode(input_bytes);
}

utils.toHexString = function (byteArray) {
  //const chars = new Buffer(byteArray.length * 2);
  const chars = new Uint8Array(byteArray.length * 2);
  const alpha = 'a'.charCodeAt(0) - 10;
  const digit = '0'.charCodeAt(0);

  let p = 0;
  for (let i = 0; i < byteArray.length; i++) {
      let nibble = byteArray[i] >>> 4;
      chars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
      nibble = byteArray[i] & 0xF;
      chars[p++] = nibble > 9 ? nibble + alpha : nibble + digit;    
  }

  return String.fromCharCode.apply(null, chars);
}

// this encodes a clean unicode representation of our data.  it's meant to take up as little visual space as possible.
utils.encode2048 = function(byteArray) {

  return base2048.encode(byteArray);
};

utils.decode2048 = function(inputString){
  return base2048.decode(inputString);
};


utils.encode65536 = function(byteArray) {

  return base65536.encode(byteArray);
};

utils.decode65536 = function(inputString){
  return base65536.decode(inputString);
};

utils.insecureHash = async function(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
};

utils.bytesToObject = function(input_bytes){
    let obj_string = utils.bytesToString(input_bytes);
    return JSON.parse(obj_string);
}


utils.textToSHA512 = async function(input){
	const textBuffer = utils.textToBytes(input);
	return await crypto.subtle.digest('SHA-512', textBuffer); // ArrayBuffer
};

utils.textToSHA512Str = async function(input){
	const hashBuffer = await utils.textToSHA512(input);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
};

utils.getIdenticon = async function(seed){
	let img = new Image();
	img.src = makeBlockie(seed);
	return img;
};

utils.binarySearch = function(arr, item){
  // just a binary search
  let left = 0;
  let right = arr.length-1;
  while(left <= right){

    let mid = left + ((right - left) >>> 1);

    if (item > arr[mid]){
      left = mid+1;
    }
    else if (item < arr[mid]){
      right = mid-1;
    }
    else{
      return mid;
    }
  }

  return -1;
}

utils.isObjectEmpty = function (obj) {
  for(var k in obj) return false;
  return true;
}


utils.objectToBytes = function(input){
	let objectString = JSON.stringify(input);
	return utils.textToBytes(objectString);
};

utils.titleCase = function(str){
	str = str.toLowerCase().split(' ');
	for (var i = 0; i < str.length; i++) {
		if (str[i] != 'the' && str[i] != 'of'){
			str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
		}
	}
	return str.join(' ');
};

utils.arrayEquals = function(array1, array2){
    if (!array1 || !array2)
        return false;

    if (array1.length != array2.length)
        return false;

    for (var i = 0; i<array1.length; ++i) {    
        if (array1[i] != array2[i]) { 
            return false;   
        }           
    }     
	return true;
};

utils.getRandomName = async function(){
	let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

	let first = await salty.randomNumber() % 26;
	let second = await salty.randomNumber() % 26;
	//console.log("first", first);
	let fi = letters[first];
	let si = letters[second];
	let cls = names.class[await salty.randomNumber() % names.class.length];
	let faction = names.faction[await salty.randomNumber() % names.faction.length];
	let nameTemplate = utils.titleCase(`${fi}. ${si}., ${cls} of the ${faction}`);
	return nameTemplate;
};

utils.getRandomBreed = async function(){
  let breed = names.breed[await salty.randomNumber() % names.breed.length];
  return breed;
}

utils.getRandomOrganization = async function(){
  //console.log("in getRandomOrganization", names);
  let adjective = names.adjectives[await salty.randomNumber() % names.adjectives.length];
  let group = names.groups[await salty.randomNumber() % names.groups.length];
  let faction = names.faction[await salty.randomNumber() % names.faction.length];
  let organization = utils.titleCase(`${adjective} ${group} of the ${faction}`);
  return organization;
};

var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

utils.parse = function parse(s, buf, offset) {
  var i = (buf && offset) || 0;
  var ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

utils.prodOrTestCircleConfig = function(circleConfig){
  if (!window.testing){
    return circleConfig;
  }
  let newCircleConfig = Object.assign({}, circleConfig);

  for(let key in newCircleConfig){
    newCircleConfig[key].url = newCircleConfig[key].testUrl;
  }

  return newCircleConfig;
};


utils.isBase58JS = function(inString){
  let validChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  for(let i=0;i<inString.length;++i){
    if (!validChars.includes(inString[i]))
      return false;
  }
  return true;
};

const reg58 = /^[a-zA-HJ-NP-Z0-9]+$/;

utils.isBase58 = function(inString){
  return reg58.test(inString);
}

utils.getYearMonths = function(timeStamps){
  let yearMonthObject = {};
  let yearMonths = [];
  for(let timeStamp of timeStamps.length){
    let date = new Date(parseInt(timeStamp, 10));
    let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
    yearMonthObject[yearMonth] = 1;
  }

  yearMonths = Object.keys(yearMonthObject);
  yearMonths.sort();
  return yearMonths;
};

utils.bucketKeys = function(messageKeys = []){
  // tired of sorting keys and buckets and whatever.
  let messageBuckets = {
    first: {
      month: '',
      index: -1
    },
    last: {
      month: '',
      index: -1
    },
    buckets: {}
  };

  // put keys in their buckets
  for(let messageKey of messageKeys){
    let date = new Date(parseInt(messageKey.slice(0,13), 10));
    let yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
    if(!messageBuckets.buckets[yearMonth]){
      messageBuckets.buckets[yearMonth] = [];
    }
    messageBuckets.buckets[yearMonth].push(messageKey.slice(0,36));
    messageBuckets.first.month = messageBuckets.first.month > yearMonth || !messageBuckets.first.month ? yearMonth : messageBuckets.first.month;
    messageBuckets.last.month = messageBuckets.last.month < yearMonth || !messageBuckets.last.month ? yearMonth : messageBuckets.last.month;
  }

  // sort each bucket
  for(let yearMonth in messageBuckets.buckets){
    messageBuckets.buckets[yearMonth].sort();
  }

  // set the first bucket item
  if(messageBuckets.buckets[messageBuckets.first.month] && messageBuckets.buckets[messageBuckets.first.month].length){
    messageBuckets.first.index = 0;
  }

  // set the last bucket item
  if(messageBuckets.buckets[messageBuckets.last.month] && messageBuckets.buckets[messageBuckets.last.month].length){
    messageBuckets.last.index = messageBuckets.buckets[messageBuckets.last.month].length-1;
  }

  return messageBuckets;
};


utils.perf58JS = function(count, testString="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"){
  let t0 = performance.now();

  let isTrue = 0;
  let isFalse = 0;
  for(let i=0;i<count;++i){
    if (utils.isBase58(testString)){
      isTrue++;
    }
    else{
      isFalse++;
    }
  }
  let t1 = performance.now();
  console.log(`Call to doSomething took ${t1 - t0} milliseconds. true: ${isTrue}, false: ${isFalse}`);
}


utils.perf58Reg = function(count, testString="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"){
  let t0 = performance.now();

  let isTrue = 0;
  let isFalse = 0;
  for(let i=0;i<count;++i){
    if (utils.isBase58RegExp(testString)){
      isTrue++;
    }
    else{
      isFalse++;
    }
  }
  let t1 = performance.now();
  console.log(`Call to doSomething took ${t1 - t0} milliseconds. true: ${isTrue}, false: ${isFalse}`);
}


utils.isBase64JS = function(inString){
  let validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz12334567890-_";
  for(let i=0;i<inString.length;++i){
    if (!validChars.includes(inString[i]))
      return false;
  }
  return true;
}

//const reg = /^(?:[A-Za-z0-9_\-]{4})*(?:[A-Za-z0-9_\-]{2}|[A-Za-z0-9_\-]{3})?$/;
const reg64 = /^([A-Za-z0-9_-])+$/;

utils.isBase64 = function(inString){
  return reg64.test(inString);
}


utils.perf64JS = function(count, testString="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz12334567890-_"){
  let t0 = performance.now();

  let isTrue = 0;
  let isFalse = 0;
  for(let i=0;i<count;++i){
    if (utils.isBase64JS(testString)){
      isTrue++;
    }
    else{
      isFalse++;
    }
  }
  let t1 = performance.now();
  console.log(`Call to doSomething took ${t1 - t0} milliseconds. true: ${isTrue}, false: ${isFalse}`);
}


utils.perf64Reg = function(count, testString="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz12334567890-_"){
  let t0 = performance.now();

  let isTrue = 0;
  let isFalse = 0;
  for(let i=0;i<count;++i){
    if (utils.isBase64RegExp(testString)){
      isTrue++;
    }
    else{
      isFalse++;
    }
  }
  let t1 = performance.now();
  console.log(`Call to doSomething took ${t1 - t0} milliseconds. true: ${isTrue}, false: ${isFalse}`);
}



utils.isFingerprint = function(inString){
  return inString.length < 46 && utils.isBase58(inString);
}

utils.unparse = function(buf, offset){
  var i = offset || 0;
  var bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}


utils.compressLinkObject = async function(linkObject){
  // placeholder for now, we need to pull apart the object, shove the necessary parts into a bytearray
  // and convert it to the densest url safe representation possible.
  // and make sure the params aren't sent to the server, so #hash

  // this is not urlsafe fyi
  return JSON.stringify(linkObject);
};


utils.log = function(...args){
  console.log("%cLOG:", "color: blue;", ...args); 
};

utils.sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

utils.warn = function(...args){
  console.log("%cWARN:", "color: blue;", ...args); 
};

utils.error = function(...args){
  console.log("%cERROR:", "color: red;", ...args); 
};

window.utils = utils;

}
},{}]},{},[1]);
