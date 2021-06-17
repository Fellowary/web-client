if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){
var genpass = window.genpass;
var fm = window.fileManager;
var cm = window.circleManager;
var external = window.external;
var validate = window.validate;

var ajv = window.ajv;
// browser specific function.

var systemState = {};
var backend = {};

backend.fellowaryVersion = '0.0.1';

let log = console.log;
let error = console.error;


// transfers sessionStorage from one tab to another
var sessionStorage_transfer = function(event) {
  if(!event) { event = window.event; } // ie suq
  if(!event.newValue) return;          // do nothing if no value to work with
  if (event.key == 'getSessionStorage') {
    // another tab asked for the sessionStorage -> send it
    localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
    // the other tab should now have it, so we're done with it.
    localStorage.removeItem('sessionStorage'); // <- could do short timeout as well.
  } else if (event.key == 'sessionStorage' && !sessionStorage.length) {
    // another tab sent data <- get it
    var data = JSON.parse(event.newValue);
    for (var key in data) {
      sessionStorage.setItem(key, data[key]);
    }
  }
};

// listen for changes to localStorage
if(window.addEventListener) {
  window.addEventListener("storage", sessionStorage_transfer, false);
} else {
  window.attachEvent("onstorage", sessionStorage_transfer);
};


// Ask other tabs for session storage (this is ONLY to trigger event)
if (!sessionStorage.length) {
  localStorage.setItem('getSessionStorage', 'foobar');
  localStorage.removeItem('getSessionStorage', 'foobar');
};


if(window.browser){
  // window.browser means we're running in an extension
  var extensionID = browser.runtime.id;
  var chromeURLBase = `chrome-extension://${extensionID}`;
  var mozillaURLBase = `mozilla-extension://${extensionID}`;
  backend.extensionURLBase = browser.runtime.getBrowserInfo ? mozillaURLBase : chromeURLBase;
}

async function openOverlay() {
  console.log('got a click');
  //browser.tabs.sendMessage(tabId, message, options);
  //browser.tabs.sendMessage(tabId, message, {frameId: "3sdfjsdyfidunno"});
  //let currentTab = await browser.tabs.getCurrent();
  if (browser){
    let currentTab = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    let message = {
      reason: 'TOGGLE_OVERLAY',
      payload:  {},
    };

    browser.tabs.sendMessage(currentTab[0].id, message);
    console.log("after send message");
  }
}

// For extensions only, not the site.
async function openDashboard(){
  if(browser){
    browser.tabs.create({
      index: 0,
      pinned: true,
      active: true,
      url: browser.extension.getURL('index.html')
    });
  }
}

backend.getDashboards = async function(){
  return browser.tabs.query({
    url: browser.extension.getURL('index.html')
  });
};

backend.getFrontEnds = async function(){
  // for now this is dashboards, in the future we'll include the overlay as well.
  let dashboards = (await backend.getDashboards());
  // log("getfrontends", dashboards);
  let frontends = [];
  for(let x of dashboards){
    frontends.push({tabId: x.id});
  }
  //let overlays = getOverlays();
  //let extensionButton = getExtensionButton();
  return frontends;
};

backend.messageFrontend = async function(payload, frontends=[]){

  if(browser){
    // If we're in an extension see if we've been provided frontends
    if (frontends.length === 0){
      // we haven't been so we grab all of the ones that the extension is able to see from the brower api
      // log("frontends is empty, finding active dashboards");
      frontends = await backend.getFrontEnds();
    }

    // we should have a list of frontends that we can send messages to now.
    // we will send the message to all of them.
    // log("messageFrontend", frontends, payload);
    for(let i=0;i<frontends.length;++i){
      if (frontends[i].frameId){
        // if it's an iframe (any frame?) then send it directly to that iframe
        browser.tabs.sendMessage(frontends[i].tabId, payload, {frameId: frontends[i].frameId});
      }
      else{
        // if it's not an iframe then send it to the tab and that should be enough
        browser.tabs.sendMessage(frontends[i].tabId, payload);
      }
    }
  }
  else{
    // log("messageFrontend", payload);
    // We are not in an extension, use the frontend messageHandler directly
    window.handleFrontendMessage(payload);
  }
};

async function openBoth(){
  //openOverlay();
  openDashboard();
}

// browser taskbar icon clicked
if(browser){
  browser.browserAction.onClicked.addListener(openBoth);
}

backend.signUp = async function(username, password){
    // Create a user directory and login info, only requires username and password.
    localStorage.setItem('thereMightBeAnAccount', true);
    return cm.createUser(username, password);
    //config = new Config(local_password=genpass());
};

backend.signIn = async function(username, password){
  log("trying to signin");
  await window.sodiumReady;
  let signedIn = await cm.getUser(username, password);
  log("signin ", signedIn);
  if (signedIn){
    backend.loadAllCircleData();
    backend.loadMessageStreams();
  }
  window.initStoragePersistence();
  return signedIn;
};


backend.getInvite = async function(inviteUrl){
  log("backend getInvite", inviteUrl);

  return window.user.getInvite(inviteUrl);
};

backend.acceptInvite = async function(inviteUrl, identityFingerprint){
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  return identity.acceptInvite(inviteUrl);
};

backend.rejectInvite = async function(inviteUrl){
  delete window.invites[inviteUrl];
  // window.invites[inviteUrl] = undefined;
  return {status: "success"}; 
};

backend.setCurrentPage = async function(path){
  return await window.user.setCurrentPage(path);
};


backend.signOut = function(){
  window.user = undefined;
  window.identities = undefined;
  window.identityTable = undefined;
  window.circles = undefined;
  window.vouchRequesters = undefined;
  window.circleDatae = undefined;
  window.vouchRequesterList = undefined;
  window.testIdentity = undefined;
  for(let key in window.messageStreams){
    window.messageStreams[key].close();
  }
  window.messageStreams = undefined;
  window.circleTree = undefined;
  window.circleTable = undefined;
  window.config = undefined;
  window.conversations = undefined;
  window.activeConversations = undefined;
  window.personaTable = undefined;
  window.personae = undefined;
  window.personaeStructs = undefined;
  window.keyPersona = undefined;
  window.currentPage = undefined;
};

backend.loadAllCircleData = async function(){
  // log("loadAllCircleData", window.identities);
  for (key in window.identities){
    let identityFingerprint = window.identities[key].fingerprint;
    window.circleDatae[key] = backend.getCircleDataAll(identityFingerprint);
  }
};

backend.loadMessageStreams = async function(){
  window.messageStreams = await MessageStream.loadAll();
};



backend.getConfig = async function(){

};

backend.setConfig = async function(){

};

backend.directory = async function(){

};

backend.inductionStatus = async function(){

};

backend.uploadFile = async function(){

};

backend.getFile = async function(){

};

backend.downloadFile = async function(){

};

backend.removeFile = async function(){

};

backend.reportFile = async function(){

};

backend.importFile = async function(){

};

backend.exportFile = async function(){

};

backend.importAccount = async function(){

};

backend.exportAccount = async function(){

};


backend.currentAccount = async function(){
  // log("current account function");
  if (window.user !== undefined && window.user){
    let primaryIdentity = {};
    Object.assign(primaryIdentity, window.identities[window.user.primaryIdentity]);
    // remove file paths
    delete primaryIdentity.filePath;
    // log("before primaryIdentity personaeFingerprints");
//    primaryIdentity.inductionFingerprint = window.user.getPrimaryIdentity().getPersona('induction').fingerprint;
    primaryIdentity.personaeFingerprints = window.identities[window.user.primaryIdentity].getPersonaeFingerprints();
    //console.log("GOT PERSONAE FINGERPRINTS");
    delete primaryIdentity.personae;
    primaryIdentity.circles = backend.justFingerprints(primaryIdentity.circleData);
    delete primaryIdentity.circleData;
    let primaryCircle = {};
    Object.assign(primaryCircle, window.circles[primaryIdentity.primaryCircle]);
    //console.log("PRIMARY IDENTITY AFTER ASSIGN", primaryIdentity);
    delete primaryIdentity.primaryCircle;
    delete primaryCircle.filePath;
    delete primaryCircle.personae;
    let currentPage = await window.user.getCurrentPage();
    // log("currentAccount, currentPage", currentPage);
    return {
      username: window.user.username,
      fingerprint: window.user.fingerprint,
      avatar: window.user.avatar,
      publicKey: window.user.publicKey,
      privateKey: window.user.privateKey,
      primaryIdentity,
      primaryCircle,
      currentPage
    };
  }
  return false;
};

backend.justFingerprints = function(circlesObject){
  let circles = [];
  // log("justfingerprints circles object - circlesObject", circlesObject);
  for(let c of Object.keys(circlesObject)){
    if (c !== 'null'){
      // log("justfingerprints", c);
      circles.push(window.circles[c].fingerprint);
    }
  }
  // log("justfingerprints after loop");
  return circles;
};


backend.getCircleDataAll = async function(identityFingerprint){
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  // log("getcircledataall - identity", identity);
  let circleDataeList = await identity.getCircleDataAll();
  // log("circleDataeList", circleDataeList);
  let circleDatae = {};
  for(let i=0;i<circleDataeList.length;++i){
    // circleDatae[window.circles[circleDataeList[i].circleFilePath]] = circleDataeList[i];
    circleDatae[circleDataeList[i].circleFilePath] = circleDataeList[i];
  }
  return circleDatae;
};


backend.getVouchRequesters = async function(identityFingerprint){
  throw new Error("Not implemented");
};

backend.getVouchResponders = async function(identityFingerprint){
  
};

backend.getVotes = async function(identityFingerprint){
  
};

backend.getIdentitySettings = async function(identityFingerprint){

};


// TODO: this function needs to use Conversation rather than just a message
backend.sendVouchRequestMessage = async function(messageStream, circle, identity, persona, message, otherPartyPublicKey, inputDate){
  throw "sendVouchRequestMessage is no longer valid";
  // log("sendVouchRequestMessage, before salty, otherPartyPublicKey", otherPartyPublicKey);
  let otherPartyFingerprint = await salty.getFingerprint(otherPartyPublicKey);
  // log("sendVouchRequestMessage, after salty");
  let subscriptionEndpoint = `verified/${persona.fingerprint}/${otherPartyFingerprint}`;

  // log("sendVouchRequestMessage", "before addsubscriptions")

  let permissions = {message: new Date(new Date().setDate(new Date().getDate() + 30)).getTime()};
  let sigil = await salty.createSigil(persona.privateKey, 
    persona.publicKey,
    persona.publicKey,
    permissions
  );

  // log("sendVouchRequestMessage, sigil", sigil);
  let sig = await salty.signStringDetached(message, persona.privateKey);
  // log("sendmessage, sig:", sig);
  let userPayload = {
    sender: persona.publicKey,
    message: message,
    messageType: `message`,
    signature: sig
  };

  let savedMessage = new Message(
    filePath=undefined,
    inputDate = inputDate,
    identityFingerprint = identity.fingerprint,
    personaFingerprint = persona.fingerprint,
    circleFingerprint = circle? circle.fingerprint: null,
    otherPartyPublicKey = otherPartyPublicKey,
    signature = sig,
    message = message,
    messageType= "vouchRequestMessage",
    sigils = [sigil],
    status='unsent'
  );
  //await savedMessage.save();
  let fingerprintChain = `${persona.fingerprint}/${otherPartyFingerprint}`;

  // log("sendVouchRequestMessage, savedMessage", savedMessage);
  if (!identity.outbox[fingerprintChain]){
    identity.outbox[fingerprintChain] = [];
  }
  identity.outbox[fingerprintChain].push(savedMessage.filePath);
  await identity.save();

  let encryptedUserPayload = await salty.encryptStringWithKey(JSON.stringify(userPayload), otherPartyPublicKey);

  let siggy = await salty.signStringDetached(encryptedUserPayload, persona.privateKey);
  let messageHubPayload = {
    sender: persona.publicKey,
    receiver: otherPartyPublicKey,
    signature: siggy,
    message: encryptedUserPayload,
    sigils: [sigil]
  };

  let messageBundle = {
    verificationType: 'verified',
    receiver: otherPartyFingerprint,
    verifier: persona.fingerprint,
    filePath: savedMessage.filePath,
    message: messageHubPayload
  };
  // log("sendVouchReqeustMessage, before messageStream.send - messageBundle", messageBundle);
  messageStream.send(messageBundle);
};



backend.handleMessageSystem = function(systemMessage){
  // probably need to do something more at some point
  // log("handleSystemMessage", systemMessage);
};


backend.handleMessageUser = function(userMessagesPayload){
  // log("handleUserMessages", userMessagesPayload);
  // a validated pushed message which is for user messages has a fingerprint chain which we use to get our personae and conversations
  
};


backend.pushInstancesFrontend = async function (item){
  // This function pushes multiple instances to the front end.  Identities, Circles, Persona, Conversations all count.
  // don't mix them.
  // Not messages though.  Those come from conversations
  if(!item) return;

  let instances = {};
  let firstItem;
  if (!Array.isArray(item)){
    instances[item.getIdentifier()] = item.getSafeVersion();
    firstItem = item;
  }
  else{
    firstItem = item[0];
    for(let i of item){
      instances[i.getIdentifier()] = i.getSafeVersion();
    }
  }
  // log("pushInstancesFrontend instances, firstItem", instances, firstItem);
  let payload = {
    reason: firstItem.typeName.toLowerCase(),
    payload: instances,
  };
  backend.messageFrontend(payload);
};

backend.createConversation = async function(conversationObject) {
  switch(conversationObject.conversationType){
    case "directMessaging":
      return backend.createIdentityConversation(conversationObject);
      break;
    case "publicCircleMessaging":
      return backend.createPublicGeneralCircleConversation(conversationObject);
      break;
    default:
      throw new Error("we need a proper conversationType to create a conversation");
  }
};

backend.deleteConversation = async function(conversationKey){
  let [ifp,ct,cfp,pfp] = conversationKey.split('/');
  let identity = window.identities[ifp];
  return await identity.exciseConversation(conversationKey);
};

backend.deleteCircle = async function(identityFingerprint, circleFingerprint){
  log(`backend deleteCircle idf: ${identityFingerprint}, cf: ${circleFingerprint}`);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  let circleBundle = {};
  // if we're deleting the primary circle we need to create another local circle and make it the primary.
  // The reason we create another rather than just assigning any circle is because an existing circle
  // may have been modified in a way that makes it unpredictable.
  // No idea really, fresh circles are just a safer bet.
  if(circle.filePath === identity.primaryCircle){
    let newCircleOb = await backend.createCircle('', identityFingerprint);
    await backend.setPrimaryCircle(newCircleOb.fingerprint, identityFingerprint);
    let newCircle = cm.fingerprint2Instance('circle', newCircleOb.fingerprint);
    await newCircle.createAllSigils(identity, isAdmin=true);
    let firstConversation = await newCircle.createConversation("general", "publicCircleMessaging", identity);
    log("backend deleteCircle creating conversation", firstConversation);
    circleBundle = {
      circleName: newCircle.name,
      circleFingerprint: newCircle.fingerprint,
      otherPartyFingerprint: firstConversation.otherPartyFingerprint
    };
  }

  let deleted = await identity.exciseCircle(circle);
  log(`backend deleted: ${deleted}, bundle:`, circleBundle);
  return circleBundle;
};


backend.createIdentityConversation = async function({identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType}){
  // log("createConversation:", identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType);
  let e = new Error("just getting line numbers and stuff");
  console.log("createConversation errorcheck", e);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);

  let persona = await Persona.lookUp(otherPartyFingerprint, circle);
  let identityPersona = await Persona.lookUp(identityFingerprint, circle);

  await backend.pushInstancesFrontend([persona, identityPersona]);
  // log("createconversation", identity, circle, persona);
  // get or create the conversation
  let conversation = await identity.getOrCreateConversation(conversationType, circle, persona);

  // if we haven't communicated yet announce ourselves and listen for messages
  // don't rely on the other side receiving this message however.
  if(conversation.lastMessageDate === -5752494000000){
    conversation.open();
  }

  // returns the conversation key which contains the identityFingerprint, conversationType, circleFingerprint (if there is one), and the otherPartyFingerprint
  return {key: conversation.conversationKey};
};

