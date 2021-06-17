import { all, takeEvery, put, call } from 'redux-saga/effects'
// import { history } from 'index';
// import {store} from "index.js" store has dispatch with is equivalent(?) to yield put
import { notification } from 'antd'
import { 
  currentIdentities,
  setPrimaryIdentity,
  createIdentity,
  deleteIdentity,
  getCircleDataAll,
  getPersonae,
  getMessages,
  sendMessage,
  createConversation,
  deleteConversation,
  changeActiveConversation,
  initIncomingMessaging,
  vouchRequesters,
  vouchResponders,
  votes,
  settings,
} from 'services/identities'
import actions from './actions'

export function* LOAD_CURRENT_IDENTITIES() {
  // console.log("loading current identites");
  /* yield put({
    type: 'identities/SET_STATE',
    payload: {
    },
  }) */

  const response = yield call(currentIdentities)
  // console.log("LOAD_CURRENT_IDENTITIES response", response);
  if (response) {
    // console.log("the response is true for LOAD_CURRENT_IDENTITIES", response);
    yield put({
      type: 'identities/SET_STATE',
      payload: response,
    })
  }
}

export function* LOAD_CIRCLE_DATA({payload: {identityFingerprint}}){
  // console.log("loading circle data - identityFingerprint", identityFingerprint);
  const response = yield call(getCircleDataAll, identityFingerprint);
  // console.log("LOAD_CIRCLE_DATA RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_CIRCLE_DATA_STATE',
      payload: response,
    });
  }
}

export function* LOAD_PERSONAE({payload: {personaFingerprintList, circleFingerprint}}){
  // console.log("LOAD_PERSONAE ", personaFingerprintList, circleFingerprint);
  const response = yield call(getPersonae, personaFingerprintList, circleFingerprint);
  // console.log("LOAD_PERSONAE RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_PERSONAE',
      personae: response,
    });
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
  const {key} = response;
  const [idf, convoType, cf, otherPersonaFingerprint] = key.split('/'); //eslint-disable-line

  // get the persona we need for the frontend
  // get the messages in the conversation
  // const [personaeResponse, messagesResponse] = yield all([
  //   call(getPersonae, [otherPersonaFingerprint]),
  //   call(getMessages, key, 'past')
  // ]);

  const personaeResponse = yield call(getPersonae, [otherPersonaFingerprint]);

  // console.log("CREATE_CONVERSATION personaResponse", personaeResponse);
  // // console.log("CREATE_CONVERSATION messagesResponse", messagesResponse);

  // push the persona to the frontend
  yield put({
    type: 'identities/SET_PERSONAE',
    personae: personaeResponse
  });

  // push the messages to the frontend
  // yield put({
  //   type: 'identities/SET_MESSAGES',
  //   conversations: messagesResponse
  // })

  // load the conversation summaries which are in identities
  const identitiesResponse = yield call(currentIdentities);
  // console.log("CREATE_CONVERSATION identitiesResponse", identitiesResponse);

  yield put({
    type: 'identities/SET_STATE',
    identities: identitiesResponse
  })
}

export function* CHANGE_ACTIVE_CONVERSATION({payload: {activeConversationKey, inactiveConversationKey}}){
  // console.log("changing active conversation - activeConversationKey, inactiveConversationKey", activeConversationKey, inactiveConversationKey);
  const response = yield call(changeActiveConversation, activeConversationKey, inactiveConversationKey); //eslint-disable-line
  // console.log("CHANGE_ACTIVE_CONVERSATION RESPONSE", response);
}


export function* SEND_MESSAGE({payload: {conversationKey, message}}){
  // console.log("sending message - circle, id, other, message", conversationKey, message);
  const response = yield call(sendMessage, conversationKey, message); //eslint-disable-line
  // console.log("SEND_MESSAGE RESPONSE", response);
}


export function* LOAD_MESSAGES({payload: {conversationKey, tense}}){
  // console.log("loading message data - identityFingerprint", conversationKey, currentMessageDate, tense);
  const response = yield call(getMessages, conversationKey, tense);
  console.log("LOAD_MESSAGES RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_MESSAGES',
      conversations: response,
    });
  }
}

export function* LOAD_VOUCH_REQUESTERS({payload: {identityFingerprint}}){
  // console.log("loading vouch requesters - identityFingerprint", identityFingerprint);
  const response = yield call(vouchRequesters, identityFingerprint);
  // console.log("LOAD_VOUCH_REQUESTERS RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_VOUCH_REQUESTERS',
      payload: response,
    });
  }
}

export function* LOAD_VOUCH_RESPONDERS({payload: {identityFingerprint}}){
  // console.log("loading vouch responders - identityFingerprint", identityFingerprint);
  const response = yield call(vouchResponders, identityFingerprint);
  // console.log("LOAD_VOUCH_RESPONDERS RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_VOUCH_RESPONDERS',
      payload: response,
    });
  }
}

export function* LOAD_VOTES({payload: {identityFingerprint}}){
  // console.log("loading votes - identityFingerprint", identityFingerprint);
  const response = yield call(votes, identityFingerprint);
  // console.log("LOAD_VOTES RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_VOTES',
      payload: response,
    });
  }
}

