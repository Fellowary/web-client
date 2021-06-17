import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import classNames from 'classnames'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { Avatar, Badge, Input, Layout, Button, Modal, Tabs } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
import style from './style.module.scss'

const {TabPane} = Tabs;

const { Sider } = Layout
const mapStateToProps = ({ menu, settings, user, identities, circles }) => ({
  menuData: menu.menuData,
  settings,
  user,
  identities,
  circles,
  flyoutActive:
    (settings.menuType === 'flyout' ||
      settings.menuType === 'compact' ||
      settings.isMenuCollapsed) &&
    !settings.isMobileView,
})

@withRouter
@connect(mapStateToProps)
class MenuLeft extends React.Component {
  flyoutTimers = {}

  currentLocation = ''
  
  state = {}

  constructor(props){
    super(props);

    const {user, identities, circles} = this.props;
    const {
      currentIdentity,
      currentCircle
    } = this.parseCurrentIdentityAndCircle(user, identities, circles);


    this.state.activeSubmenu = '';
    this.state.activeItem = '';
    this.state.render = true;
    this.state.identityFilter = '';
    this.state.circleFilter = '';
    this.state.selectedIdentity = null;
    this.state.selectedCircle = null;
    this.state.renderedFlyoutItems = {};
    this.state.generatedCircleMenuItems = undefined;
    this.state.generatedIdentityMenuItems = undefined;
    this.state.adjustScrollBars = false;
    this.state.identityModalVisible = false;
    this.state.circleModalVisible = false;
    this.state.modalIdentity = '';
    this.state.modalCircle = '';
    this.state.identityTabs = [];
    this.state.circleTabs = [];



    this.state.selectedIdentity = currentIdentity;
    this.state.selectedCircle = currentCircle;
    // console.log("constructor ", currentIdentity, currentCircle);
    if(!currentIdentity || !currentCircle){
      // we're not ready yet, bail
      return;
    }
    this.state.generatedIdentityMenuItems = this.generateMenuItems('identity', -1, false, "", currentIdentity, currentCircle);
    this.state.generatedCircleMenuItems = this.generateMenuItems('circle', -1, false, "", currentIdentity, currentCircle);

    this.scrollBarsIdentity = React.createRef();
    this.scrollBarsCircle = React.createRef();
  }

  componentDidMount() {
    this.setActiveItems(this.props)
  }

  UNSAFE_componentWillReceiveProps(newProps) { //eslint-disable-line
    const { identities, circles } = this.props;

    const { pathname } = newProps.location;
    const newIdentities = newProps.identities;
    const newCircles = newProps.circles;
    const newUser = newProps.user;
    let { selectedIdentity, selectedCircle} = this.state;
    const { generatedIdentityMenuItems, generatedCircleMenuItems } = this.state;

    const tempState = {};
    const {
      currentIdentity,
      currentCircle
    } = this.parseCurrentIdentityAndCircle(newUser, newIdentities, newCircles);

    // console.log(`selectedIdentity and circle`, currentIdentity, currentCircle, selectedIdentity, selectedCircle);
    let changed = false;
    // check if the current selecteIdentity is valid.  assign if so, use current if not
    if(!selectedIdentity || newUser.navigating){
      selectedIdentity = currentIdentity;
      changed = true;
    }
    else{
      selectedIdentity = newIdentities[selectedIdentity.fingerprint] || currentIdentity;
    }

    // check if the current selecteCircle is valid.  assign if so, use current if not
    if(!selectedCircle || newUser.navigating){
      selectedCircle = currentCircle;
      changed = true;
    }
    else{
      selectedCircle = newCircles[selectedCircle.fingerprint] || currentCircle;
    }




    tempState.selectedIdentity = selectedIdentity;
    tempState.selectedCircle = selectedCircle;
    // console.log(`selectedIdentity and circle`, currentIdentity, currentCircle, selectedIdentity, selectedCircle);
    // console.log(`selectedIdentity.circles length: ${selectedIdentity.circles.length}`);
    const newIdentitiesArray = Object.keys(newIdentities);
    if (!generatedIdentityMenuItems || changed || newIdentitiesArray.length !== Object.keys(identities).length){
      // if we're in this option then we have a new circle or a new identity, just change the selected identity or circle to the current one.
      tempState.generatedIdentityMenuItems = this.generateMenuItems('identity', -1, newIdentities, "", selectedIdentity, selectedCircle);
      // console.log("receiveprops generatedIdentityMenuItems", tempState.generatedIdentityMenuItems);
    }

    const newCirclesArray = Object.keys(newCircles);
    if (!generatedCircleMenuItems || changed || newCirclesArray.length !== Object.keys(circles).length){
      // console.log("receiveprops circle lengths are different", selectedIdentity, selectedCircle);
      tempState.generatedCircleMenuItems = this.generateMenuItems('circle', -1, newCircles, "", selectedIdentity, selectedCircle);
      // console.log("receiveprops generatedCircleMenuItems", tempState.generatedCircleMenuItems);
    }

    if (this.currentLocation !== pathname) {
      this.setActiveItems(newProps);
      this.currentLocation = pathname;
      this.closeMobileMenu();
    }

    if(changed){
      console.log('setting scrollbars', selectedIdentity, selectedCircle);
      tempState.adjustScrollBars = true;
      tempState.selectedIdentityPosition = newIdentitiesArray.indexOf(selectedIdentity.fingerprint);
      tempState.identitiesLength = newIdentitiesArray.length;
      tempState.selectedCirclePosition = newCirclesArray.indexOf(selectedCircle.fingerprint);
      tempState.circlesLength = newCirclesArray.length;
    }
    this.setState(tempState);
  }

