import actions from './actions';

const initialState = {
  username: '',
  fingerprint: '',
  publicKey: '',
  avatar: '',
  primaryIdentity: '',
  primaryCircle: '',
  authorized: false,
  loading: false,
};

export default function userReducer(state = initialState, action) {
  
  let newState; // eslint-disable-line
  
  switch (action.type) {
    case actions.SET_STATE:
      return { ...state, ...action.payload };
    case actions.REMOVE_STATE:
      for(const key in action.payload){ //eslint-disable-line
        if (key in state){
          if (!newState){
            newState = Object.assign(state);
          }
          // remove array stuff.  this is inneficient so change the algo if we handle too many
          if(Array.isArray(newState[key])){
            for(const value of action.payload[key]){ //eslint-disable-line
              newState[key].pop(newState[key].indexOf(value));
            }           
          }
          // remove the object stuff
          else if (typeof newState[key] === 'object'){
            for (const innerKey in action.payload[key]){ //eslint-disable-line
              delete newState[key][innerKey];
            }
          }
          // remove non-container stuff
          else{
            delete newState[key];
          }
        }
      }
      if (newState){return newState;}
      return state;
    case actions.SET_STATE_ALL:
      // console.log("in user all");
      return { ...state, ...action.payload.user };
    default:
      return state;
  }
}
