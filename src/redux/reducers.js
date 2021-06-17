import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import user from './user/reducers'
import { identities, circleDatae, messages, personae, vouchRequesters, vouchResponders, votes, identitySettings} from './identities/reducers'
import circles from './circles/reducers'
import circleTree from './circleTree/reducers'
import menu from './menu/reducers'
import innerMenu from './innermenu/reducers'
import settings from './settings/reducers'

export default history =>
  combineReducers({
    router: connectRouter(history),
    user,
    identities,
    personae,
    circleDatae,
    vouchRequesters,
    vouchResponders,
    votes,
    messages,
    identitySettings,
    circles,
    circleTree,
    menu,
    innerMenu,
    settings,
  })
