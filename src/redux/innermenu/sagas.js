import { all, put } from 'redux-saga/effects'

export function* GET_DATA() {
  // const menuData = yield call(getMenuData);
  yield put({
    type: 'innermenu/SET_STATE',
    payload: {
      menuData: {},
    },
  })
}

export default function* rootSaga() {
  yield all([
    GET_DATA(), // run once on app load to fetch menu data
  ])
}
