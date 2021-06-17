import React from 'react'
// import Search from './Search'
// import Status from './Status'
// import LanguageSwitcher from './LanguageSwitcher'
// import Actions from './Actions'
// import UserMenu from './UserMenu'
// import CircleMenu from './CircleMenu'
// import IdentityMenu from './IdentityMenu'
import style from './style.module.scss'

class TopBar extends React.Component {
  render() {
    return (
      <div className={style.topbar}>
        {/* <div className={`${style.flexSearchContainer} mr-md-4 mr-auto`}>
          <Search />
        </div> */}
        {/* <div className="mr-4 d-none d-sm-block">
          <LanguageSwitcher />
        </div> */}
        {/* <CircleMenu />
        <IdentityMenu />
        <UserMenu /> */}
      </div>
    )
  }
}

export default TopBar
