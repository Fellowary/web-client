import actions from './actions'

const initialState = {
}


export function identities(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      // console.log("setting identities state", action);
      return { ...action.identities }
    case actions.SET_STATE_ALL:
      // console.log("in identities all");
      return { ...action.payload.identities }
    case actions.SET_STATE_CLEAR:
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export function circleDatae(state = initialState, action) {
  switch (action.type) {
    case actions.SET_CIRCLE_DATA_STATE:
      return { ...action.payload }
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}


export function messages(state = initialState, action) {
  // console.log("messages reducer", action);
  const newState = {};
  Object.assign(newState, state); // what the fuck is this copy immutability bullshit.
  const {conversations} = action;
  switch (action.type) {
    case actions.SET_MESSAGES:
      console.log("messages newState:", newState);
      for(let conversationKey in conversations){ // eslint-disable-line
        newState[conversationKey] = conversations[conversationKey]
      }

      return newState;
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}

export function personae(state = initialState, action){
  let newState = {}
  switch (action.type) {
    case actions.SET_PERSONAE:
      // console.log("personae reducer", state, action);

      newState = Object.assign(newState, action.personae, state);

      for(let persona in newState){ //eslint-disable-line
        if (action.personae[persona] === 'deleted'){
          delete newState[persona];
        }
      }
      // console.log('personae reducer newState', newState);
      return newState;
    case actions.SET_STATE_CLEAR:
      return initialState;
    default:
      return state;
  }
}

export function vouchRequesters(state = initialState, action) {
  // console.log("vouchRequesters reducer");
  switch (action.type) {
    case actions.SET_VOUCH_REQUESTERS:
      return { ...action.payload }
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}

export function vouchResponders(state = initialState, action) {
  // console.log("vouchResponders reducer");
  switch (action.type) {
    case actions.SET_VOUCH_RESPONDERS:
      return { ...action.payload }
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}

export function votes(state = initialState, action) {
  // console.log("votes reducer");
  switch (action.type) {
    case actions.SET_VOTES:
      return { ...action.payload }
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}

export function identitySettings(state = initialState, action) {
  // console.log("identities settings reducer");
  switch (action.type) {
    case actions.SET_SETTINGS:
      return { ...action.payload }
    case actions.SET_STATE_CLEAR:
      return initialState
    default:
      return state
  }
}