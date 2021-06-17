import actions from './actions'

const initialState = [];

export default function circleTreeReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      window.circleTree = action.payload; // TODO: Put this in the correct lifecycle
      return [ ...action.payload ]
    case actions.SET_STATE_CLEAR:
      return initialState;
    default:
      return state
  }
}