backend.createPublicGeneralCircleConversation = async function({identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType}){
  const conversationName = otherPartyFingerprint;
  // log(`createPublicGeneralCircleConversation - identityFingerrprint: ${identityFingerprint}, circleFingerprint: ${circleFingerprint}, conversationName: ${conversationName}, conversationType: ${conversationType}`);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);

  // create the conversation if able and throws error if not.
  let conversation = await circle.createConversation(conversationName, "publicCircleMessaging", identity);
  
  // if we haven't communicated yet announce ourselves and listen for messages
  // don't rely on the other side receiving this message however.
  if(conversation.lastMessageDate === -5752494000000){
    conversation.open();
  }

  // returns the conversation key which contains the identityFingerprint, conversationType, circleFingerprint (if there is one), and the otherPartyFingerprint
  return {key: conversation.conversationKey};
};

backend.getConversationLink = async function(conversationKey){
  // log("getConversationLink", conversationKey);
  let conversation = await Conversation.getConversationWithKey(conversationKey);

  return conversation.getLink(); // async
};


backend.createPrivateGeneralCircleConversation = async function({identityFingerprint, circleFingerprint, conversationName}){
  // log("createPrivateGeneralConversation:", identityFingerprint, circleFingerprint, otherPartyFingerprint);
  let e = new Error("just getting line numbers and stuff");
  console.log("createCircleConversation errorcheck", e);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  // log("createconversation", identity, circle);

  // get or create the conversation
  let conversation = await circle.createConversation(conversationName, "generalCircleMessaging", identity);

  // if we haven't communicated yet announce ourselves and listen for messages
  // don't rely on the other side receiving this message however.
  if(conversation.lastMessageDate === -5752494000000){
    conversation.open();
  }

  // returns the conversation key which contains the identityFingerprint, conversationType, circleFingerprint (if there is one), and the otherPartyFingerprint
  return {key: conversation.conversationKey};
};


