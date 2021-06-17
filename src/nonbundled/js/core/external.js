if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

let external = {};
log = console.log;

external.makeSaltyRequest = async function(method='POST', url='', recipientPublicKey="", senderKey={}, payload={}){
  // log("makeSaltyRequest", recipientPublicKey, senderKey);
  window.testPublicKey = recipientPublicKey;
  window.testSenderKey = senderKey;
  window.testData = payload;
  window.testUrl = url;
  let encryptedPayload = await salty.encryptStringWithKey(JSON.stringify(payload), recipientPublicKey);
  let message = {
    publicKey: senderKey.publicKey,
    signature: await salty.signStringDetached(encryptedPayload, senderKey.privateKey),
    body: encryptedPayload
  };
  let encryptedMessage = {message: await salty.encryptStringWithKey(JSON.stringify(message), recipientPublicKey)};
  return external.makeRequest(method=method, url=url, data=encryptedMessage);
};


external.makeRequest = async function(method='GET', url='', data={}) {
  // Default options are marked with *
  if (method != 'GET'){
    const response = await fetch(url, {
      method: method, // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'omit', // include, *same-origin, omit
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    let res = await response; // parses JSON response into native JavaScript objects, redundant await???
    log("makeRequest", response);
    return res.json();
  }
  else{
    const response = await fetch(url, {
      method: method, // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'omit', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
    });
    return await response.json(); // parses JSON response into native JavaScript objects
  }
};

/*
makeRequest('https://example.com/answer', { answer: 42 })
  .then((data) => {
    console.log(data); // JSON data parsed by `response.json()` call
  });
  */

window.external = external;
}