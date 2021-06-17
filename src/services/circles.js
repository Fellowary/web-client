import { notification } from 'antd'

async function messageBackend(reason, payload){
  // console.log("circles messageBackend", reason, payload);
  if(window.browser){
    return window.browser.runtime.sendMessage({
        reason,
        payload
    });
  }
  if (window.handleBackendMessage){
    return window.handleBackendMessage({reason, payload});
  }
  return; //eslint-disable-line
}

export async function currentCircles(){
  return messageBackend('current_circles')
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `currentCircles Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function getCircleTree(){
  return messageBackend('get_circle_tree')
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `getCircleTree Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function setPrimaryCircle(circleFingerprint, identityFingerprint) {
  console.log("service setPrimaryCircle", circleFingerprint, identityFingerprint);
  return messageBackend('set_primary_circle', {circleFingerprint, identityFingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `setPrimaryCircle Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function createCircle(circleName, identityFingerprint) {
  return messageBackend('create_circle', {circleName, identityFingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `createCircle Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function deleteCircle(identityFingerprint, circleFingerprint) {
  return messageBackend('delete_circle', {identityFingerprint, circleFingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `deleteCircle Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
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

export async function getConversationLink(conversationKey){
  return messageBackend('get_conversation_link', {conversationKey})
    .catch(error => {
      console.error(error);
      window.eeee = error;
      notification.warning({
        message: error.code,
        description: `get_converation_link Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    });
}

export async function uploadKey(circleFingerprint, identityFingerprint) {
  console.log("circleServices uploadKey", circleFingerprint, identityFingerprint);
  return messageBackend('upload_key', {circleFingerprint, identityFingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `uploadKey Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function deleteKey(circleFingerprint, identityFingerprint) {
  return messageBackend('delete_key', {circleFingerprint, identityFingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `deleteKey Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function requestVouch(circleFingerprint, identityFingerprint, fingerprint) {
  return messageBackend('request_vouch', {circleFingerprint, identityFingerprint, fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `requestVouch Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function checkForVouch(circleFingerprint, identityFingerprint, fingerprint) {
  return messageBackend('check_for_vouch', {circleFingerprint, identityFingerprint, fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `checkForVouch Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function vouch(fingerprint) {
  return messageBackend('vouch', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `voucher Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function requestAccess(fingerprint) {
  return messageBackend('request_access', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `requestAccess Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}

export async function grantAccess(fingerprint) {
  return messageBackend('grant_access', {fingerprint})
    .catch(error => {
      notification.warning({
        message: error.code,
        description: `grantAccess Service - ${error.fileName}:${error.lineNumber} - ${error.message} -`,
      })
    })
}