backend.createDirectCircleConversation = async function({identityFingerprint, circleFingerprint, conversationName}){
  // log("createConversation:", identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType);
  let e = new Error("just getting line numbers and stuff");
  console.log("createCircleConversation errorcheck", e);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);

  // log("createconversation", identity, circle);
  // get or create the conversation
  let conversation = await circle.createConversation(conversationName, conversationType, identity);

  // if we haven't communicated yet announce ourselves and listen for messages
  // don't rely on the other side receiving this message however.
  if(conversation.lastMessageDate === -5752494000000){
    conversation.open();
  }

  // returns the conversation key which contains the identityFingerprint, conversationType, circleFingerprint (if there is one), and the otherPartyFingerprint
  return {key: conversation.conversationKey};
};


backend.createServiceConversation = async function({identityFingerprint, circleFingerprint, conversationName}){
  // log("createConversation:", identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType);
  let e = new Error("just getting line numbers and stuff");
  console.log("createCircleConversation errorcheck", e);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);

  // log("createconversation", identity, circle);
  // get or create the conversation
  let conversation = await circle.createConversation(conversationName, conversationType, identity);

  // if we haven't communicated yet announce ourselves and listen for messages
  // don't rely on the other side receiving this message however.
  if(conversation.lastMessageDate === -5752494000000){
    conversation.open();
  }

  // returns the conversation key which contains the identityFingerprint, conversationType, circleFingerprint (if there is one), and the otherPartyFingerprint
  return {key: conversation.conversationKey};
};


