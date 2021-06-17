import { all, takeEvery, put, call } from 'redux-saga/effects';
import { notification } from 'antd';
import {
  currentCircles,
  setPrimaryCircle,
  createCircle,
  deleteCircle,
  createConversation,
  getConversationLink,
  uploadKey,
  deleteKey,
  requestVouch,
  checkForVouch,
  vouch,
  requestAccess,
  grantAccess,
} from 'services/circles';

import { currentIdentities, getPersonae } from 'services/identities';

import actions from './actions'

export function* LOAD_CURRENT_CIRCLES() {
  // console.log("loading current circles");
  /* yield put({
    type: 'circles/SET_STATE',
    payload: {
    },
  }) */
  const response = yield call(currentCircles)
  // console.log("LOAD_CURRENT_CIRCLES response", response);
  if (response) {
    // console.log("the response is true for LOAD_CURRENT_CIRCLES - RESPONSE", response);
    // console.log("")
    yield put({
      type: 'circles/SET_STATE',
      payload: response,
    })
    /* yield put({
      type: 'circleTree/LOAD_CIRCLE_TREE'
    }); */
  }
}

export function* SET_PRIMARY_CIRCLE({payload: {circleFingerprint, identityFingerprint}}) {
  // console.log("setting primary circle", circleFingerprint, identityFingerprint);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(setPrimaryCircle, circleFingerprint, identityFingerprint);
  // console.log("SET_PRIMARY_CIRCLE response", response);
  if (response) {
    // console.log("the response is true for set_primary_circle");
    yield put({
      type: 'user/LOAD_CURRENT_ACCOUNT',
    })

    notification.success({
      message: 'Circle set as primary',
      description: `Set ${circleFingerprint} as the primary circle of ${identityFingerprint}`,
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
      message: 'Could not set circle as primary',
      description: `Unable to set ${circleFingerprint} to the primary circle of ${identityFingerprint}`,
    })
  }
}

export function* CREATE_CONVERSATION({payload: {identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType}}){
  // console.log("saga CREATE_CONVERSATION", identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType);
  // Create the conversation
  const response = yield call(createConversation, identityFingerprint, circleFingerprint, otherPartyFingerprint, conversationType);
  // console.log("CREATE_CONVERSATION RESPONSE", response);

  if (!response){
    return;
  }

  // 
  const {key} = response;
  const [idf, convoType, cf, otherPersonaFingerprint] = key.split('/'); //eslint-disable-line


  const personaeResponse = yield call(getPersonae, [otherPersonaFingerprint]);

  // console.log("CREATE_CONVERSATION personaResponse", personaeResponse);
  // // console.log("CREATE_CONVERSATION messagesResponse", messagesResponse);

  // push the persona to the frontend
  yield put({
    type: 'identities/SET_PERSONAE',
    personae: personaeResponse
  });

  const identitiesResponse = yield call(currentIdentities);
  // console.log("CREATE_CONVERSATION identitiesResponse", identitiesResponse);

  // load the conversation summaries which are in identities
  const circlesResponse = yield call(currentCircles);
  // console.log("CREATE_CONVERSATION circlesResponse", circlesResponse);

  yield put({
    type: 'identities/SET_STATE',
    identities: identitiesResponse
  })

  yield put({
    type: 'circles/SET_STATE',
    payload: circlesResponse
  });
}

export function* GET_CONVERSATION_LINK({payload: {conversationKey}}){
  // console.log("saga GET_CONVERSATION_LINK", conversationKey);
  // Create the conversation
  const response = yield call(getConversationLink, conversationKey);
  // console.log("CREATE_CONVERSATION RESPONSE", response);

  if (!response){
    return;
  }
  let duration = 0;
  try{
    if(!window.isSafari){
      navigator.clipboard.writeText(response);
      duration = 5;
    }
  }
  catch(err){
    console.error("couldn't write to the clipboard.  probably safari security");
  }

  notification.success({
    message: "Here's your link!",
    description: response,
    duration,
    style: {
      right: '80px',
      marginRight: '-100px'
    }
  });
}