export function* LOAD_SETTINGS({payload: {identityFingerprint}}){
  // console.log("loading identity settings- identityFingerprint", identityFingerprint);
  const response = yield call(settings, identityFingerprint);
  // console.log("LOAD_SETTINGS RESPONSE", response);
  if(response){
    yield put({
      type: 'identities/SET_SETTINGS',
      payload: response,
    });
  }
}

export function* SET_PRIMARY_IDENTITY({payload: {fingerprint}}) {
  // console.log("setting primary identity", fingerprint);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(setPrimaryIdentity, fingerprint);
  // console.log("SET_PRIMARY_IDENTITY response", response);
  if (response) {
    // console.log("the response is true for set_primary_identity");
    yield put({
      type: 'user/LOAD_ALL',
      payload: {}
    })

    notification.success({
      message: 'Identity set as primary',
      description: `Set ${fingerprint} as the primary identity`,
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
      message: 'Could not set identity as primary',
      description: `Unable to set ${fingerprint} to the primary identity`,
    })
  }
}

export function* CREATE_IDENTITY({payload: {name}}) {
  // console.log(`creating identity ${name ? `with the name ${name}`:''} identities`);
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(createIdentity, name);
  // console.warn(response);
  console.log("create_identity response", response);
  if (response) {
    const {
      identityName,
      identityFingerprint,
      circleFingerprint,
      otherPartyFingerprint
    } = response;

    yield put({
      type: 'user/LOAD_ALL',
      payload: {
        navigationPath: `/social/identity/${identityFingerprint}/circle/${circleFingerprint}/convo/${otherPartyFingerprint}`
      }
    });

    notification.success({
      message: 'Success!',
      description: `Created a new identity ${identityName}`,
    })

  }
  else {
    yield put({
      type: 'user/SET_STATE',
      payload: {
        loading: false,
      },
    })
    notification.error({
      message: 'Could not create an identity',
      description: `Unable to create a new identity`,
    })
  }
}

export function* DELETE_IDENTITY({payload: {name, fingerprint, redirect}}) {
  // console.log("deleting identity");
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true,
    },
  })
  const response = yield call(deleteIdentity, fingerprint);
  console.log("DELETE_IDENTITY response", response);
  if (response) {
    // console.log("the response is true for delete_identity");
    const {
      identityName,
      identityFingerprint,
      circleFingerprint,
      otherPartyFingerprint,
    } = response;

    if(redirect && identityFingerprint){
      yield put({
        type: 'user/LOAD_ALL',
        payload: {
          navigationPath: `/social/identity/${identityFingerprint}/circle/${circleFingerprint}/convo/${otherPartyFingerprint}`
        }
      });
      notification.success({
        message: `deleted identity ${name}, ${fingerprint}`,
        description: `${fingerprint} no longer exists.  A different primary identity ${identityName} was created.`,
      });
    }
    else{
      yield put({
        type: 'user/LOAD_ALL',
        payload: {}
      });
      notification.success({
        message: `deleted identity ${name}, ${fingerprint}`,
        description: `${fingerprint} no longer exists.`,
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
      message: 'Could not deleted an identity',
      description: `Unable to delete identity ${fingerprint}`,
    })
  }
}

export function* DELETE_CONVERSATION({payload: {conversationName, conversationFingerprint, conversationKey, redirectionPath}}){
  console.log("DELETE_CONVERSATION", conversationKey);
  const response = yield call(deleteConversation, conversationKey);

  console.log("DELETE_CONVERSATION response", response);

  if(response){
    yield put({
      type: 'user/LOAD_ALL',
      payload: {
        redirectionPath
      }
    });
    notification.success({
      message: `deleted conversation ${conversationName}, ${conversationFingerprint}`,
      description: `${conversationName} no longer exists.`,
    });
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery(actions.LOAD_CURRENT_IDENTITIES, LOAD_CURRENT_IDENTITIES),
    takeEvery(actions.LOAD_PERSONAE, LOAD_PERSONAE),
    takeEvery(actions.LOAD_VOUCH_REQUESTERS, LOAD_VOUCH_REQUESTERS),
    takeEvery(actions.LOAD_VOUCH_RESPONDERS, LOAD_VOUCH_RESPONDERS),
    takeEvery(actions.LOAD_VOTES, LOAD_VOTES),
    takeEvery(actions.LOAD_SETTINGS, LOAD_SETTINGS),
    takeEvery(actions.SET_PRIMARY_IDENTITY, SET_PRIMARY_IDENTITY),
    takeEvery(actions.CREATE_IDENTITY, CREATE_IDENTITY),
    takeEvery(actions.DELETE_IDENTITY, DELETE_IDENTITY),
    takeEvery(actions.LOAD_CIRCLE_DATA, LOAD_CIRCLE_DATA),
    takeEvery(actions.CREATE_CONVERSATION, CREATE_CONVERSATION),
    takeEvery(actions.DELETE_CONVERSATION, DELETE_CONVERSATION),
    takeEvery(actions.CHANGE_ACTIVE_CONVERSATION, CHANGE_ACTIVE_CONVERSATION),
    takeEvery(actions.SEND_MESSAGE, SEND_MESSAGE),
    takeEvery(actions.LOAD_MESSAGES, LOAD_MESSAGES),
    initIncomingMessaging(), // run once to hook up the listener
  ])
}