backend.cleanSlate = async function(){
  log("deleting the db");
  await window.db.delete();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('fellowaryVersion', backend.fellowaryVersion);
  log("initializing the db");
  await window.dbInit();
}

backend.changeActiveConversation = function(activeConversationKey, inactiveConversationKey, tabID, frameID){
  // log("changeActiveConversation", activeConversationKey, inactiveConversationKey, tabID, frameID);
  backend.unsetActiveConversation(inactiveConversationKey, tabID, frameID);
  backend.setActiveConversation(activeConversationKey, tabID, frameID);
}

backend.setActiveConversation = function(conversationKey, tabID, frameID){
  // log("setActiveConversation", conversationKey, tabID, frameID);
  if (!conversationKey) {return;}

  if (!window.activeConversations[conversationKey]){
    window.activeConversations[conversationKey] = [];
  }
  let index = window.activeConversations[conversationKey].indexOf(`${tabID}-${frameID}`);
  if (index >=0){
    return;
  }
  window.activeConversations[conversationKey].push(`${tabID}-${frameID}`);
};

backend.unsetActiveConversation = function(conversationKey, tabID, frameID){
  // log("unsetActiveConversation", conversationKey, tabID, frameID);
  if (!conversationKey) {return;}
  if (!window.activeConversations[conversationKey]){
    window.activeConversations[conversationKey] = [];
  }
  let index = window.activeConversations[conversationKey].indexOf(`${tabID}-${frameID}`);
  if (index >=0){
    window.activeConversations[conversationKey].splice(index, 1);
  }
};

backend.sendMessage = async function(conversationKey, message, identityFingerprint){
  // get the conversation
  // log("backend.sendMessage, conversationKey, message", conversationKey, message);
  // let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  const [ifp,ct,cfp,opfp] = conversationKey.split('/');
  let identity = window.identities[ifp];
  let conversation = await Conversation.getConversationWithKey(conversationKey);

  window.conversations[conversationKey] = conversation;
  // send the message.  no need to wait.
  conversation.sendMessage(message, identity);
};

backend.setActiveFile = function(fileKey, tabID, frameID){
  // log("unsetActiveFile", conversationKey, tabID, frameID);
  throw Error("Not implemented");
}

backend.unsetActiveFile = function(fileKey, tabID, frameID){
  // log("unsetActiveFile", conversationKey, tabID, frameID);
  throw Error("Not implemented");
}

backend.currentIdentities = async function(){
  // log('currentIdentities function');
  if (window.identities !== undefined && window.identities){
    // log('logging window.identities', window.identities);
    let ids = {};
    for (let key in window.identities){
      // log('inside of loop');
      ids[window.identities[key].fingerprint] = {
        name: window.identities[key].name,
        avatar: window.identities[key].avatar,
        fingerprint: window.identities[key].fingerprint,
        publicKey: window.identities[key].publicKey,
        privateKey: window.identities[key].privateKey,
        primaryCircle: window.circles[window.identities[key].primaryCircle],
        circles: backend.justFingerprints(window.identities[key].circleData),
        personaeFingerprints: window.identities[key].getPersonaeFingerprints(),
        conversations: window.identities[key].getAllConversationSummaries(),
        friends: window.identities[key].friends,
        outbox: window.identities[key].outbox,
        receivedAccessResponses: window.identities[key].receivedAccessResponses,
        receivedVouchResponses: window.identities[key].receivedVouchResponses,
        sentAccessRequests: window.identities[key].sentAccessRequests,
        sentVouchRequests: window.identities[key].sentVouchRequests,
        queries: window.identities[key].queries,
        listed: window.identities[key].listed,
        bought: window.identities[key].bought,
        sold: window.identities[key].sold,
        polls: window.identities[key].polls,
        votes: window.identities[key].votes,
        history: window.identities[key].history,
        settings: window.identities[key].settings
      };
      // log("end of loop");
    }
    // log('ids is ', ids);
    return ids;
  }
  return false;
};

