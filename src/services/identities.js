import { notification } from 'antd';
import { store } from 'index';

async function messageBackend(reason, payload){
  // console.log("identities messageBackend", reason, payload);
  if (window.browser){
    return window.browser.runtime.sendMessage({
        reason,
        payload
    });
  }
  if (window.handleBackendMessage){
    return window.handleBackendMessage({reason, payload});
  }
  return undefined; //eslint-disable-line
}

export function handleIncoming(backendToDashboardMessage){
  // console.log("identities messageFrontend", backendToDashboardMessage);

  switch(backendToDashboardMessage.reason){
    case 'message':
      store.dispatch({
        type: 'identities/SET_MESSAGES',
        conversations: backendToDashboardMessage.payload // messages object
      });
      break;
    case 'notification':
      store.dispatch({
        type: 'identities/SET_NOTIFICATIONS',
        notifications: backendToDashboardMessage.payload // messages object
      });
      break;
    case 'identity':
      store.dispatch({
        type: 'identities/SET_STATE',
        identities: backendToDashboardMessage.payload
      });
      break;
    case 'persona':
      store.dispatch({
        type: 'identities/SET_PERSONAE',
        personae: backendToDashboardMessage.payload
      });
      break;
    case 'circle':
      store.dispatch({
        type: 'circles/SET_STATE',
        circles: backendToDashboardMessage.payload
      });
      break;
    case 'conversation':
      console.error("conversation frontend handling is not implemented yet");
      store.dispatch({
        type: 'identities/SET_CONVERSATION',
        conversations: backendToDashboardMessage.payload
      });
      break;
    case 'invite':
      store.dispatch({
        type: 'user/REMOVE_INVITE',
        payload: backendToDashboardMessage
      })
      break;
    case 'connection':
      store.dispatch({
        type: 'user/SET_STATE',
        payload: {connection: backendToDashboardMessage.status}
      });
      break;
    case 'serverState':
      store.dispatch({
        type: 'user/SET_STATE',
        payload: {serverState: backendToDashboardMessage.serverState}
      });
      break;
    case 'default_account':
      store.dispatch({
        type: 'user/SIGN_IN',
        payload: backendToDashboardMessage.payload
      });
      break;
    default:
      throw new Error("handleFrontendMessage does not accept a default case");
  }
}

export function initIncomingMessaging(){
  if(window.browser){
    window.browser.runtime.onMessage.addListener(handleIncoming);  
  }
  else{
    window.handleFrontendMessage = handleIncoming;
  }
}

// initIncomingMessaging();

export async function currentIdentities(){
  return messageBackend('current_identities')
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `currentIdentities Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function setPrimaryIdentity(fingerprint) {
  return messageBackend('set_primary_identity', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `setPrimaryIdentity Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function createIdentity(name) {
  return messageBackend('create_identity', name)
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `createIdentity Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function deleteIdentity(fingerprint) {
  return messageBackend('delete_identity', {fingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `deleteIdentity Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function createConversation(identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType){
  return messageBackend('create_conversation', {identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType})
    .catch(error => {
      console.error(error);
      window.eeee = error;
      notification.warning({
        message: error.code,
        description: `create_conversation Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    });
}

export async function deleteConversation(conversationKey){
  return messageBackend('delete_conversation', {conversationKey})
    .catch(error => {
      console.error(error);
      window.eeee = error;
      notification.warning({
        message: error.code,
        description: `delete_conversation Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    });
}

export async function changeActiveConversation(activeConversationKey, inactiveConversationKey){
  return messageBackend('change_active_conversation', {activeConversationKey, inactiveConversationKey})
    .catch(error => {
      console.error(error);
      window.eeee = error;
      notification.warning({
        message: error.code,
        description: `change_active_conversation Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    });
}

export async function sendMessage(conversationKey, message){
  return messageBackend('send_message', {conversationKey, message})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `send_message Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    });
}

export async function getMessages(conversationKey, tense){
  return messageBackend('get_conversation_messages', {conversationKey, tense})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `get_messages Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}


export async function getPersonae(personaFingerprintList, circleFingerprint){
  return messageBackend('get_personae', {personaFingerprintList, circleFingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `get_messages Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function getCircleDataAll(fingerprint){
  return messageBackend('get_circle_data_all', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `get_circle_data_all Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export function addInvite(identityFingerprint, inviteUrl){
  return messageBackend('add_invite', {identityFingerprint, inviteUrl})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `add_invite error: ${error.message}`,
      })
    });
}

export async function vouchRequesters(fingerprint){
  return messageBackend('get_vouch_requesters', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `get_vouch_requesters Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function vouchResponders(fingerprint){
  return messageBackend('get_vouch_responders', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `get_vouch_responders Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function votes(fingerprint){
  return messageBackend('get_votes', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `get_votes Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function settings(fingerprint){
  return messageBackend('get_identity_settings', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `get_identity_settings Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}