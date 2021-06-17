import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import style from './style.module.scss'

const mapStateToProps = ({ menu, settings }) => ({
  menuData: menu.menuData,
  settings,
  flyoutActive: !settings.isMobileView,
})

@withRouter
@connect(mapStateToProps)
class MenuTop extends React.Component {
  flyoutTimers = {}

  currentLocation = ''

  constructor(props){
    super(props);

    this.state.activeSubmenu = '';
    this.state.activeItem = '';
    this.state.renderedFlyoutItems = {};
  }

  componentDidMount() {
    this.setActiveItems(this.props)
  }

  UNSAFE_componentWillReceiveProps(newProps) {//eslint-disable-line
    const { pathname } = newProps.location
    if (this.currentLocation !== pathname) {
      this.setActiveItems(newProps)
      this.currentLocation = pathname
    }
  }

  toggleSettings = () => {
    const { dispatch, settings } = this.props
    const { isSidebarOpen } = settings
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'isSidebarOpen',
        value: !isSidebarOpen,
      },
    })
  }

  toggleMenu = () => {
    const { dispatch, settings } = this.props
    const { isMenuCollapsed } = settings
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'isMenuCollapsed',
        value: !isMenuCollapsed,
      },
    })
  }

  toggleMobileMenu = () => {
    const { dispatch, settings } = this.props
    const { isMobileMenuOpen } = settings
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'isMobileMenuOpen',
        value: !isMobileMenuOpen,
      },
    })
  }

  handleSubmenuClick = key => {
    const { activeSubmenu } = this.state
    const { flyoutActive } = this.props
    if (flyoutActive) {
      return
    }
    this.setState({
      activeSubmenu: activeSubmenu === key ? '' : key,
    })
  }

  handleFlyoutOver = (event, key, items) => {
    const { flyoutActive } = this.props
    if (flyoutActive) {
      clearInterval(this.flyoutTimers[key])
      const item = event.currentTarget
      const itemDimensions = item.getBoundingClientRect()
      const element = this.renderFlyoutMenu(items, key, itemDimensions)
      this.setState(state => ({
        renderedFlyoutItems: {
          ...state.renderedFlyoutItems,
          [key]: element,
        },
      }))
    }
  }

  handleFlyoutOut = key => {
    const { flyoutActive } = this.props
    if (flyoutActive) {
      this.flyoutTimers[key] = setTimeout(() => {
        this.setState(state => {
          delete state.renderedFlyoutItems[key]
          return {
            renderedFlyoutItems: {
              ...state.renderedFlyoutItems,
            },
          }
        })
      }, 100)
    }
  }

  handleFlyoutConteinerOver = key => {
    clearInterval(this.flyoutTimers[key])
  }

  renderFlyoutMenu = (items, key, itemDimensions) => {
    const { settings } = this.props
    const { activeItem } = this.state
    const left = `${itemDimensions.left + itemDimensions.width / 2}px`
    const top = `${itemDimensions.top + itemDimensions.height}px`

    return (
      <div
        style={{ left, top }}
        className={classNames(style.fel__menuFlyout, {
          [style.fel__menuFlyoutTop]: settings.menuLayoutType === 'top',
          [style.fel__menuFlyout__black]: settings.flyoutMenuColor === 'dark',
          [style.fel__menuFlyout__white]: settings.flyoutMenuColor === 'white',
          [style.fel__menuFlyout__gray]: settings.flyoutMenuColor === 'gray',
        })}
        key={key}
      >
        <ul
          className={style.fel__menuTop__list}
          onMouseEnter={() => this.handleFlyoutConteinerOver(key)}
          onMouseLeave={() => this.handleFlyoutOut(key)}
        >
          {items.map(item => {
            return (
              <li
                className={classNames(style.fel__menuTop__item, {
                  [style.fel__menuTop__item__active]: activeItem === item.key,
                })}
                key={item.key}
              >
                <Link to={item.url} className={style.fel__menuTop__link}>
                  {item.icon && <i className={`${item.icon} ${style.fel__menuTop__icon}`} />}
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  setActiveItems = props => {
    const { menuData = [] } = props
    if (!menuData.length) {
      return
    }
    const flattenItems = (items, key) =>
      items.reduce((flattenedItems, item) => {
        flattenedItems.push(item)
        if (Array.isArray(item[key])) {
          return flattenedItems.concat(flattenItems(item[key], key))
        }
        return flattenedItems
      }, [])
    const activeItem = _.find(flattenItems(menuData, 'children'), ['url', props.location.pathname])
    const activeSubmenu = menuData.reduce((key, parent) => {
      if (Array.isArray(parent.children)) {
        parent.children.map(child => {
          if (child.key === activeItem.key) {
            key = parent
          }
          return ''
        })
      }
      return key
    })
    this.setState({
      activeItem: activeItem.key,
      activeSubmenu: activeSubmenu.key,
    })
  }

  generateMenuItems = () => {
    const { menuData = [] } = this.props
    const { activeSubmenu, activeItem } = this.state

    const menuItem = item => {
      const { key, title, icon, url } = item
      if (item.category) {
        return null
      }
      return (
        <li
          className={classNames(style.fel__menuTop__item, {
            [style.fel__menuTop__item__active]: activeItem === key,
          })}
          key={key}
        >
          {item.url && (
            <Link to={url} className={style.fel__menuTop__link}>
              {icon && <i className={`${icon} ${style.fel__menuTop__icon}`} />}
              <span>{title}</span>
            </Link>
          )}
          {!item.url && (
            <a href="javascript: void(0);" className={style.fel__menuTop__link}>
              {icon && <i className={`${icon} ${style.fel__menuTop__icon}`} />}
              <span>{title}</span>
            </a>
          )}
        </li>
      )
    }

    const submenuItem = item => {
      return (
        <li
          className={classNames(style.fel__menuTop__item, style.fel__menuTop__submenu, {
            [style.fel__menuTop__submenu__active]: activeSubmenu === item.key,
          })}
          key={item.key}
        >
          <a
            href="javascript: void(0);"
            className={style.fel__menuTop__link}
            onClick={() => this.handleSubmenuClick(item.key)}
            onMouseEnter={event => this.handleFlyoutOver(event, item.key, item.children)}
            onFocus={event => this.handleFlyoutOver(event, item.key, item.children)}
            onMouseLeave={() => this.handleFlyoutOut(item.key)}
            onBlur={() => this.handleFlyoutOut(item.key)}
          >
            <i className={`${item.icon} ${style.fel__menuTop__icon}`} />
            <span>{item.title}</span>
            {item.count && (
              <span className="badge text-white bg-blue-light float-right mt-1 px-2">
                {item.count}
              </span>
            )}
          </a>
          <ul className={style.fel__menuTop__list}>
            {item.children.map(sub => {
              if (sub.children) {
                return submenuItem(sub)
              }
              return menuItem(sub)
            })}
          </ul>
        </li>
      )
    }

    return menuData.map(item => {
      if (item.children) {
        return submenuItem(item)
      }
      return menuItem(item)
    })
  }

  render() {
    const { settings } = this.props
    const { renderedFlyoutItems } = this.state
    const items = this.generateMenuItems()
    return (
      <div>
        <TransitionGroup>
          {Object.keys(renderedFlyoutItems).map(item => {
            return (
              <CSSTransition key={item} timeout={0} classNames="fel__menuFlyout__animation">
                {renderedFlyoutItems[item]}
              </CSSTransition>
            )
          })}
        </TransitionGroup>
        <div
          className={classNames(style.fel__menuTop, {
            [style.fel__menuTop__mobileToggled]: settings.isMobileMenuOpen,
            [style.fel__menuTop__shadow]: settings.isMenuShadow,
            [style.fel__menuTop__flyout]: true,
            [style.fel__menuTop__blue]: settings.menuColor === 'blue',
            [style.fel__menuTop__white]: settings.menuColor === 'white',
            [style.fel__menuTop__gray]: settings.menuColor === 'gray',
            [style.fel__menuFlyout__black]: settings.flyoutMenuColor === 'dark',
            [style.fel__menuFlyout__white]: settings.flyoutMenuColor === 'white',
            [style.fel__menuFlyout__gray]: settings.flyoutMenuColor === 'gray',
          })}
        >
          <div className={style.fel__menuTop__outer}>
            <a
              href="javascript: void(0);"
              className={style.fel__menuTop__mobileToggleButton}
              onClick={this.toggleMobileMenu}
            >
              <span />
            </a>
            <a href="javascript: void(0);" className={style.fel__menuTop__logo}>
              <img src="/images/fellowary-logo.png" alt="Fellowary" />
              <div className={style.fel__menuTop__logo__name}>Fellowary</div>
              <div className={style.fel__menuTop__logo__descr}>Chat</div>
            </a>
            <div id="menu-left-container" className={style.fel__menuTop__container}>
              <ul className={style.fel__menuTop__list}>
                <li className={style.fel__menuTop__item}>
                  <a
                    href="javascript: void(0);"
                    className={style.fel__menuTop__link}
                    onClick={this.toggleSettings}
                  >
                    <i className={`fe fe-settings ${style.fel__menuTop__icon}`} />
                    <span>Settings</span>
                  </a>
                </li>
                <li className={style.fel__menuTop__item}>
                  <a
                    href="https://fellowary.com/docs"
                    className={style.fel__menuTop__link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className={`fe fe-compass ${style.fel__menuTop__icon}`} />
                    <span>Documentation</span>
                  </a>
                </li>
                {items}
              </ul>
            </div>
          </div>
        </div>
        <a
          aria-label="toggle mobile menu"
          href="javascript: void(0);"
          className={style.fel__menuTop__backdrop}
          onClick={this.toggleMobileMenu}
        />
      </div>
    )
  }
}

export default MenuTop