backend.getConversationMessages =  async function(conversationKey, tense='present'){
  // log("getConversationMessages", conversationKey, tense);
  let conversation = await Conversation.getConversationWithKey(conversationKey);
  window.convo = conversation;
  let convos = {};
  convos[conversationKey] = {
    messages: [],
    scrollTop: 0
  };

  let msgs = await conversation.getMessages(tense, true);
  // log(`getConversationMessages ${msgs.length}`, msgs);
  for(let i=0;i<msgs.length;++i){
    //console.log("getConversationMessages preoutput length of conversation messages", convos[conversationKey].messages.length);
    //let safeMessage = msgs[i].getSafeMessage();
    //console.log("safeMessage", safeMessage);
    convos[conversationKey].messages.push(msgs[i].getSafeMessage());
    //console.log(`getConversationMessage ${i}, ${convos[conversationKey].messages[i].signature}`);
  }
  conversation.save();
  log("getConversationMessages output", convos);
  return convos;
};

backend.getPersonae = async function(personaFingerprintList=[], circleFingerprint){
  // log("getPersonae fingerprintList", personaFingerprintList);
  if (!window.user){
    // we're shutting down, return nothing
    return {};
  }
  let circle;
  if (circleFingerprint){
    // log("getPersonae circleExists");
    circle = cm.fingerprint2Instance('circle', circleFingerprint);
  }
  else{
    circle = window.user.getPrimaryIdentity().getPrimaryCircle();
  }
  let loadedPersonae = {};
  let personaPromises = [];
  for(let fp of personaFingerprintList){
    personaPromises.push(
      Persona.lookUp(fp, circle)
      .then((persona) => {
        // log("getPersonae personaLookup promise", persona);
        loadedPersonae[persona.fingerprint] = persona.getSafeVersion();
      })
    );
  }

  await Promise.allSettled(personaPromises);
  // log("getPersonae after await allSettled", loadedPersonae);
  return loadedPersonae;
};

backend.setPrimaryIdentity = async function(fingerprint){
  // log('backend function setprimaryidentity ', fingerprint);
  return cm.setPrimaryIdentity(fingerprint);
};

backend.createIdentity = async function(name){
  let identityBundle = await cm.createIdentity(name);
  log("backend function createIdentity - ", identityBundle);
  return identityBundle;
};

backend.deleteIdentity = async function(fingerprint){
  // deleting an identity deletes its circles and conversations as well.
  let identity = cm.fingerprint2Instance('identity', fingerprint);
  if(window.user.primaryIdentity === identity.filePath){
    // if it's the only identity, create another in its place.
    if(Object.keys(window.identities).length === 1){
      let newIdentityStructure = await backend.createIdentity('');
      await backend.setPrimaryIdentity(newIdentityStructure.identityFingerprint);
      await identity.excise();
      return newIdentityStructure;
    }
    else{
      // otherwise, just go to the next one that isn't it.
      for(let i in window.identities){
        if(i !== window.user.primaryIdentity){
          backend.setPrimaryIdentity(window.identities[i].fingerprint);
          await identity.excise();
          break;
        }
      }
      let existingIdentity = window.user.getPrimaryIdentity();
      let existingCircle = existingIdentity.getPrimaryCircle();
      let otherPartyFingerprint = '';
      for(let summ in existingCircle.conversationSummaries){
        // doesn't really matter which one we take.
        otherPartyFingerprint = existingCircle.conversationSummaries[summ].otherPartyFingerprint;
        break;
      }

      const existingIdentityStructure = {
        identityName: existingIdentity.name,
        identityFingerprint: existingIdentity.fingerprint,
        circleFingerprint: existingCircle.fingerprint,
        otherPartyFingerprint: otherPartyFingerprint
      };

      return existingIdentityStructure;
    }
  }

  // copy pasting from above because i'm tired
  let existingIdentity = window.user.getPrimaryIdentity();
  for(let i in window.identities){
    if(i !== identity.filePath){
      existingIdentity = window.identities[i];
      await identity.excise();
      break;
    }
  }

  let existingCircle = existingIdentity.getPrimaryCircle();
  let otherPartyFingerprint = '';
  for(let summ in existingCircle.conversationSummaries){
    // doesn't really matter which one we take.
    otherPartyFingerprint = existingCircle.conversationSummaries[summ].otherPartyFingerprint;
    break;
  }

  const existingIdentityStructure = {
    identityName: existingIdentity.name,
    identityFingerprint: existingIdentity.fingerprint,
    circleFingerprint: existingCircle.fingerprint,
    otherPartyFingerprint: otherPartyFingerprint
  };


  return existingIdentityStructure;
};

backend.currentCircles = async function(){
  // log('currentCircles function');
  if(window.circles !== undefined && window.circles){
    // log('logging window.circles', window.circles);
    let circs = {};
    for (key in window.circles){
      circs[window.circles[key].fingerprint] = {
        name: window.circles[key].name,
        avatar: window.circles[key].avatar,
        admins: window.circles[key].admins,
        conversations: window.circles[key].getAllConversationSummaries(),
        fingerprint: window.circles[key].fingerprint,
        publicKey: window.circles[key].publicKey,
        privateKey: window.circles[key].privateKey,
        config: window.circles[key].circleConfig,
        settings: window.circles[key].settings
      };
    }
    // log("returning circs");
    return circs;
  }
  // log("returning circs false");
  return false;
};