  shouldComponentUpdate(nextProps, nextState){
    // console.log("should update Messaging:", nextState.render);
    return nextState.render;
  }

  componentDidUpdate(){
    if(this.scrollBarsIdentity.current && this.scrollBarsCircle.current){
      const {adjustScrollBars, selectedIdentityPosition, identitiesLength, selectedCirclePosition, circlesLength} = this.state;
      if(adjustScrollBars){
        const valuesIdentity = this.scrollBarsIdentity.current.getValues();
        const valuesCircle = this.scrollBarsCircle.current.getValues();
        // console.log("this.scrollBarsIdentity", this.scrollBarsIdentity.current, valuesIdentity, selectedIdentityPosition, identitiesLength);
        this.scrollBarsIdentity.current.scrollTop(Math.ceil(valuesIdentity.scrollHeight*(selectedIdentityPosition/identitiesLength)));
        this.scrollBarsCircle.current.scrollTop(Math.ceil(valuesCircle.scrollHeight*(selectedCirclePosition/circlesLength)));
        
        this.setState({ //eslint-disable-line
          adjustScrollBars: false
        });
      }
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
    const { activeSubmenu, selectedIdentity, selectedCircle } = this.state;
    const { identities, circles } = this.props;

    const newActiveSubmenu = activeSubmenu === key ? key : key;

    const identity = identities[key] || selectedIdentity;

    const circle = identity.circles.includes(key) && circles[key] || selectedCircle || circles[identity.primaryCircle.fingerprint];

    this.setState({
      activeSubmenu: newActiveSubmenu,
      selectedIdentity: identity,
      selectedCircle: circle,
      generatedIdentityMenuItems: this.generateMenuItems('identity', -1, false, newActiveSubmenu, identity, circle),
      generatedCircleMenuItems: this.generateMenuItems('circle', -1, false, newActiveSubmenu, identity, circle)
    });

    
  }

  handleFlyoutOver = (event, title, key, items) => {
    const { flyoutActive } = this.props
    if (flyoutActive) {
      clearInterval(this.flyoutTimers[key])
      const item = event.currentTarget
      const itemDimensions = item.getBoundingClientRect()
      const element = this.renderFlyoutMenu(items, title, key, itemDimensions)
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

  handleFlyoutContainerOver = key => {
    clearInterval(this.flyoutTimers[key])
  }

  createdFlyoutMenu = (title, items, activeItem) => {
    const flyoutMenu = [];
    // console.log("flyouttitle", title);
    flyoutMenu.push(<li className={style.fel__menuLeft__item__title} key={`flyout-title-${title}`}>{title}</li>);
    for(let i=0;i< items.length;++i) { //eslint-disable-line
      flyoutMenu.push(
        <li
          className={classNames(style.fel__menuLeft__item, {
            [style.fel__menuLeft__item__active]: activeItem === items[i].key,
          })}
          key={items[i].key}
        >
          <Link to={items[i].url} className={style.fel__menuLeft__link}>
            {items[i].icon && <i className={`${items[i].icon} ${style.fel__menuLeft__icon}`} />}
            <span>{items[i].title}</span>
          </Link>
        </li>
      );
    }
    return flyoutMenu;
  }

  renderFlyoutMenu = (items, title, key, itemDimensions) => {
    const { settings } = this.props
    const { activeItem } = this.state
    const left = `${itemDimensions.left + itemDimensions.width - 10}px`
    const top = `${itemDimensions.top}px`
    // // console.log("FLYOUT");
    return (
      <div
        style={{ left, top }}
        className={classNames(style.fel__menuFlyout, {
          [style.fel__menuFlyoutLeft]: settings.menuLayoutType === 'left',
          [style.fel__menuFlyout__black]: settings.flyoutMenuColor === 'dark',
          [style.fel__menuFlyout__white]: settings.flyoutMenuColor === 'white',
          [style.fel__menuFlyout__gray]: settings.flyoutMenuColor === 'gray',
        })}
        key={key}
      >
        <ul
          className={style.fel__menuLeft__list}
          onMouseEnter={() => this.handleFlyoutContainerOver(key)}
          onMouseLeave={() => this.handleFlyoutOut(key)}
        >
          {this.createdFlyoutMenu(title, items, activeItem)}
        </ul>
      </div>
    )
  }

  setActiveItems = props => {
    const { menuData = [], circles } = props
    if (!menuData.length || !circles.length) {
      return;
    }

    const flattenItems = (items, key) =>
      items.reduce((flattenedItems, item) => {
        flattenedItems.push(item);
        if (Array.isArray(item[key])) {
          return flattenedItems.concat(flattenItems(item[key], key));
        }
        return flattenedItems;
    }, []);

    // console.log("FLATTENED_ITEMS", flattenItems(menuData, 'children'));
    const flattenedItems = flattenItems(menuData, 'children');
    let activeItem;
    for(let i=0;i < flattenedItems.length;++i){ // eslint-disable-line
      if(flattenedItems[i].url === props.location.pathname){
        activeItem = flattenedItems[i];
        break;
      }
    }

    // const activeItem = _.find(flattenItems(menuData, 'children'), ['url', props.location.pathname]);


    const activeSubmenu = menuData.reduce((key, parent) => {
      // console.log("ACTIVESUBMENU");
      if (Array.isArray(parent.children)) {
        parent.children.map(child => {
          if (child.key === activeItem.key) {
            key = parent
          }
          return ''
        })
      }
      return key;
    })

    this.setState({
      activeItem: activeItem.key,
      activeSubmenu: activeSubmenu.key,
    })

  }

  createIdentity = (e) => {
    // console.log('creating identity');
    e.stopPropagation();
    const { dispatch, user } = this.props;
    if(user.loading){
      return;
    }
    dispatch({
      type: 'identities/CREATE_IDENTITY',
      payload: {
        name: '',
      },
    })
  }

  createCircle = (e) => {
    const {dispatch, user} = this.props; //eslint-disable-line
    const { selectedIdentity } = this.state;
    // const {activeSubmenu} = this.state;
    // console.log('creating circle', user.primaryIdentity);
    e.stopPropagation();
    if(user.loading){
      return;
    }
    dispatch({
      type: 'circles/CREATE_CIRCLE',
      payload: {
        circleName: '',
        identityFingerprint: selectedIdentity.fingerprint
      },
    })
  }


  filterIdentities = (e) => {
    // console.log("filter identities", e, e.target.value);
    const filterString = e.target.value ? e.target.value.toLowerCase() : '';
    this.setState({
      generatedIdentityMenuItems: this.generateMenuItems('identity', filterString),
      identityFilter: filterString
    });
  };

  filterCircles = (e) => {
    // console.log("filter circles", e.target.value);
    const filterString = e.target.value ? e.target.value.toLowerCase(): '';
    this.setState({
      generatedCircleMenuItems: this.generateMenuItems('circle', filterString),
      circleFilter: filterString
    });
  };

  generateMenuItems = (itemType = 'circle', filterString = -1, newItems = false, activeSubmenu = "", identity=false, circle=false) => {
    // console.log("GENERATE, filter string length", this.state, filterString.length, newItems, identity, circle);
    const { identityFilter, circleFilter } = this.state;

    let { selectedIdentity, selectedCircle } = this.state;
    // console.log("checking selected identity", selectedIdentity, identity);
    
    if (identity){
      selectedIdentity = identity;
    }
    
    if (circle){
      selectedCircle = circle;
    }

    let itemTitle; // = itemType === 'circle' ? 'Circle' : 'Identity';
    let itemShape; // = itemType === 'circle' ? 'circle' : 'square';
    let filterFunc;
    let items; // newItems;
    const modalFunction = itemType === 'circle'? this.showCircleModal : this.showIdentityModal;

    // identities are handled first.  They have a list of circle fingerprints which are used to filter circles
    // first filter by identity's circles then circle filter

    if (itemType === 'circle'){
      items = {};
      itemTitle = 'Circle';
      itemShape = 'circle';
      filterFunc = this.filterCircles;
      if (filterString === -1){
        filterString = circleFilter;
      }  
      // console.log("SELECTED IDENTITY IN GENERATECIRCLEMENU", selectedIdentity, this.props.circles, primaryIdentity, primaryCircle, identity, circle); // eslint-disable-line
      if (newItems){
        console.log("WE HAVE NEW ITEMS");
        let properlyAdded = false;
        for(let i=0; i < selectedIdentity.circles.length;++i) { // eslint-disable-line
          items[selectedIdentity.circles[i]] = newItems[selectedIdentity.circles[i]]; 
          if (!properlyAdded && items[selectedIdentity.circles[i]]){
            properlyAdded = true;
          }
          if (!properlyAdded){
            items = {};
            break;
          }
        }
      }
      else if(this.props.circles){ // eslint-disable-line
        console.log("this.props.circles exists and we don't have newItems", this.props.circles); // eslint-disable-line
        let properlyAdded = false;
        for(let i=0; i < selectedIdentity.circles.length;++i) { // eslint-disable-line
          items[selectedIdentity.circles[i]] = this.props.circles[selectedIdentity.circles[i]];  // eslint-disable-line
          if (!properlyAdded && items[selectedIdentity.circles[i]]){
            properlyAdded = true;
          }
          if (!properlyAdded){
            items = {};
            break;
          }
        }
      } 
    }
    else if(itemType === 'identity'){
      itemTitle = 'Identity';
      itemShape = 'square';
      filterFunc = this.filterIdentities;
      if(filterString === -1){
        filterString = identityFilter;
      }
      if(!newItems){
        items = this.props.identities; // eslint-disable-line
      }
      else{
        items = newItems;
      }
    }
    else{
      items = newItems;
    }

    
    // console.log('filterString', filterString);
    // console.log("itemType and items", itemType, items);

    const { menuData = [] } = this.props;
    const { activeItem } = this.state;

    const itemMenu = [
      <li className={style.fel__menuLeft__category} key={itemTitle}>
        <Badge count={
          <Input
            className={`${itemType === 'circle'? 'secondrightbadge20':'secondrightbadge'} searchexpandhover`}
            placeholder="Search..."
            prefix={<i className="fa fa-search" style={{ color: 'rgba(0,0,0,.25)' }} />}
            onChange={filterFunc}
          />}
        >
          <Badge count={<a href="javascript: void(0);" aria-label={`create new ${itemType}`} className="rightbadge" onClick={itemType === 'circle'? this.createCircle : this.createIdentity}><i className="textpulsehover fe fe-plus-circle solidbackground round" /></a>}>
            <span>{itemTitle}</span>
          </Badge>
        </Badge>
      </li>
    ]; 

    const scrollableMenuItems = []
    let identityUrl = ``;
    if (selectedIdentity && itemType === 'circle'){
      identityUrl = `identity/${selectedIdentity.fingerprint}/`
    }
    for (const iKey in items){  // eslint-disable-line
      if(filterString.length > 0 && !items[iKey].name.toLowerCase().includes(filterString)){
        // console.log("FILTERING", filterString);
        continue; // eslint-disable-line
      }
      let selectionStyleClass = ``;

      if(iKey === selectedIdentity){
        selectionStyleClass = style.fel__menuLeft__item__selectedIdentity;
      }
      else if(iKey === selectedCircle){
        selectionStyleClass = style.fel__menuLeft__item__selectedCircle;
      }
      const children = [
        {
          title: `Social`,
          key: `${items[iKey].fingerprint}/social`,
          icon: `fe fe-users`,
          url: `/social/${identityUrl}${itemType}/${items[iKey].fingerprint}`
        },
        // {
        //   title: `Files`,
        //   key: `${items[iKey].fingerprint}/files`,
        //   icon: `fe fe-folder`,
        //   url: `/files/${identityUrl}${itemType}/${items[iKey].fingerprint}`
        // },
        // {
        //   title: `Manage`,
        //   key: `${items[iKey].fingerprint}/maange`,
        //   icon: `icmn icmn-make-group`,
        //   url: `/manage/${identityUrl}${itemType}/${items[iKey].fingerprint}`
        // }
      ];

      const itemMenuItem = (
        <li
          className={classNames(style.fel__menuLeft__item, style.fel__menuLeft__submenu, {
            [style.fel__menuLeft__submenu__active]: activeSubmenu === items[iKey].fingerprint 
            || (selectedIdentity && selectedIdentity.fingerprint === items[iKey].fingerprint) 
            || (selectedCircle && selectedCircle.fingerprint === items[iKey].fingerprint),
          })}
          key={items[iKey].fingerprint}
        >
          <a
            href="javascript: void(0);"
            className={`${style.fel__menuLeft__link} ${style.itemAnchor} ${selectionStyleClass}`}
            onClick={() => {console.log("SUBMENU ONLICK"); this.handleSubmenuClick(items[iKey].fingerprint); }}
            onMouseEnter={event => this.handleFlyoutOver(event, items[iKey].name, items[iKey].fingerprint, children)}
            onFocus={event => this.handleFlyoutOver(event, items[iKey].name, items[iKey].fingerprint, children)}
            onMouseLeave={() => this.handleFlyoutOut(items[iKey].fingerprint)}
            onBlur={() => this.handleFlyoutOut(items[iKey].fingerprint)}
          >
            <div className={style.avatarHolder}>
              <Badge count={items[iKey].notificationCount}>
                <Avatar className={style.avatar} onClick={(e) => {e.stopPropagation();modalFunction(items[iKey].fingerprint);}} shape={itemShape} size="small" src={items[iKey].avatar} />
              </Badge>
            </div>
            <span className={style.circleName}><strong>{items[iKey].name}</strong></span>
          </a>
          <ul className={style.fel__menuLeft__list}>
            <li
              className={classNames(style.fel__menuLeft__item, {
                [style.fel__menuLeft__item__active]: activeItem === children[0].key,
              })}
              key={children[0].key}
            >
              {children[0].url && (
                <Link to={children[0].url} className={style.fel__menuLeft__link}>
                  {children[0].icon && <i className={`${children[0].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[0].title}</span>
                </Link>
              )}
              {!children[0].url && (
                <a href="javascript: void(0);" className={style.fel__menuLeft__link}>
                  {children[0].icon && <i className={`${children[0].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[0].title}</span>
                </a>
              )}
            </li>
            {/* <li
              className={classNames(style.fel__menuLeft__item, {
                [style.fel__menuLeft__item__active]: activeItem === children[1].key,
              })}
              key={children[1].key}
            >
              {children[1].url && (
                <Link to={children[1].url} className={style.fel__menuLeft__link}>
                  {children[1].icon && <i className={`${children[1].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[1].title}</span>
                </Link>
              )}
              {!children[1].url && (
                <a href="javascript: void(0);" className={style.fel__menuLeft__link}>
                  {children[1].icon && <i className={`${children[1].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[1].title}</span>
                </a>
              )}
            </li>
            <li
              className={classNames(style.fel__menuLeft__item, {
                [style.fel__menuLeft__item__active]: activeItem === children[2].key,
              })}
              key={children[2].key}
            >
              {children[2].url && (
                <Link to={children[2].url} className={style.fel__menuLeft__link}>
                  {children[2].icon && <i className={`${children[2].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[2].title}</span>
                </Link>
              )}
              {!children[2].url && (
                <a href="javascript: void(0);" className={style.fel__menuLeft__link}>
                  {children[2].icon && <i className={`${children[2].icon} ${style.fel__menuLeft__icon}`} />}
                  <span>{children[2].title}</span>
                </a>
              )}
            </li> */}
          </ul>
        </li>
      )

      // itemMenu.push(itemMenuItem);
      scrollableMenuItems.push(itemMenuItem);
    }


    const scrollableItemMenu = (
      <li className={style.fel__menuLeft__item} key={`leftmenuscroll-${itemType === 'circle'? 'circles': 'identities'}`}>
        <Scrollbars
          ref={itemType === 'circle' ? this.scrollBarsCircle : this.scrollBarsIdentity}
          autoHide
          autoHeight
          autoHeightMin={100}
          autoHeightMax={300}
          renderThumbVertical={({ ...props }) => (
            <div
              {...props} //eslint-disable-line
              style={{
                width: '20px',
                borderRadius: 'inherit',
                backgroundColor: 'rgba(195, 190, 220, 0.4)',
                left: '1px',
              }}
            />
          )}
        >
          <ul className={style.fel__menuLeft__list}>
            {scrollableMenuItems}
          </ul>
        </Scrollbars>
      </li>
    );

    const menuItem = item => {
      const { key, title, icon, url } = item
      if (item.category) {
        const categoryKey = `${key}-${title}-${item.category}-category`;
        return (
          <li className={style.fel__menuLeft__category} key={categoryKey}>
            <span>{title}</span>
          </li>
        )
      }
      return (
        <li
          className={classNames(style.fel__menuLeft__item, {
            [style.fel__menuLeft__item__active]: activeItem === key,
          })}
          key={key}
        >
          {item.url && (
            <Link to={url} className={style.fel__menuLeft__link}>
              {icon && <i className={`${icon} ${style.fel__menuLeft__icon}`} />}
              <span>{title}</span>
            </Link>
          )}
          {!item.url && (
            <a href="javascript: void(0);" className={style.fel__menuLeft__link}>
              {icon && <i className={`${icon} ${style.fel__menuLeft__icon}`} />}
              <span>{title}</span>
            </a>
          )}
        </li>
      )
    }

    const submenuItem = item => { //eslint-disable-line
      return (
        <li
          className={classNames(style.fel__menuLeft__item, style.fel__menuLeft__submenu, {
            [style.fel__menuLeft__submenu__active]: activeSubmenu === item.key,
          })}
          key={item.key}
        >
          <a
            href="javascript: void(0);"
            className={style.fel__menuLeft__link}
            onClick={() => this.handleSubmenuClick(item.key)}
            onMouseEnter={event => this.handleFlyoutOver(event, null, item.key, item.children)}
            onFocus={event => this.handleFlyoutOver(event, null, item.key, item.children)}
            onMouseLeave={() => this.handleFlyoutOut(item.key)}
            onBlur={() => this.handleFlyoutOut(item.key)}
          >
            <i className={`${item.icon} ${style.fel__menuLeft__icon}`} />
            <span>{item.title}</span>
            {item.count && (
              <span className="badge text-white bg-blue-light float-right mt-1 px-2">
                {item.count}
              </span>
            )}
          </a>
          <ul className={style.fel__menuLeft__list}>
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

    itemMenu.push(scrollableItemMenu);

    // Handle generic item menu, circles comes last so shove them in after
    if (itemType === 'circle'){
      for(let i=0;i< menuData.length;++i){ // eslint-disable-line
        if(menuData[i].children){
          itemMenu.push(submenuItem(menuData[i]));
        }
        else{
          itemMenu.push(menuItem(menuData[i]));
        }
      }
    }

    return itemMenu;
  }

  getFlyoutItems = (items) => {
    const flyoutItems = [];
    for(const key in items){ // eslint-disable-line
      flyoutItems.push(
        <CSSTransition key={key} timeout={0} classNames="fel__menuFlyout__animation">
          {items[key]}
        </CSSTransition>
      );
    }
    return flyoutItems;
  }



  getCircleTabs = (fingerprint) => {
    const {circles} = this.props;
    const circle = circles[fingerprint];

    const circleTabs = [];
    // console.log("chosen circle", circle);
    for(const key in circle){ // eslint-disable-line

      let insert = null;

      if (key === 'personae'){
        insert = this.formatPersonae(circle[key]);
      }
      else if(key === 'config' || key === 'settings'){
        continue; // eslint-disable-line
      }
      else if(key === 'privateKey'){
        insert = (
          <div>
            Do <b>not</b> share this private key with <b><u>anyone</u></b>.
            <pre>{circle[key]}</pre>
          </div>
        );
      }
      else{
        insert = <pre>{circle[key]}</pre>;
      }
      circleTabs.push(
        <TabPane tab={key} key={key}>
          {insert}
        </TabPane>
      );
    }
    return circleTabs;
  }

  getIdentityTabs = (fingerprint) => {
    const {identities, circles} = this.props;
    const identity = identities[fingerprint];

    const identityTabs = [];
    // console.log("chosen identity", identity);
    const safeKeys =['name', 'avatar', 'fingerprint', 'publicKey', 'privateKey', 'circles'];
    for(const key in identity){ // eslint-disable-line
      if(!safeKeys.includes(key)){
        continue; //eslint-disable-line
      }
      let insert = null;
      if (key === 'avatar'){
        insert = <img src={identity[key]} alt={identity.name} />;
      }
      else if(key === 'privateKey'){
        insert = (
          <div>
            Do <b>not</b> share this private key with <b><u>anyone</u></b>.
            <pre>{identity[key]}</pre>
          </div>
        );
      }
      else if(key === 'circles'){
        insert = [];
        insert = identity[key].map((circle) => { //eslint-disable-line
          return (
            <div>
              {circles[circle].name}
              <pre>{circle}</pre>
            </div>
          );
        });
      }
      else{
        insert = <pre>{identity[key]}</pre>;
      }
      identityTabs.push(
        <TabPane tab={key} key={key}>
          {insert}
        </TabPane>
      );
    }

    return identityTabs;
  }

  showCircleModal = (fingerprint) => {
    const { circles } = this.props

    // console.log('showCircleModal', fingerprint);
    const circleTabs = this.getCircleTabs(fingerprint);
    this.setState({
      circleModalVisible: true,
      circleTabs,
      modalCircle: circles[fingerprint]
    });
    this.closeMobileMenu();
  };

  showIdentityModal = (fingerprint) => {
    const {identities } = this.props
    // console.log('showIdentityModal', fingerprint);
    const identityTabs = this.getIdentityTabs(fingerprint);
    this.setState({
      identityModalVisible: true,
      identityTabs,
      modalIdentity: identities[fingerprint]
    });
    this.closeMobileMenu();
  };


  handleModalCancel = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      identityModalVisible: false,
      circleModalVisible: false
    });
  };

  handleModalOk = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      identityModalVisible: false,
      circleModalVisible: false
    });
  };

  closeMobileMenu = () => {
    const { dispatch, settings: {isMobileMenuOpen} } = this.props;
    if(isMobileMenuOpen){
      dispatch({
        type: 'settings/CHANGE_SETTING',
        payload: {
          setting: 'isMobileMenuOpen',
          value: !isMobileMenuOpen,
        },
      });
    }
  }

  setPrimaryIdentity = () => {
    const { dispatch } = this.props;
    const { modalIdentity } = this.state;
    console.log("setPrimaryIdentity: ", modalIdentity);
    dispatch({
      type: 'identities/SET_PRIMARY_IDENTITY',
      payload: {
        fingerprint: modalIdentity.fingerprint,
      },
    });
    this.setState({identityModalVisible: false});
  };

  deleteIdentity = () => {
    // console.log('delete identity menu');
    const { dispatch } = this.props;
    const { modalIdentity } = this.state;
    dispatch({
      type: 'identities/DELETE_IDENTITY',
      payload: {
        name: modalIdentity.name,
        fingerprint: modalIdentity.fingerprint,
        redirect: window.location.hash.includes(`/identity/${modalIdentity.fingerprint}`)
      },
    });
    this.setState({identityModalVisible: false});
  };

  setPrimaryCircle = () => {
    const { dispatch } = this.props;
    const { selectedIdentity, modalCircle } = this.state;
    // console.log(circle);
    console.log("setPrimaryCircle: ", modalCircle)
    dispatch({
      type: 'circles/SET_PRIMARY_CIRCLE',
      payload: {
        circleFingerprint: modalCircle.fingerprint,
        identityFingerprint: selectedIdentity.fingerprint
      },
    });
    this.setState({circleModalVisible: false});
  };

  deleteCircle = () => {
    // console.log('delete circle menu');
    const { dispatch } = this.props;
    const {selectedIdentity, modalCircle } = this.state;
    console.log("menuLeft deleteCircle", modalCircle, selectedIdentity);
    dispatch({
      type: 'circles/DELETE_CIRCLE',
      payload: {
        identityFingerprint: selectedIdentity.fingerprint,
        oldCircleFingerprint: modalCircle.fingerprint,
        oldCircleName: modalCircle.name,
        redirect: window.location.hash.includes(`/circle/${modalCircle.fingerprint}`)
      },
    })
    this.setState({circleModalVisible: false});
  };


  parseCurrentIdentityAndCircle = (inUser, inIdentities, inCircles) => {
    // parseCurrentIdentityAndCircle and parseCurrentIdentityCircleConvo are similar
    // enough to be consolidated so we don't have to do this in each page.
    // figure out how to dedupe them later.

    const location = window.location.hash; // eslint-disable-line
    const pathSections = location.split('/');
    const parsedIdentityFingerprint = pathSections[pathSections.indexOf('identity')+1];

    // if there is no identityFingerprint we're just going to default to the primary for everything.
    console.log("parsedIdentityFingerprint", parsedIdentityFingerprint);
    if (parsedIdentityFingerprint === '#'){
      console.log("defaulting to primaries", inUser, inUser.primaryIdentity, inUser.primaryCircle);
      return {currentIdentity: inUser.primaryIdentity, currentCircle: inUser.primaryCircle};
    }
    
    const parsedIdentity = inIdentities[parsedIdentityFingerprint] || inUser.primaryIdentity;

    // on the next two blocks
    // the reason we use the octothorpe for the comparison is because that's the beginning of the document.location.hash.

    const parsedCircleFingerprint = pathSections[pathSections.indexOf('circle')+1];
    const parsedCircle = inCircles[parsedCircleFingerprint] || inUser.primaryCircle;

    // parsedCircleFingerprint can be null here, identity is always set
    return {currentIdentity: parsedIdentity, currentCircle: parsedCircle};
  }


  render() {
    const { user, settings } = this.props;
    const {
      generatedIdentityMenuItems,
      generatedCircleMenuItems,
      renderedFlyoutItems,
      // activeSubmenu,
      identityModalVisible,
      circleModalVisible,
      identityTabs,
      circleTabs,
    } = this.state;
    const {loading} = user;
    // console.log("active submenu:", activeSubmenu);
    // console.log("generated items", generatedCircleMenuItems, generatedIdentityMenuItems);
    const flyoutItems = this.getFlyoutItems(renderedFlyoutItems);
    const userNotificationCount = 5;
    return (
      <Sider className={settings.isMobileView? style.menuLeftMobile : style.menuLeft} width="auto">
        <TransitionGroup>
          {flyoutItems}
        </TransitionGroup>
        <div
          className={classNames(style.fel__menuLeft, {
            [style.fel__menuLeft__mobileToggled]: settings.isMobileMenuOpen,
            [style.fel__menuLeft__toggled]: settings.isMenuCollapsed,
            [style.fel__menuLeft__unfixed]: settings.isMenuUnfixed,
            [style.fel__menuLeft__shadow]: settings.isMenuShadow,
            [style.fel__menuLeft__flyout]: settings.menuType === 'flyout',
            [style.fel__menuLeft__compact]: settings.menuType === 'compact',
            [style.fel__menuLeft__blue]: settings.menuColor === 'blue',
            [style.fel__menuLeft__white]: settings.menuColor === 'white',
            [style.fel__menuLeft__gray]: settings.menuColor === 'gray',
            [style.fel__menuFlyout__black]:
              settings.flyoutMenuColor === 'dark' && settings.menuType !== 'default',
            [style.fel__menuFlyout__white]:
              settings.flyoutMenuColor === 'white' && settings.menuType !== 'default',
            [style.fel__menuFlyout__gray]:
              settings.flyoutMenuColor === 'gray' && settings.menuType !== 'default',
          })}
        >
          <div className={style.fel__menuLeft__outer}>
            <a
              href="javascript: void(0);"
              className={style.fel__menuLeft__mobileToggleButton}
              onClick={this.toggleMobileMenu}
            >
              <span />
            </a>
            <a
              href="javascript: void(0);"
              className={style.fel__menuLeft__toggleButton}
              onClick={this.toggleMenu}
            >
              <span />
              <span />
            </a>
            <a href="javascript: void(0);" className={style.fel__menuLeft__logo}>
              <img src="/images/fellowary-logo-32px.png" alt="Fellowary Logo" />
              <div className={style.fel__menuLeft__logo__name}>Fellowary</div>
              <div className={style.fel__menuLeft__logo__descr}>Chat</div>
            </a>
            <a href="javascript: void(0);" className={style.fel__menuLeft__user}>
              <Badge count={userNotificationCount}>
                <Avatar className={style.fel__memuLeft__user__avatar} shape="square" size="large" src={user.avatar} />
              </Badge>
              <span className={style.fel__menuLeft__user__name}>{user.username || "Anonymous"}</span>
              {/* <div className={style.fel__menuLeft__user__role}>Administrator</div> */}
            </a>
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
              <div id="menu-left-container" className={style.fel__menuLeft__container}>
                <ul className={style.fel__menuLeft__list}>
                  <li className={style.fel__menuLeft__category}>
                    <span>Personal</span>
                  </li>
                  <li className={style.fel__menuLeft__item}>
                    <a
                      href="javascript: void(0);"
                      className={style.fel__menuLeft__link}
                      onClick={this.toggleSettings}
                    >
                      <i className={`fe fe-settings ${style.fel__menuLeft__icon}`} />
                      <span>Settings</span>
                    </a>
                  </li>
                  {/* <li className={style.fel__menuLeft__item}>
                    <a
                      href="#/files"
                      className={style.fel__menuLeft__link}
                      rel="noopener noreferrer"
                    >
                      <i className={`fe fe-folder ${style.fel__menuLeft__icon}`} />
                      <span>Files</span>
                    </a>
                  </li> */}
                  {/* <li className={style.fel__menuLeft__item}> */}
                  {generatedIdentityMenuItems}
                  {/* </li> */}
                  {/* <li className={style.fel__menuLeft__item}> */}
                  {generatedCircleMenuItems}
                  {/* </li> */}
                </ul>
                <div className={style.fel__menuLeft__banner}>
                  <p>More customization, more styles, more themes!  Never required!</p>
                  <a href="javascript: void();" className="btn btn-white text-center d-block">
                    Buy Fellowary Premium
                  </a>
                </div>
              </div>
            </Scrollbars>
          </div>
        </div>
        <a
          href="javascript: void(0);"
          aria-label="toggle mobile menu"
          className={style.fel__menuLeft__backdrop}
          onClick={this.toggleMobileMenu}
        />
        <Modal
          title="Circle Info"
          visible={circleModalVisible}
          centered
          width="1000px"
          onOk={this.handleModalOk}
          onCancel={this.handleModalCancel}
          footer={
            <span className={style.modalFooter}>
              <Button key="leftMenuDeleteCircle" type="danger" loading={loading} onClick={this.deleteCircle}>Delete</Button>,
              <Button key="leftMenuPrimeCircle" type="primary" loading={loading} onClick={this.setPrimaryCircle}>Make Primary</Button>
            </span>
          }
        >
          <Tabs>
            {circleTabs}
          </Tabs>
        </Modal>
        <Modal
          title="Identity Info"
          visible={identityModalVisible}
          centered
          width="1000px"
          onOk={this.handleModalOk}
          onCancel={this.handleModalCancel}
          footer={
            <span className={style.modalFooter}>
              <Button key="leftMenuDeleteIdentity" type="danger" loading={loading} onClick={this.deleteIdentity}>Delete</Button>,
              <Button key="leftMenuPrimeIdentity" type="primary" loading={loading} onClick={this.setPrimaryIdentity}>Make Primary</Button>
            </span>
          }
        >
          <Tabs>
            {identityTabs}
          </Tabs>
        </Modal>
      </Sider>
    )
  }
}

export default MenuLeft