export function* CREATE_CIRCLE({payload: {circleName, identityFingerprint}}) {
  // console.log(`creating circle ${circleName ? `with the circleName ${circleName}`:''} circles`);
  /* yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  }) */
  const response = yield call(createCircle, circleName, identityFingerprint);
  // console.log("LOAD_CURRENT_ACCOUNT response", response);
  if (response) {
    // console.log("the response is true for create_circle");
    /* yield put({
      type: 'user/LOAD_CURRENT_ACCOUNT'
    }); */

    yield put({
      type: 'user/LOAD_ALL',
      payload:{
        identityFingerprint
      }
    });

    notification.success({
      message: 'Success!',
      description: `Created a new circle ${response.name}`,
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
      message: 'Could not create an circle',
      description: `Unable to create a new circle`,
    })
  }
}

export function* DELETE_CIRCLE({payload: {identityFingerprint, oldCircleFingerprint, oldCircleName, redirect}}) {
  console.log("deleting circle");
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(deleteCircle, identityFingerprint, oldCircleFingerprint);
  console.log("DELETE_CIRCLE response", response);

  if (response) {
    // console.log("the response is true for delete_circle");
    const {
      circleName,
      circleFingerprint,
      otherPartyFingerprint,
    } = response;

    if(redirect && circleFingerprint){
      yield put({
        type: 'user/LOAD_ALL',
        payload: {
          navigationPath: `/social/identity/${identityFingerprint}/circle/${circleFingerprint}/convo/${otherPartyFingerprint}`
        }
      });
      notification.success({
        message: `deleted circle ${oldCircleName}, ${oldCircleFingerprint}`,
        description: `${oldCircleName} no longer exists.  A different primary circle ${circleName} was created.`,
      });
    }
    else{
      yield put({
        type: 'user/LOAD_ALL',
        payload: {}
      });
      notification.success({
        message: `deleted circle ${oldCircleName}`,
        description: `${oldCircleFingerprint} no longer exists.`,
      });
    }
  }
  else{
    yield put({
      type: 'user/SET_STATE',
      payload: {
        loading: false,
      },
    });
    notification.error({
      message: 'Could not deleted an circle',
      description: `Unable to delete circle ${oldCircleName}, ${oldCircleFingerprint}`,
    })
  }
}

export function* GET_KEY({payload: {circleFingerprint, identityFingerprint, fingerprint}}) {
  // console.log(`Requesting vouch ${fingerprint} circles`);

  const response = yield call(uploadKey, circleFingerprint, identityFingerprint, fingerprint);
  // console.log("GET_KEY response", response);
  if (response) {
    // console.log("the response is true for create_circle");
    notification.success({
      message: 'Success!',
      description: `Retrieved a key: ${response}`,
    })
  }
}

export function* UPLOAD_KEY({payload: {circleFingerprint, identityFingerprint}}) {
  // console.log(`Uploading key for fingerprints: ${circleFingerprint}, ${identityFingerprint}`);

  const response = yield call(uploadKey, circleFingerprint, identityFingerprint);
  // console.log("UPLOAD_KEY response", response);
  if (response) {
    // console.log("the response is true for upload_key");
    notification.success({
      message: 'Success!',
      description: `Uploaded a key`,
    })
  }
}

export function* DELETE_KEY({payload: {circleFingerprint, identityFingerprint}}) {
  // console.log(`Deleting key for fingerprint: ${identityFingerprint}`);

  const response = yield call(deleteKey, circleFingerprint, identityFingerprint);
  // console.log("DELETE_KEY response", response);
  if (response) {
    // console.log("the response is true for create_circle");
    notification.success({
      message: 'Success!',
      description: `Deleted a key`,
    })
  }
}