backend.circleMembers = async function(fingerprint){
  // log('circleMembers function');
  let circle = cm.fingerprint2Instance('circle', fingerprint);
  //let members = 
};

backend.setPrimaryCircle = async function(circleFingerprint, identityFingerprint){
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint)
  identity.primaryCircle = circle.filePath;
  if (!identity.circleData[circle.filePath]){

    let circleData = await cm.createCircleData(undefined, circle.filePath, identity.filePath);
    // log("SET PRIMARY CIRCLE, circle path, identity path, circleData", circle.filePath, identity.filePath, circleData);
    window.circleDatae[identity.filePath][circle.filePath] = circleData;
    // log("setPrimaryCircle - circleData", circleData);
    identity.circleData[circle.filePath] = circleData.filePath;
  }
  await identity.save();
  window.identities[identity.filePath] = identity;
  return true;
};

backend.createCircle = async function(circleName, identityFingerprint=null){
  if (!identityFingerprint){
    throw Error("Creating a circle requires an identity");
  }
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = await cm.createCircle(circleName, identity);
  circle.save();
  if (!identity.primaryCircle){
    identity.primaryCircle = circle.filePath;
  }
  let circleData = new CircleData(filePath=undefined,
                                  circleFilePath=circle.filePath,
                                  identityFilePath=identity.filePath);
  await circleData.save();

  identity.circleData[circle.filePath] = circleData.filePath;
  await identity.save();
  window.circleDatae[identity.filePath][circle.filePath] = circleData;
  return {fingerprint: circle.fingerprint, name: circle.name};
};


backend.keyUpload = async function(circleFingerprint, identityFingerprint){
  // log("keyUpload", circleFingerprint, identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  // log("circle and identity", circle, identity);
  let induction = identity.getPersona("induction");
  let payload = {
    publicKey: induction.publicKey,
  };

  return external.makeRequest(
    method="POST",
    url=`${circle.config.keyHub.url}/keys`,
    data=payload
  );
};


backend.linkDownload = async function(linkHash){

};

backend.keyLookup = async function(circleFingerprint, identityFingerprint, fingerprint){
  // log("backend.keyLookup -", circleFingerprint, identityFingerprint, fingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);

  // get the default if the circle doesn't exist
  let keyHubUrl = circle ? circle.config.keyHub.url : window.user.default_circle_config.keyHub.url;

  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  // log("backend.keyLookup - before request");
  let response = await external.makeRequest(
    method='GET',
    url=`${keyHubUrl}/keys/${fingerprint}`
  );

  if(fingerprint.length < 42 || fingerprint.length > 46){
    error("fingerprint length is not 44", fingerprint.length); // not the same but whatever.
    return false;
  }
  // log("keyLookup responsePayload - ", response);
  if (!("publicKey" in response)){
    error("requestVouch publicKey isn't in response", response);
    return Promise.reject(new Error("Couldn't locate the Public Key"));
  }
  return response["publicKey"];
};

backend.sendVouchRequest = async function(circleFingerprint, identityFingerprint, vouchRequestPayload){
  // log("backend.sendVouchRequest -", circleFingerprint, identityFingerprint, vouchRequestPayload);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  // log("backend.sendVouchRequest - circle", circle);

  return external.makeRequest(
    method='POST',
    url=`${circle.config.messageHub.url}/verified`,
    data=vouchRequestPayload
  );
};

backend.createVouchRequestPayload = async function(identityFingerprint, voucherFingerprint, voucherPublicKey){
  let identity = cm.fingerprint2Instance("identity", identityFingerprint);
  let personaeBundle = await cm.getPersonaePublicKeys(identity);
  // log("personabundle - ", personaeBundle);
  let coreSignature = await salty.signStringDetached(personaeBundle.induction.publicKey, identity.getPersona("core").privateKey);
  // log("before access request", coreSignature);
  let vouchRequest = {
    request_type: "vouch_request",
    circle_admin_fingerprint: "",
    circle_admin_public_key: "",
    circle_admin_signature: "",
    voucher_fingerprint: voucherFingerprint,
    voucher_public_key: voucherPublicKey,
    voucher_signature: "",
    personae_bundle: personaeBundle,
    signature: coreSignature
  };

  if (!validate.vouchRequest(vouchRequest)){
    // log("validation of vouch request failed", vouchRequest);
    return null;
  }

  let inductionPersona = identity.getPersona("induction");
  // log("inductionpersona and identity- ", inductionPersona, identity);


  let encryptedUserPayload = await salty.encryptStringWithKey(JSON.stringify(vouchRequest), voucherPublicKey);
  // log("encrypted user payload", vouchRequest, encryptedUserPayload, voucherPublicKey);
  let signature = await salty.signStringDetached(encryptedUserPayload, inductionPersona.privateKey);

  let permissions = {message: new Date(new Date().setDate(new Date().getDate() + 30)).getTime()};
  let sigil = await salty.createSigil(inductionPersona.privateKey, 
    inductionPersona.publicKey,
    inductionPersona.publicKey,
    permissions
  );
  console.log("SIGIL OBJECT", await salty.readSigil(sigil));

  let vouchRequestPayload = {
    sigils: [sigil],
    sender: inductionPersona.publicKey,
    receiver: voucherPublicKey,
    signature: signature, 
    message: encryptedUserPayload
  };

  // DOUBLE VERIFIED SIGNATURE PATTERN
  /*let vouchRequestPayload = {
    circlAdminSigil: primeSigil, // circle signs admin
    adminSenderSigil: sigil,  // user sign sender
    sender: inductionPersona.publicKey,
    receiver: voucherPublicKey,
    signature: signature, 
    message: encryptedUserPayload
  };*/

  // QUADRUPLE VERIFIED SIGNATURE PATTERN
  /*let vouchRequestPayload = {
    circlAdminSigil: primeSigil, // circle signs admin
    adminVerifierSigil: verifierSigil, // admin signs verifier
    adminSenderSigil: coSigil, // admin signs sender
    veriferSenderSigil: sigil,  // user sign sender
    sender: inductionPersona.publicKey,
    receiver: voucherPublicKey,
    signature: signature, 
    message: encryptedUserPayload
  };*/

  return vouchRequestPayload;
};

