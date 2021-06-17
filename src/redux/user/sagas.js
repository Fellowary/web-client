import { all, takeEvery, put, call, select } from 'redux-saga/effects';
import { notification } from 'antd';
import { history } from 'index';
import { register, signIn, currentAccount, logout, getInvite, acceptInvite, rejectInvite, setCurrentPage} from 'services/user';
import { currentIdentities } from 'services/identities';
import { currentCircles } from 'services/circles';

import actions from './actions';
import {getCurrentGoodPage, getInvites} from './selectors';


export function* SIGN_IN({ payload }) {
  console.log("in SIGN_IN");
  const { extensionUsername, extensionPassword, invites, newUser } = payload
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
      intro: newUser
    },
  });
  console.log("payload", payload);
  const success = yield call(signIn, extensionUsername, extensionPassword)

  if (success) {
    // console.log("before load_all");
    yield put({
      type: 'user/LOAD_ALL',
      payload:{}
    });

    if (invites && invites.length){
      yield put({
        type: 'user/SET_STATE',
        payload: {
          loading: false,
        },
      });
    }
    else{
      const currentGoodPage = yield select(getCurrentGoodPage);
      yield history.replace(currentGoodPage || '/');
    }

    // console.log('after history push');
    notification.success({
      message: 'Logged In',
      description: 'You have successfully logged in!',
    });
  }
  else{
    yield put({
        type: 'user/SET_STATE',
        payload: {
          loading: false,
        },
      })
  }
}

export function* REGISTER({ payload }) {
  // console.log("REGISTER PAYLOAD", payload);
  const { extensionUsername, extensionPassword } = payload;

  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })

  const success = yield call(register, extensionUsername, extensionPassword)

  if (success){
    yield history.push('/system/login')
    notification.success({
      message: 'Created a user',
      description: 'You have successfully created a local user.  Go ahead and sign in.'
    })
    yield put({
      type: 'user/SET_STATE',
      payload: {
        loading: false,
      },
    })
  }
  else{
    yield put({
      type: 'user/SET_STATE',
      payload: {
        loading: false,
      },
    })

    notification.error({
      message: 'Failed to create a user',
      description: 'Maybe that user exists on this system?  Try a different name.'
    })
  }
}

export function* ADD_INVITE({payload}){
  // const user = yield select(getUser);
  // console.log("ADD_INVITE user", user);

  let invites = yield select(getInvites);
  if (!invites) {
    invites = [];
  }
  
  if(!invites.includes(payload.inviteUrl)){
    invites.push(payload.inviteUrl);
  }

  yield put({
    type: 'user/SET_STATE',
    payload: {
      invites
    }
  });
}

export function* GET_INVITE({ payload }){
  // console.log("REMOVE_INVITE payload", payload);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  });
  if (!payload || !payload.inviteUrl){
    console.log("the invite url doens't exist, going back to a good page");
    const currentGoodPage = yield select(getCurrentGoodPage);
    yield history.replace(currentGoodPage || '/');
  }
  console.log("GET_INVITE inviteUrl", payload.inviteUrl);
  const response = yield call(getInvite, payload.inviteUrl);
  const invites = yield select(getInvites);
  const inviteIndex = invites.indexOf(payload.inviteUrl);
  if(inviteIndex > -1){
    // console.log("splicing index", payload.inviteUrl, inviteIndex, invites[0], invites[1])
    invites.splice(inviteIndex, 1);
  }

  if(response.status === "success"){
    notification.success({
      message: "Got Link Info"
    });
    
    yield put({
      type: 'user/SET_STATE',
      payload: {
        currentInvitation: response.currentInvitation,
        invites,
        loading: false
      }
    });
  }
  else{
    notification.error({
      message: "Couldn't get the link info",
      description: `The link: ${payload.inviteUrl} couldn't be retrieved.  Something may be wrong with it.`
    });
    yield put({
      type: 'user/SET_STATE',
      payload:{
        invites,
        loading: false
      }
    });
  }
}

export function* ACCEPT_INVITE({ payload }){
  // console.log("ACCEPT_INVITE payload", payload);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  });

  const response = yield call(acceptInvite, payload.inviteUrl, payload.identityFingerprint);
  
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: false,
      currentInvitation: undefined
    }
  });

  if (response.status === "success"){
    notification.success({
      message: "Joined",
      description: `You have successfully joined the ${payload.inviteUrl} conversation`
    });
    console.log("acceptinvite path", response.redirectionPath);
    yield put({
      type: 'user/LOAD_ALL',
      payload:{
        identityFingerprint: payload.identityFingerprint,
        redirectionPath: response.redirectionPath
      }
    });
    // yield history.push(response.redirectionPath); // the page will set a new currentGoodPath, in case you're wondering
  }
  else {
    notification.error({
      message: "Couldn't Join",
      description: `The ${payload.inviteUrl} conversation couldn't be joined with identity ${payload.identityFingerprint}.  Something might be wrong with your identity`
    });
    // const currentGoodPage = yield select(getCurrentGoodPage);
    yield history.replace('/social');
  }

}