export function* REQUEST_VOUCH({payload: {circleFingerprint, identityFingerprint, fingerprint}}) {
  // console.log(`Requesting vouch ${fingerprint} circles`);

  const response = yield call(requestVouch, circleFingerprint, identityFingerprint, fingerprint);
  // console.log("REQUEST_VOUCH response", response);
  if (response) {
    // console.log("the response is true for create_circle");
    notification.success({
      message: 'Success!',
      description: `Requesting a vouch: ${response}`,
    })
  }
}

export function* CHECK_FOR_VOUCH({payload: {circleFingerprint, identityFingerprint, fingerprint}}) {
  // console.log(`Checking for vouch ${fingerprint} circles`);

  const response = yield call(checkForVouch, circleFingerprint, identityFingerprint, fingerprint);
  // console.log("CHECK_FOR_VOUCH response", response);
  if (response) {
    // console.log("the response is true for create_circle");
    notification.success({
      message: 'Success!',
      description: `Checked for a vouch: ${response}`,
    })
    yield put({
      type: 'identities/LOAD_VOUCH_REQUESTERS',
      payload: {
        identityFingerprint
      },
    });
  }
}

export function* VOUCH({payload: {name}}) {
  // console.log(`vouching for ${name}`);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(vouch, name);
  // console.log("VOUCH response", response);
  if (response) {
    // console.log("the response is true for vouch");
    /* yield put({
      type: 'circles/LOAD_CURRENT_CIRCLES'
    }) */
    yield put({
      type: 'user/LOAD_ALL',
      payload: {}
    })
    notification.success({
      message: 'Success!',
      description: `Created a new circle ${response}`,
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
      message: 'Could not create an circle',
      description: `Unable to create a new circle`,
    })
  }
}

export function* REQUEST_ACCESS({payload: {name}}) {
  // console.log(`requesting access ${name ? `with the name ${name}`:''} circles`);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(requestAccess, name);
  // console.log("REQUEST_ACCESS response", response);
  if (response) {
    // console.log("the response is true for create_circle");

    yield put({
      type: 'user/LOAD_ALL',
      payload: {}
    })
    notification.success({
      message: 'Success!',
      description: `Created a new circle ${response}`,
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
      message: 'Could not create an circle',
      description: `Unable to create a new circle`,
    })
  }
}

export function* GRANT_ACCESS({payload: {name}}) {
  // console.log(`GRANT_access ${name}`);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(grantAccess, name);
  // console.log("GRANT_ACCESS response", response);
  if (response) {
    // console.log("the response is true for create_circle");

    yield put({
      type: 'user/LOAD_ALL',
      payload: {}
    })
    notification.success({
      message: 'Success!',
      description: `Created a new circle ${response}`,
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
      message: 'Could not create an circle',
      description: `Unable to create a new circle`,
    })
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery(actions.LOAD_CURRENT_CIRCLES, LOAD_CURRENT_CIRCLES),
    takeEvery(actions.SET_PRIMARY_CIRCLE, SET_PRIMARY_CIRCLE),
    takeEvery(actions.CREATE_CONVERSATION, CREATE_CONVERSATION),
    takeEvery(actions.GET_CONVERSATION_LINK, GET_CONVERSATION_LINK),
    takeEvery(actions.CREATE_CIRCLE, CREATE_CIRCLE),
    takeEvery(actions.DELETE_CIRCLE, DELETE_CIRCLE),
    takeEvery(actions.UPLOAD_KEY, UPLOAD_KEY),
    takeEvery(actions.DELETE_KEY, DELETE_KEY),
    takeEvery(actions.REQUEST_VOUCH, REQUEST_VOUCH),
    takeEvery(actions.CHECK_FOR_VOUCH, CHECK_FOR_VOUCH),
    takeEvery(actions.VOUCH, VOUCH),
    takeEvery(actions.REQUEST_ACCESS, REQUEST_ACCESS),
    takeEvery(actions.GRANT_ACCESS, GRANT_ACCESS),
  ])
}
