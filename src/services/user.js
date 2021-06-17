import { notification } from 'antd'

async function messageBackend(reason, payload){
  // console.log("user messageBackend", reason, payload);
  if (window.browser){
    return window.browser.runtime.sendMessage({
        reason,
        payload
    });
  }
  if (window.handleBackendMessage){
    return window.handleBackendMessage({reason, payload});
  }
  return undefined; // eslint-disable-line
}

export function register(username, password){
  return messageBackend('sign_up', {username, password})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `register error: ${error.message}`,
      })
    })
}

export async function signIn(username, password) {
  // console.log(username, password);
  return messageBackend('sign_in', {username, password})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `Sign in error: ${error.message}`,
      })
    })
}

export async function currentAccount() {
  return messageBackend('current_account')
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description:  `currentAccount error: ${error.message}`
      })
    });
}

export async function logout() {
  return messageBackend('sign_out')
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description:  `logout error: ${error.message}`,
      })
    });
}

export async function getInvite(inviteUrl) {
  // console.log("user service getInvite inviteUrl", inviteUrl);
  return messageBackend('get_invite', {inviteUrl})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `getInvite error: ${error.message}`,
      })
    })
}

export async function acceptInvite(inviteUrl, identityFingerprint) {
  // console.log("user service acceptInvite");
  return messageBackend('accept_invite', {inviteUrl, identityFingerprint})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `acceptInvite error: ${error.message}`,
      })
    })
}

export async function rejectInvite(inviteUrl) {
  // console.log("user service rejectInvite", inviteUrl);
  return messageBackend('reject_invite', {inviteUrl})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `Invite Rejection error: ${error.message}`,
      })
    })
}

export async function setCurrentPage(url) {
  // console.log("user service setCurrentPage", url);
  return messageBackend('set_current_page', {url})
    .catch(error => {
      console.error(error);
      notification.warning({
        message: error.code,
        description: `Invite Rejection error: ${error.message}`,
      })
    })
}