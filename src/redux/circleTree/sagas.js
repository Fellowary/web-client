import { all, takeEvery, put, call } from 'redux-saga/effects'
import { getCircleTree } from 'services/circles'
import actions from './actions'

export function* LOAD_CIRCLE_TREE(){
  // console.log("saga LOAD_CIRCLE_TREE")
  const response = yield call(getCircleTree);
  if(response){
    // console.log("the response is true for LOAD_CIRCLE_TREE", response);
    yield put({
      type: 'circleTree/SET_STATE',
      payload: response
    });
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery(actions.LOAD_CIRCLE_TREE, LOAD_CIRCLE_TREE),
  ])
}
