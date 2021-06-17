import React from 'react'
import { connect } from 'react-redux'
import { Scrollbars } from 'react-custom-scrollbars'
import { Switch, Radio, Select } from 'antd'
import classNames from 'classnames'
import style from './style.module.scss'

const mapStateToProps = ({ settings }) => ({ settings })

@connect(mapStateToProps)
class Sidebar extends React.Component {
  changeSetting = (setting, value) => {
    const { dispatch } = this.props
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting,
        value,
      },
    })
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

  selectMenuType = e => {
    const { dispatch } = this.props
    const { value } = e.target
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'menuType',
        value,
      },
    })
  }

  selectMenuLayoutType = e => {
    const { dispatch } = this.props
    const { value } = e.target
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'menuLayoutType',
        value,
      },
    })
  }

  colorPickerHandler = (setting, value) => {
    const { dispatch } = this.props
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting,
        value,
      },
    })
  }

  selectRouterAnimation = value => {
    const { dispatch } = this.props
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'routerAnimation',
        value,
      },
    })
  }

  render() {
    const {
      settings: {
        isSidebarOpen,
        isMenuCollapsed,
        isMenuShadow,
        isMenuUnfixed,
        menuLayoutType,
        menuType,
        menuColor,
        flyoutMenuColor,
        systemLayoutColor,
        isTopbarFixed,
        isContentNoMaxWidth,
        isAppMaxWidth,
        isGrayBackground,
        isGrayTopbar,
        isCardShadow,
        isSquaredBorders,
        isBorderless,
        routerAnimation,
      },
    } = this.props

    const ColorPicker = props => {
      return props.colors.map(item => {
        return (
          <a
            href="javascript: void(0);"
            aria-label="color-picker"
            key={item}
            onClick={() => this.colorPickerHandler(props.setting, item)}
            className={classNames(`${style.fel__sidebar__select__item}`, {
              [style.fel__sidebar__select__item__active]: props.value === item,
              [style.fel__sidebar__select__item__black]: item === 'dark',
              [style.fel__sidebar__select__item__white]: item === 'white',
              [style.fel__sidebar__select__item__gray]: item === 'gray',
              [style.fel__sidebar__select__item__blue]: item === 'blue',
              [style.fel__sidebar__select__item__img]: item === 'image',
            })}
          />
        )
      })
    }

    return (
      <div>
        <div
          className={classNames(style.fel__sidebar, {
            [style.fel__sidebar__toggled]: isSidebarOpen,
          })}
        >
          <Scrollbars
            autoHide
            renderThumbVertical={({ ...props }) => (
              <div
                {...props} //eslint-disable-line
                style={{
                  width: '5px',
                  borderRadius: 'inherit',
                  backgroundColor: 'rgba(195, 190, 220, 0.4)',
                  left: '1px',
                }}
              />
            )}
          >
            <div className={style.fel__sidebar__inner}>
              <a
                aria-label="close sidebar"
                href="javascript: void(0);"
                className={`fe fe-x-circle ${style.fel__sidebar__close}`}
                onClick={this.toggleSettings}
              />
              <h5>
                <strong>Theme Settings</strong>
              </h5>
              <div className="fel__utils__line" style={{ marginTop: 25, marginBottom: 30 }} />
              <div>
                <p className="text-muted mb-5">
                  This component gives possibility to construct custom blocks with any widgets,
                  components and elements inside, like this theme settings
                </p>
                <div className={style.fel__sidebar__type}>
                  <div className={style.fel__sidebar__type__title}>
                    <span>Left Menu Type</span>
                  </div>
                  <div className={style.fel__sidebar__type__items}>
                    <Radio.Group onChange={this.selectMenuType} defaultValue={menuType}>
                      <div className="row">
                        <div className="col-6">
                          <div className="mb-2">
                            <Radio value="default" disabled={menuLayoutType !== 'left'}>
                              Default
                            </Radio>
                          </div>
                          <div className="mb-2">
                            <Radio value="flyout" disabled={menuLayoutType !== 'left'}>
                              Flyout
                            </Radio>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <Radio value="compact" disabled={menuLayoutType !== 'left'}>
                              Compact
                            </Radio>
                          </div>
                        </div>
                      </div>
                    </Radio.Group>
                  </div>
                </div>
                <div className={`${style.fel__sidebar__type} mb-4`}>
                  <div className={style.fel__sidebar__type__title}>
                    <span>Router Animation</span>
                  </div>
                  <div className={style.fel__sidebar__type__items}>
                    <Select
                      defaultValue={routerAnimation}
                      style={{ width: '100%' }}
                      onChange={this.selectRouterAnimation}
                    >
                      <Select.Option value="none">None</Select.Option>
                      <Select.Option value="slide-fadein-up">Slide Up</Select.Option>
                      <Select.Option value="slide-fadein-right">Slide Right</Select.Option>
                      <Select.Option value="fadein">Fade In</Select.Option>
                      <Select.Option value="zoom-fadein">Zoom</Select.Option>
                    </Select>
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Toggled left menu</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isMenuCollapsed}
                      disabled={menuLayoutType !== 'left'}
                      onChange={value => {
                        this.changeSetting('isMenuCollapsed', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Unfixed left menu</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isMenuUnfixed}
                      disabled={menuLayoutType !== 'left'}
                      onChange={value => {
                        this.changeSetting('isMenuUnfixed', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Fixed topbar</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isTopbarFixed}
                      onChange={value => {
                        this.changeSetting('isTopbarFixed', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Menu color</div>
                  <div className={style.fel__sidebar__container}>
                    <ColorPicker
                      setting="menuColor"
                      value={menuColor}
                      colors={['white', 'gray', 'blue', 'dark']}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Flyout menu</div>
                  <div className={style.fel__sidebar__container}>
                    <ColorPicker
                      setting="flyoutMenuColor"
                      value={flyoutMenuColor}
                      colors={['white', 'gray', 'blue', 'dark']}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Login color</div>
                  <div className={style.fel__sidebar__container}>
                    <ColorPicker
                      setting="systemLayoutColor"
                      value={systemLayoutColor}
                      colors={['white', 'gray', 'blue', 'dark', 'image']}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Content no max-width</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isContentNoMaxWidth}
                      onChange={value => {
                        this.changeSetting('isContentNoMaxWidth', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>App max-width</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isAppMaxWidth}
                      onChange={value => {
                        this.changeSetting('isAppMaxWidth', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Gray background</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isGrayBackground}
                      onChange={value => {
                        this.changeSetting('isGrayBackground', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Gray topbar</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isGrayTopbar}
                      onChange={value => {
                        this.changeSetting('isGrayTopbar', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Squared card borders</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isSquaredBorders}
                      onChange={value => {
                        this.changeSetting('isSquaredBorders', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Card shadow</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isCardShadow}
                      onChange={value => {
                        this.changeSetting('isCardShadow', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Borderless cards</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isBorderless}
                      onChange={value => {
                        this.changeSetting('isBorderless', value)
                      }}
                    />
                  </div>
                </div>
                <div className={style.fel__sidebar__item}>
                  <div className={style.fel__sidebar__label}>Menu shadow</div>
                  <div className={style.fel__sidebar__container}>
                    <Switch
                      checked={isMenuShadow}
                      onChange={value => {
                        this.changeSetting('isMenuShadow', value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Scrollbars>
        </div>
        {/* <a
          href="javascript: void(0);"
          onClick={this.toggleSettings}
          className={`${style.fel__sidebar__toggleButton} btn btn-rounded btn-light text-nowrap text-dark font-weight-bold font-size-18`}
        >
          <i className="fe fe-settings text-blue" />
        </a> */}
      </div>
    )
  }
}

export default Sidebar
