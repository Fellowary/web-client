(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){
const {backend} = window;
const {circleManager} = window;
const {log} = console;

function handleMessage(message, sender) {
  // console.log(sender);
  // console.log("handling message routing", message, sender);
  // console.log("sendResponse should be removed", sendResponse);
  if(sender){
    // log("handleMessage sender exists");
  }
  if (sender){
    //console.log("extensionURLBase:", backend.extensionURLBase, sender.origin);
  }

  if (sender && backend.extensionURLBase !== sender.origin ){
    // log("backend_handling sender but not origin");
    // this is also handled in the manifest but I want to make it explicit for paranoia reasons.
    return "no u.";
  }
  // log("backend_handling before switch");
  switch (message.reason) {
    case 'sign_up':
      // log('backend: sign_up message received', sender, message);
      return backend.signUp(message.payload.username, message.payload.password);
    case 'sign_in':
      // log('backend: sign_in message received');
      return backend.signIn(message.payload.username, message.payload.password);
    case 'sign_out':
      // log('backend: sign_out message received');
      return backend.signOut();
    case 'current_account':
      // log('backend: current_account message received');
      return backend.currentAccount();
    case 'current_identities':
      // log('backend: get_identities message received');
      return backend.currentIdentities();
    case 'create_identity':
      log('backend: create_identity message received', message.payload.name);
      return backend.createIdentity(message.payload.name);
    case 'delete_identity':
      // log('backend: delete_identity message received');
      return backend.deleteIdentity(message.payload.fingerprint);
    case 'set_primary_identity':
      // log('backend: set_primary_identity message received');
      return backend.setPrimaryIdentity(message.payload.fingerprint);
    case 'current_circles':
      // log('backend: current_circles message received');
      return backend.currentCircles();
    case 'get_circle_tree':
      // log('backend: current_circles message received');
      return backend.getCircleTree();
    case 'create_circle':
      // log('backend: create_circle message received');
      return backend.createCircle(message.payload.circleName, message.payload.identityFingerprint);
    case 'delete_circle':
      // log('backend: delete_circle message received');
      return backend.deleteCircle(message.payload.identityFingerprint, message.payload.circleFingerprint);
    case 'set_primary_circle':
      // log('backend: set_primary_circle message received', message.payload.circleFingerprint, message.payload.identityFingerprint);
      return backend.setPrimaryCircle(message.payload.circleFingerprint, message.payload.identityFingerprint);
    case 'get_vouch_requesters':
      // log(`backend: ${message.reason} message received`);
      return backend.getVouchRequesters(message.payload.fingerprint);
    case 'get_vouch_responders':
      // log(`backend: ${message.reason} message received`);
      return backend.getVouchResponders(message.payload.fingerprint);
    case 'create_conversation':
      // log(`backend: ${message.reason} message received`);
      // log(`backend: create_conversation payload:`, message.payload);
      return backend.createConversation(message.payload);
    case 'delete_conversation':
      log(`backend: ${message.reason} message received`);
      return backend.deleteConversation(message.payload.conversationKey);
    case 'change_active_conversation':
      // log(`backend: ${message.reason} message received`);
      // log(`backend: change_active_conversation payload:`, message.payload);
      let tabID='null', frameID = 'null';
      if (sender){
        tabID = sender.tab.id;
        frameID = sender.frameId;
      }
      return backend.changeActiveConversation(message.payload.activeConversationKey, message.payload.inactiveConversationKey, tabID, frameID);
    case `get_conversation_link`:
      // log(`backend: ${message.reason} message received`);
      // log(`backend: get_conversation_link payload:`, message.payload);
      return backend.getConversationLink(message.payload.conversationKey);
    case `get_invite`:
      // log("backend_handling getInvite inviteUrl", message.payload.inviteUrl);
      return backend.getInvite(message.payload.inviteUrl);
    case `accept_invite`:
      // log("backend_handling inviteUrl", message.payload.inviteUrl, message.payload.identityFingerprint);
      return backend.acceptInvite(message.payload.inviteUrl, message.payload.identityFingerprint);
    case `reject_invite`:
      // log("backend_handling rejectInvite inviteUrl", message.payload.inviteUrl);
      return backend.rejectInvite(message.payload.inviteUrl);
    case `set_current_page`:
      // log("backend_handling rejectInvite inviteUrl", message.payload.url);
      return backend.setCurrentPage(message.payload.url);
    case 'send_message':
      // log(`backend: ${message.reason} message received`);
      // log(`backend: message`, message.payload);
      return backend.sendMessage(message.payload.conversationKey, message.payload.message);
    case 'get_conversation_messages':
      // log('backend: get_conversations message received', sender, message);
      return backend.getConversationMessages(message.payload.conversationKey, message.payload.tense);
    case 'get_personae':
      // log(`backend: ${message.reason} message received`);
      return backend.getPersonae(message.payload.personaFingerprintList, message.payload.circleFingerprint);
    case 'get_votes':
      // log(`backend: ${message.reason} message received`);
      return backend.getVotes(message.payload.fingerprint);
    case 'get_identity_settings':
      // log(`backend: ${message.reason} message received`);
      return backend.getIdentitySettings(message.payload.fingerprint);
    case 'upload_key':
      // log('backend: upload_key message received', message.payload.circleFingerprint, message.payload.identityFingerprint);
      return backend.keyUpload(message.payload.circleFingerprint, message.payload.identityFingerprint);
    case 'delete_key':
      // log('backend: delete_key message received', message.payload.circleFingerprint);
      return backend.keyDelete(message.payload.circleFingerprint, message.payload.identityFingerprint);
    case 'request_vouch':
      // log('backend: request_vouch message received', message.payload.circleFingerprint);
      return backend.requestVouch(message.payload.circleFingerprint, message.payload.identityFingerprint, message.payload.fingerprint);
    case 'check_for_vouch':
      // log('backend: check_for_vouch message received', message.payload.circleFingerprint);
      return backend.checkForVouchRequest(message.payload.circleFingerprint, message.payload.identityFingerprint, message.payload.fingerprint);
    case 'add_invite':
      // log("backend: add_invite, inviteUrl", message.payload.identityFingerprint, message.payload.inviteUrl);
      return backend.addInvite(message.payload.identityFingerprint, message.payload.inviteUrl);
    case 'vouch':
      // log('backend: vouch message received');
      return backend.vouch(message.payload.fingerprint);
    case 'content_script_message':
      return circleManager.handleContentScript(message, sender);
    default:
      // log("backend_handling default case");
      return undefined;
  }
  // sendResponse({ reason: 'backend_script_message', payload: 'request confirmation' });
}

// log("loaded backend_handling");
if(window.browser){
  window.browser.runtime.onMessage.addListener(handleMessage);
}
else{
  window.handleBackendMessage = handleMessage;
}
}

},{}]},{},[1]);
