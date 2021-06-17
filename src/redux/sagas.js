import { all } from 'redux-saga/effects'
import user from './user/sagas'
import circles from './circles/sagas'
import circleTree from './circleTree/sagas'
import identities from './identities/sagas'
import menu from './menu/sagas'
import settings from './settings/sagas'

export default function* rootSaga() {
  yield all([circles(), identities(), user(), circleTree(), menu(), settings()])
}
