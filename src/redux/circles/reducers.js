import actions from './actions'

const initialState = {
}

export default function circlesReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      // console.log("in circlesReducer", action);
      // window.circles = action.payload;
      // console.log("in reducer, state", state);
      return { ...action.payload }
    case actions.SET_STATE_ALL:
      // console.log("in circles all");
      return { ...action.payload.circles }
    case actions.SET_STATE_CLEAR:
      return initialState;
    default:
      return state
  }
}