backend.createVouchResponseEndpoint = function(personaFingerprint, voucherFingerprint){
  return `verified/${personaFingerprint}/${voucherFingerprint}`;
};

backend.requestVouch = async function(circleFingerprint, identityFingerprint, voucherFingerprint){
  // log("requestVouch function intro", circleFingerprint, identityFingerprint, voucherFingerprint);
  if(voucherFingerprint.length < 42 || voucherFingerprint.length > 46){
    // log("requestVouch length is not 44", voucherFingerprint.length);
    return false;
  }
  let responsePayload = await backend.keyLookup(circleFingerprint, identityFingerprint, voucherFingerprint);
  // log("keyLookup responsePayload - ", responsePayload);
  if (!("publicKey" in responsePayload)){
    // log("requestVouch publicKey isn't in response payload", responsePayload);
    return Promise.reject(new Error("Couldn't locate the Voucher's Public Key"));
  }

  let vouchRequestPayload = await backend.createVouchRequestPayload(identityFingerprint,
                              voucherFingerprint,
                              responsePayload["publicKey"]);
  if (!vouchRequestPayload){
    return false;
  }

  // log("subscribing to the return channel for this vouch");
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  let inductionPersona = await identity.getPersona('induction');
  let vouchResponseEndpoint = backend.createVouchResponseEndpoint(inductionPersona.fingerprint, voucherFingerprint);

  let fingerprintChain = `verified/${inductionPersona.fingerprint}/${voucherFingerprint}`;
  backend.allowFingerprintChain(fingerprintChain, ["vouchRequestMessage", ""] );

  // log("requestVouch, calling sendvouchrequest");
  let response = await backend.sendVouchRequest(circleFingerprint, identityFingerprint, vouchRequestPayload);
  // log("requestVouch, response", response);
  return response;
};

backend.checkSpam = async function(senderFingerprint){
  // log("checking spam");

  return external.makeRequest(
    method='GET',
    url=`${circle.config.messageHub.url}/spam/${senderFingerprint}`
  );
};

backend.checkVerified = async function(circleFingerprint, receiverFingerprint, verifierFingerprint){
  // log("checking verified");
  let circle =  cm.fingerprint2Instance('circle', circleFingerprint);
  return {
    payload:  await external.makeRequest(
                method='GET',
                url=`${circle.config.messageHub.url}/verified/${receiverFingerprint}/${verifierFingerprint}?s=5`,
                data={},
                raw=true
              ),
    requestPath: `/verified/${receiverFingerprint}/${verifierFingerprint}`
  };
};

backend.verifyPermissionChain = async function(sigilBlobs, publicKey, permissionsList = []){
  let sigilBlob = sigilBlobs[0];

  // check sigil chain
  for(let i=1;i<sigilBlobs.length;++i){
    let ps = sigilBlobs[i-1];
    let s = sigilBlobs[i];
    if(ps.vouchee !== s.voucher){
      return false;
    }
    if(ps.permissions.size() !== s.permissions.size()){
      return false;
    }
    for(let [key, value] of Object.entries(s.permissions)){
      if(ps.permisssions[key]){
        return false;
      }
      // log("value:", value, new Date(value), Date.now());
      if(new Date(value) > Date.now()){
        // log("the expiration date is in the future");
      }
    }
    sigilBlob = sigilBlobs[i];
  }

  // Check sigil Voucher connection
  if (sigilBlob.vouchee != publicKey)
    return false;

  // Check has all needed permissions
  for(let p of permissionsList){
    if (!sigilBlob.permissions[p])
      return false;
  }

  // log("verified permission chain");
  return true;
};


backend.verifyMessages = async function(encryptedMessages, receiverPublicKey, receiverPrivateKey, requiredPermissions = [], identification, validatorFunc) {
  // log("verifying messages");
  let messages = [];
  let verifyingPromises = [];
  for(let i=0;i<encryptedMessages.length;++i){
    if(!validate.message(encryptedMessages[i]))
      continue;
    verifyingPromise = salty.getFingerprint(encryptedMessages[i].sender)
      .then(fingerprint => {
        if (identification && fingerprint !== identification){
          // we're checking to make sure any messages we verify match the identification filter we set
          // log("FINGERPRINT DOESN'T MATCH", fingerprint, identification);
          return Promise.reject(new Error("fingerprint doesn't match identification"));
        }
      })
      .then(async ()=>{
        let isValid = await salty.verifyDetached(encryptedMessages[i].signature,
            encryptedMessages[i].message,
            encryptedMessages[i].sender
        );
        if (!isValid){
          return Promise.reject(new Error("the message doesn't belong to the sender"));
        }
      })
      .then(async()=>{
        let sigils = encryptedMessages[i].sigils;
        let sigilBlobs = [];
        let sigilPromises = [];
        for(let k=0;k<sigils.length;++k){
          sigilPromises.push(salty.readSigil(sigils[k]));
        }
        for(let k=0;k<sigilPromises.length;++k){
          sigilBlobs.push(await sigilPromises[k]);
        }
        // log(sigilBlobs);

        let verifierFingerprint = await salty.getFingerprint(sigilBlobs[0].voucher);
        let receiverFingerprint = await salty.getFingerprint(encryptedMessages[i].receiver);
        // log("fingerprints,", verifierFingerprint, receiverFingerprint);
        let fingerprintChain = `${sigilBlobs.length == 1 ? "verified" : "doubleverified"}/${receiverFingerprint}/${verifierFingerprint}`;

        let validChain = await backend.verifyPermissionChain(sigilBlobs,
          encryptedMessages[i].sender, requiredPermissions
        );

        if(!validChain){
          return Promise.reject(new Error("The permission chain is broken"));
        }
      })
      .then(()=>{
        // The permissions check out, let's finally decrypt the message
        return salty.decryptStringWithKey(encryptedMessages[i].message, receiverPublicKey, receiverPrivateKey);

      })
      .then((msg)=>{
        // The permissions check out, let's finally decrypt the message
        let message = JSON.parse(msg);
        // log("about to validate message", message);
        if(!validatorFunc(message))
          return Promise.reject(new Error(`The decrypted message is invalid.\n\n${msg}`));
        messages.push(message);
      })
      .catch((e)=>{
        error("VERIFY MESSAGE FAILED", e);
      });
      verifyingPromises.push(verifyingPromise);
  }
  for(let i=0;i<verifyingPromises.length;++i){
    let message = await verifyingPromises[i];
    if (message)
      messages.push(message);
  }
  return messages;
};

