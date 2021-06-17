import actions from './actions'

const initialState = {
  menuData: [],
}

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      return { ...state, ...action.payload }
    case actions.SET_STATE_CLEAR:
      state = initialState;
      return initialState;
    default:
      return state
  }
}