export function* REJECT_INVITE({ payload }){
  // console.log("REJECT_INVITE payload", payload);
  const response = yield call(rejectInvite, payload.inviteUrl);
  yield put({
    type: 'user/SET_STATE',
    payload:{
      loading: false,
      currentInvitation: undefined
    }
  });

  if (response.status === "success"){
    notification.success({
      message: "Rejected the Invite",
      description: `You have successfully rejected the ${payload.inviteUrl} invite`
    });
  }
  else {
    notification.error({
      message: "Couldn't Reject Maybe?",
      description: `The ${payload.inviteUrl} conversation couldn't be rejected but nothing else was done.  wtf.`
    });
  }

  const currentGoodPage = yield select(getCurrentGoodPage);
  yield history.replace(currentGoodPage || '/');
}

export function* LOAD_ALL({payload: {identityFingerprint, redirectionPath, navigationPath}}){ //eslint-disable-line
  // My naive attempt at avoiding multiple renders
  // console.log("LOAD_ALL currentAccount");
  const userResponse = yield call(currentAccount);
  if (!userResponse){
    notification.error({
      message: 'Failed to load user data',
      description: "Couldn't get the current account"
    })
    return;
  }
  // console.log("LOAD_ALL currentIdentities");
  const identities = yield call(currentIdentities);
  if (!identities){
    notification.error({
      message: 'Failed to load identties data',
      description: "Couldn't get the current identities"
    })
    return;
  }
  // console.log("LOAD_ALL currentCircles");
  const circles = yield call(currentCircles);
  if (!circles){
    notification.error({
      message: 'Failed to load circles data',
      description: "Couldn't get the current circles"
    })
    return;
  }
  // console.log("LOAD_ALL identity", identityFingerprint);
  const circleDatae = {};


  // console.log("LOAD_ALL successful, setting all state");
  const { username, publicKey, privateKey, fingerprint, avatar, primaryIdentity, primaryCircle, currentPage } = userResponse;
  if (redirectionPath){
    yield history.replace(redirectionPath);
  }
  else if (navigationPath){
    yield history.push(navigationPath);
  }
  yield put({
    type: 'all/SET_STATE',
    payload: {
      user: {
        username,
        fingerprint,
        publicKey,
        privateKey,
        avatar,
        primaryIdentity,
        primaryCircle,
        currentPage,
        authorized: true,
        navigating: navigationPath || redirectionPath,
        loading: false
      },
      identities,
      circles,
      circleDatae
    }
  });

}


export function* SET_CURRENT_PAGE({payload}){
  // this keeps our current conversation when we log out or accidently refresh
  console.log("saga user set current page", payload, payload.currentPage);
  const response = yield call(setCurrentPage, payload.currentPage);

  if (response === true){
    yield put({
      type: 'user/SET_STATE',
      payload
    });
  }
}

export function* LOAD_CURRENT_ACCOUNT() {
  // console.log("loading current account");
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(currentAccount)
  // console.log("LOAD_CURRENT_ACCOUNT response", response);
  if (response) {
    // console.log("the response is true for load_current_account");
    const { username, publicKey, privateKey, fingerprint, avatar, primaryIdentity, primaryCircle } = response;
    yield put({
      type: 'user/SET_STATE',
      payload: {
        username,
        fingerprint,
        publicKey,
        privateKey,
        avatar,
        primaryIdentity,
        primaryCircle,
        authorized: true,
      },
    })
  }
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: false,
    },
  })

  yield put({
    type: 'identities/LOAD_CURRENT_IDENTITIES'
  });

  yield put({
    type: 'circles/LOAD_CURRENT_CIRCLES'
  });
}

export function* LOGOUT() {
  yield call(logout)
  yield put({
    type: 'all/SET_STATE_CLEAR',
    payload: {}
  })
  yield put({
    type: 'user/SET_STATE',
    payload: {
      id: '',
      name: '',
      role: '',
      email: '',
      avatar: '',
      authorized: false,
      loading: false,
    },
  })
}


export default function* rootSaga() {
  yield all([
    takeEvery(actions.SIGN_IN, SIGN_IN),
    takeEvery(actions.LOAD_ALL, LOAD_ALL),
    takeEvery(actions.LOAD_CURRENT_ACCOUNT, LOAD_CURRENT_ACCOUNT),
    takeEvery(actions.LOGOUT, LOGOUT),
    takeEvery(actions.REGISTER, REGISTER),
    takeEvery(actions.ADD_INVITE, ADD_INVITE),
    takeEvery(actions.GET_INVITE, GET_INVITE),
    takeEvery(actions.ACCEPT_INVITE, ACCEPT_INVITE),
    takeEvery(actions.REJECT_INVITE, REJECT_INVITE),
    takeEvery(actions.SET_CURRENT_PAGE, SET_CURRENT_PAGE),
    LOAD_CURRENT_ACCOUNT(), // run once on app load to check user auth
  ])
}