backend.checkDoubleVerified = async function(senderFingerprint, verifierFingerprint, subVerifierFingerprint){
  // log("checking double verified");
  return external.makeRequest(
    method='GET',
    url=`${circle.config.messageHub.url}/spam/${senderFingerprint}/${verifierFingerprint}/${subVerifierFingerprint}`
  );
};

backend.checkForVouchRequest = async function(circleFingerprint, identityFingerprint, requesterFingerprint){
  // log("checking for vouch request")
  // log("requesterFingerprint", requesterFingerprint, typeof requesterFingerprint); 
  let identity = cm.fingerprint2Instance('identity', identityFingerprint);
  let induction = identity.getPersona('induction');
  let encryptedMessages = [];
  let vouchRequests = [];
  if (!circleFingerprint)
    throw Error("Checking for a vouch request requires a circle");
  if(typeof requesterFingerprint === 'string' &&
     requesterFingerprint.length >= 44 && requesterFingerprint.length <= 47 &&
     utils.isBase58(requesterFingerprint)) {
    // log("before checkVerified");
    // we have a fingerprint, check verified messages

    let {payload, requestPath} = await backend.checkVerified(circleFingerprint, induction.fingerprint, requesterFingerprint);
    backend.allowFingerprintChain(`verified/${induction.fingerprint}/${requesterFingerprint}`);
    // log("after checkVerified", payload, requestPath);
    if (typeof payload.version === 'number'){
      // log("before requestVersions", payload.version);
      window.requestVersions[requestPath] = payload.version;
      // log("requestversions", window.requestVersions);
    }
    // log("before backend.verifyMessages");
    vouchRequests = await backend.verifyMessages(payload.messages, induction.publicKey, induction.privateKey, ["message"], requesterFingerprint, validate.vouchRequest);
    // log("got messages", vouchRequests);
  }
  let circle = cm.fingerprint2Instance('circle', circleFingerprint);
  // log("before getCircleData");
  let circleData = await identity.getCircleData(circle? circle.filePath: null);
  // log("before circleData.addVouchRequests");
  await circleData.addVouchRequests(vouchRequests);
  window.circleDatae[identityFingerprint][circleFingerprint] = circleData;
  // log("finishing checkForVouchRequest");
  return true;
};

backend.vouch = async function(){
  return false;
};

backend.checkForAccess = async function(){
  log(`CheckForAccess`);

  // we check if they've ever come to the site.  if not then this won't be set.
  // if so then we either log them on with their default_user and default_password
  // or we just send them to the login screen which has a create default user or an actual sign up mechanism
  let thereMightBeAnAccount = localStorage.getItem('thereMightBeAnAccount');

  if(!thereMightBeAnAccount){
    console.warn(`CheckForAccess, creating a default *local* account because people are lazy af. If you see this and want more security, then create a local account yourself by logging out.`);
    let default_user = await utils.getRandomBreed();
    default_user += ` ${await salty.randomNumber() % 100}`;
    let default_pass = await salty.randomString(20);
    log(`CheckForAccess default_user: ${default_user}, default_pass: ${default_pass}`);

    let created = await backend.signUp(default_user, default_pass);
    if(created){
      sessionStorage.setItem('default_user', default_user);
      sessionStorage.setItem('default_pass', default_pass);
      localStorage.setItem('default_user', default_user);
      localStorage.setItem('default_pass', default_pass);
    }
  }

  let default_user = sessionStorage.getItem('default_user');
  let default_pass = sessionStorage.getItem('default_pass');
  if(!default_user || !default_pass){
    default_user = localStorage.getItem('default_user');
    default_pass = localStorage.getItem('default_pass');
  }
  log(`CheckForAccess default_user: ${default_user}, default_pass: ${default_pass}`);

  if (default_user && default_pass){
    backend.messageFrontend({
      reason: 'default_account',
      payload: {
        extensionUsername: default_user,
        extensionPassword: default_pass,
        newUser: true
      }
    });
  }

};

backend.clearSession = function(){
  sessionStorage.clear();
  localStorage.clear();
}

backend.init = async function(){
  let version = localStorage.getItem("fellowaryVersion");
  if (version !== backend.fellowaryVersion){
    log("version is not correct");
    await backend.cleanSlate();
  }

  log("checking access");
  backend.checkForAccess();
}

window.backend = backend;
window.addEventListener('load', async (event) => {
  console.log("page is fully loaded");
  await backend.init();
});

// backend.init();
openDashboard();
}