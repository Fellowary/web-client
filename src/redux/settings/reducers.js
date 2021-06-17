import store from 'store'
import actions from './actions'

const STORED_SETTINGS = storedSettings => {
  const settings = {}
  Object.keys(storedSettings).forEach(key => {
    const item = store.get(`app.settings.${key}`)
    settings[key] = typeof item !== 'undefined' ? item : storedSettings[key]
  })
  return settings
}

const initialState = {
  ...STORED_SETTINGS({
    isSidebarOpen: false,
    isSupportChatOpen: false,
    isMobileView: false,
    isMobileMenuOpen: false,
    isMenuCollapsed: false,
    isMenuShadow: false,
    isMenuUnfixed: false,
    menuLayoutType: 'left', // left, top, nomenu
    menuType: 'default', // default, flyout, compact
    menuColor: 'gray', // dark, blue, gray, white
    flyoutMenuColor: 'dark', // dark, blue, gray, white
    systemLayoutColor: 'gray', // white, dark, blue, gray, image
    isTopbarFixed: false,
    isContentNoMaxWidth: false,
    isAppMaxWidth: false,
    isGrayBackground: false,
    isGrayTopbar: false,
    isCardShadow: false,
    isSquaredBorders: false,
    isBorderless: false,
    routerAnimation: 'slide-fadein-up', // none, slide-fadein-up, slide-fadein-right, fadein, zoom-fadein
  }),
}

export default function settingsReducer(state = initialState, action) {
  // console.log("settings reducer");
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
