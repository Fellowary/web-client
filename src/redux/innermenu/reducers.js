import actions from './actions'

const initialState = {
  identityFingerprint: '',
  circleFingerprint: '',
  conversationFingerprint: ''
};

export default function innerMenuReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      return { ...action.payload }
    case actions.SET_STATE_ALL:
      // console.log("in identities all");
      return { ...action.payload.innerMenu }
    case actions.SET_STATE_CLEAR:
      return { ...state, ...action.payload }
    default:
      return state
  }
};