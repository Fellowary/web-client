import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Button, Input, Layout, Typography, Modal, Tooltip } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
import {isObjectEmpty} from 'utilities'
import style from './style.module.scss'

const { Sider } = Layout;
const {Title} = Typography;

@connect (({ dispatch, innerMenu, settings, identities, circles, personae }) => ({ dispatch, innerMenu, settings, identities, circles, personae }))
class InnerMenuLeft extends React.Component {
  state = {}
  
  constructor(props){
    super(props);
    console.log("innermenu constructor", this.props);

    const {dispatch, innerMenu, circles, identities, personae} = this.props;
    this.state.menuCollapsed = true;
    this.state.conversationTypes = ["publicCircleMessaging", "privateCircleMessaging", "directMessaging"];
    this.state.gettingPersonae = false;
    this.state.conversationFingerprintOrName = '';
    this.state.currentIdentityFingerprint = '';
    this.state.currentOtherPartyFingerprint = '';
    this.state.currentCircleFingerprint = '';
    this.state.activeConversationKey = '';




    if (isObjectEmpty(identities)){
       // console.log("identities is empty returning");
      return;
    }

    const {identityFingerprint, circleFingerprint, conversationFingerprint} = innerMenu;

    if(!identityFingerprint){
      return;
    }

    this.state.conversationTypes = ["publicCircleMessaging", "privateCircleMessaging", "directMessaging"];

    this.state.currentIdentityFingerprint = identityFingerprint;
    this.state.currentCircleFingerprint = circleFingerprint;
    this.state.currentOtherPartyFingerprint = conversationFingerprint;

    if(circleFingerprint && circles[circleFingerprint]){
      this.state.isAdmin = circles[circleFingerprint].admins.includes(identityFingerprint);
    }

    const conversationSummaries = identities[identityFingerprint].conversations; 
    const missingPersonaeList = this.listMissingPersonae(identityFingerprint, circleFingerprint, conversationSummaries, personae);

    if(!this.state.gettingPersonae && missingPersonaeList.length > 0){ //eslint-disable-line
      dispatch({
        type: 'identities/LOAD_PERSONAE',
        payload:{
          personaFingerprintList: missingPersonaeList,
          circleFingerprint
        }
      });
      this.state.filteredConversationList = [];
      this.state.gettingPersonae = true;
      return;
    }

    let activeConversationKey = this.getConversationKey(conversationSummaries, circleFingerprint, conversationFingerprint); //eslint-disable-line

    // activeConversationKey = this.generalizeCircleConversationKey(activeConversationKey);

    const filteredConversationList = this.generateConversationList(
      conversationSummaries,
      '', // filterString
      this.state.conversationTypes, //eslint-disable-line
      circleFingerprint,
      activeConversationKey
    );
    this.state.activeConversationKey = activeConversationKey;
    this.state.filteredConversationList = filteredConversationList;
    this.state.currentConversationName = personae[conversationFingerprint]? personae[conversationFingerprint].name: '';
  }

  UNSAFE_componentWillReceiveProps(nextProps){//eslint-disable-line
    console.log("InnerMenu willReceiveProps", this.props, nextProps);    
    const oldInnerMenu = this.props.innerMenu; //eslint-disable-line
    const {identityFingerprint, circleFingerprint, conversationFingerprint} = oldInnerMenu;

    const {dispatch, innerMenu, circles, identities, personae} = nextProps;

    const nextIdentityFingerprint = innerMenu.identityFingerprint;
    const nextCircleFingerprint = innerMenu.circleFingerprint;
    const nextConversationFingerprint = innerMenu.conversationFingerprint;


    if (isObjectEmpty(identities)){
       // console.log("identities is empty returning");
      return;
    }

    const tempState = {};

    const {conversationFingerprintOrName, currentConversationName, conversationTypes, gettingPersonae} = this.state;

    let {currentIdentityFingerprint, currentCircleFingerprint, currentOtherPartyFingerprint, activeConversationKey} = this.state;

    let sameConversationKey = false;
    if(identityFingerprint === nextIdentityFingerprint
      && circleFingerprint === nextCircleFingerprint
      && currentOtherPartyFingerprint === nextConversationFingerprint // is the controlling page changing it?
      && conversationFingerprint === currentOtherPartyFingerprint // is this innermenu changing it?
      ){
      console.log("innerMenu same conversation");
      sameConversationKey = true;
    }
    else{
      currentIdentityFingerprint = nextIdentityFingerprint;
      currentCircleFingerprint = nextCircleFingerprint;
      currentOtherPartyFingerprint = nextConversationFingerprint;
    }
    // the page isn't ready yet.
    if(!identities[currentIdentityFingerprint]){
      console.log("innerMenu no identity", identities, currentIdentityFingerprint, identityFingerprint, nextIdentityFingerprint);
      return;
    }

    // set the controls at the top of the conversationList
    if (currentCircleFingerprint && circles[currentCircleFingerprint]) {
      tempState.isAdmin = circles[currentCircleFingerprint].admins.includes(currentIdentityFingerprint);
    }

     // console.log("Social willReceiveProps working", this.props, nextProps);    

    tempState.currentIdentityFingerprint = currentIdentityFingerprint;
    tempState.currentCircleFingerprint = currentCircleFingerprint;
    tempState.currentOtherPartyFingerprint = currentOtherPartyFingerprint;
    
    const conversationSummaries = identities[currentIdentityFingerprint].conversations; //eslint-disable-line

    const missingPersonaeList = this.listMissingPersonae(currentIdentityFingerprint, currentCircleFingerprint, conversationSummaries, personae);
    // we're missing some personae, get them and try again after we have them
    if(!gettingPersonae && missingPersonaeList.length > 0){
      dispatch({
        type: 'identities/LOAD_PERSONAE',
        payload:{
          personaFingerprintList: missingPersonaeList,
          circleFingerprint: currentCircleFingerprint
        }
      });
      tempState.filteredConversationList = [];
      tempState.gettingPersonae = true;
      this.setState(tempState);
      return;
    }

    // we're missing some but we're already searching, do nothing
    if(gettingPersonae && missingPersonaeList.length > 0){
      // console.log("we're wating on some personae");
      tempState.gettingPersonae = true;
      this.setState(tempState);
      return;
    }

    // we're not missing anything don't get anything
    if (gettingPersonae && missingPersonaeList.length === 0){
      tempState.gettingPersonae = false;
       // console.log("we have all of the personae we need");
    }

    if (currentOtherPartyFingerprint){
      tempState.currentConversationName = currentConversationName || personae[currentOtherPartyFingerprint].name;

      // we have all of the personae, time to make the list, find the conversation summary we care about
      activeConversationKey = sameConversationKey ? activeConversationKey : this.getConversationKey(conversationSummaries, currentCircleFingerprint, currentOtherPartyFingerprint);

      // get the generalized circle conversation key because that's what the conversation will always be stored under.
      // this is a bit of a misnomer, if the conversationKey is for a circle it nulls the identityFilepath,
      // otherwise it leaves it alone. so we can reuse this function for identity specific conversations.
      tempState.activeConversationKey = this.generalizeCircleConversationKey(activeConversationKey);
    }

    

    // generate all of the conversation ui items
    tempState.filteredConversationList = this.generateConversationList(
      conversationSummaries,
      conversationFingerprintOrName,
      conversationTypes,
      currentCircleFingerprint,
      activeConversationKey,
      nextProps.personae
    );

    // set it and goooooo
    this.setState(tempState);
  }

  changeConversation = (e, conversationKey, newOtherPartyFingerprint, conversationName) => {
    console.log("innerMenu changeConversation");
    const { dispatch, identities } = this.props;
    const {currentIdentityFingerprint, currentCircleFingerprint, conversationFingerprintOrName} = this.state;


    // window.history.replaceState(null, "hey", "hallothar");

    // const convoLength = history.location.pathname.length - convoIndex;
    const newUrl = `#/social/identity/${currentIdentityFingerprint}/circle/${currentCircleFingerprint}/convo/${newOtherPartyFingerprint}`;
    window.history.replaceState(null, "", newUrl); // we don't use react's history for navigation because it always causes a refresh.
    // console.log("changeConversation, newUrl", newUrl);
    const activeConversationKey = this.generalizeCircleConversationKey(conversationKey);

    dispatch({
      type: 'user/SET_CURRENT_PAGE',
      payload:{
        currentPage: newUrl,
        activeConversationKey: conversationKey
      }
    });

    const {conversationTypes} = this.state;
     // console.log("changeconversation", identities);
    this.setState({
      activeConversationKey,
      currentConversationName: conversationName,
      currentOtherPartyFingerprint: newOtherPartyFingerprint,
      filteredConversationList: this.generateConversationList(
        identities[currentIdentityFingerprint].conversations,
        conversationFingerprintOrName,
        conversationTypes,
        currentCircleFingerprint,
        conversationKey
      )
    });

  };

  generateConversationList = (
    conversationSummaries,
    filterString='',
    conversationTypes,
    circleFingerprint,
    activeConversationKey,
    personae
  ) => {
    // the conversation keys should be from an identity or a circle.  any drill down or filtering on them will be by conversationType, circleFingerprint or otherPartyFingerprint
     // console.log("generateconversationlist", circleFingerprint, conversationTypes, activeConversationKey, conversationSummaries);
    const conversationList = [];
    if (!personae){
      personae = this.props.personae; // eslint-disable-line
    }
    if (!circleFingerprint){
      circleFingerprint = 'null';
    }
     // console.log("*********", activeConversationKey);

    // filter out any conversations that don't include the filter string.
    if (filterString){
      filterString = filterString.toLowerCase();
    }

    for(let key in conversationSummaries){ //eslint-disable-line
      const [, convoType ,,] = key.split('/'); // these are a conversationType and filepaths, we only need the conversationType from it.  //eslint-disable-line

      const {
        circleFingerprint: cf,//eslint-disable-line
        coreCircleFingerprint: ccf,
        otherPartyFingerprint,
        unreads, //eslint-disable-line
        lastMessageDate //eslint-disable-line
      } = conversationSummaries[key];

      if (!conversationTypes.includes(convoType) || ccf !== circleFingerprint){
         // console.log("skipping invalid convo or circle", convoType, cf, ccf, conversationTypes, circleFingerprint);
        continue; //eslint-disable-line
      }
      const op = personae[otherPartyFingerprint];
      if(!op){
        continue; //eslint-disable-line
      }
       // console.log("generateConversationList op", op)
      if (filterString && !(op.name.toLowerCase().includes(filterString) || op.fingerprint.toLowerCase().includes(filterString))) {
         // console.log("invalid name or fingerprint for filterstring", filterString);
        continue; //eslint-disable-line
      }
      
      // console.log("conversation summary");
      // console.log("allowing other persona", op);
      
      const conversationTile = 
        <a //eslint-disable-line
          onClick={e => this.changeConversation(e, key, op.fingerprint, op.name)}
          key={`social_conversation/${key}`}
          className={`${style.item} ${
            activeConversationKey &&
            activeConversationKey === key ? style.current : ''
          } d-flex flex-nowrap align-items-center`}
        >
          <div className="fel__utils__avatar fel__utils__avatar--size46 mr-3 flex-shrink-0">
            <img src={op.avatar} alt={op.name} />
          </div>
          <div className={`${style.info} flex-grow-1`}>
            <div className="text-uppercase font-size-12 text-truncate text-gray-6">
              {op.fingerprint}
            </div>
            <div className="text-dark font-size-18 font-weight-bold text-truncate">
              {op.name}
            </div>
          </div>
          <div
            hidden={unreads}
            className={`${style.unread} flex-shrink-0 align-self-start`}
          >
            <div className="badge badge-success">{unreads}</div>
          </div>
        </a>;
      conversationList.push(conversationTile);
    }

    return conversationList;
  };

  getConversationKey = (conversationSummaries, circleFingerprint, otherPartyFingerprint) => {
    for(const cKey in conversationSummaries){ //eslint-disable-line
      const convo = conversationSummaries[cKey];
      if (convo.coreCircleFingerprint === circleFingerprint && convo.otherPartyFingerprint === otherPartyFingerprint){
        return cKey;
      }
    }
    return '';
  }

  listMissingPersonae = (identityFingerprint, circleFingerprint, conversations, personae) => {
    //  console.log('SOCIAL listMissingPersonae', identityFingerprint, circleFingerprint, conversations, personae);
    const missingPersonaeFingerprints = [];
    if (!(identityFingerprint in personae)){
       // console.log("personaFingerprint not in personae adding to list", identityFingerprint, personae);
      missingPersonaeFingerprints.push(identityFingerprint);
    }
    for(const conversationKey in conversations){ // eslint-disable-line
      const {coreCircleFingerprint: ccfp, circleFingerprint: cfp, otherPartyFingerprint, personaFingerprint} = conversations[conversationKey];
       // console.log("SOCIAL", cfp, circleFingerprint)
      if (ccfp !== circleFingerprint){
        continue; //eslint-disable-line
      }
      if (!(cfp in personae)){
        missingPersonaeFingerprints.push(cfp);
      }
      if (!(otherPartyFingerprint in personae)){
         // console.log("otherPartyFingerprint not in personae adding to list", otherPartyFingerprint, personae);
        missingPersonaeFingerprints.push(otherPartyFingerprint);
      }
      if (!(personaFingerprint in personae)){
         // console.log("personaFingerprint not in personae adding to list", personaFingerprint, personae);
        missingPersonaeFingerprints.push(personaFingerprint);
      }
    }
    
     // console.log("SOCIAL listMissingPersonae", missingPersonaeFingerprints);
    return missingPersonaeFingerprints;
  };

  conversationFingerprintChange = (target, inFingerprintOrName, creating) => {
    const {identities} = this.props;
    const {currentIdentityFingerprint, currentCircleFingerprint, conversationTypes, activeConversationKey} = this.state;

    let newState = {};

    // this is the input box for creating a new conversation
    if (creating){
      newState.newConversationName = inFingerprintOrName;
    }
    else{
      newState = {
        conversationFingerprintOrName: inFingerprintOrName,
        filteredConversationList: this.generateConversationList(
          identities[currentIdentityFingerprint].conversations,
          inFingerprintOrName,
          conversationTypes,
          currentCircleFingerprint,
          activeConversationKey
        )
      };
    }

    // set the new state
    this.setState(newState);
  };


  startConversation = (conversationType) => {

    const {conversationFingerprintOrName, newConversationName, currentIdentityFingerprint, currentCircleFingerprint} = this.state;
    const {dispatch} = this.props;
    const location = document.location.hash; //eslint-disable-line
    if (currentCircleFingerprint && newConversationName.length === 0){
      this.setState({
        createInputVibrate: true
      });
      this.wait(300).then(() => {
        this.setState({
          createInputVibrate: false
        });
      });

      return;
    }

    dispatch({
      type: currentCircleFingerprint ? 'circles/CREATE_CONVERSATION': 'identities/CREATE_CONVERSATION',
      payload:{
        identityFingerprint: currentIdentityFingerprint,
        circleFingerprint: currentCircleFingerprint,
        otherPartyFingerprint: currentCircleFingerprint? newConversationName : conversationFingerprintOrName, // this will be used as the conversation name if we're in the circle social page
        conversationType
      }
    });
    const newState = {
      conversationModalOpen: false
    };
    if(currentCircleFingerprint){
      newState.newConversationName = '';
    }

    this.setState(newState);
  };

  showConversationCreationModal = () => {
    const {conversationModalOpen} = this.state; //eslint-disable-line
    this.setState({
      conversationModalOpen: true
    });
  };

  handleOk = (e) => {//eslint-disable-line
    this.setState({
      conversationModalOpen: false,
    });
  }

  handleCancel = (e) => {//eslint-disable-line
    this.setState({
      conversationModalOpen: false,
    });
  }

  buttonVibrate = (buttonName) => {

    // e.target.classList.add('Vibrate');
     // console.log("buttonvibrating", buttonName);
    const stateUpdate = {};
    stateUpdate[`${buttonName}Vibrate`] = true;
    this.setState(stateUpdate);
    this.wait(500).then(() => {
      stateUpdate[`${buttonName}Vibrate`] = false;
       // console.log("no more vibrate", stateUpdate);
      this.setState(stateUpdate);
    });
  };

  wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


  generalizeCircleConversationKey = (conversationKey) => {
     // console.log("Social - generalizingConversationKey", conversationKey);
    if (!conversationKey){
       // console.log("Social - generalizingConversationKey key doesn't exist");
      return conversationKey;
    }
    const conversationKeySplit = conversationKey.split('/');
    if (conversationKeySplit[2] !== 'null'){
      conversationKeySplit[0] = 'null';
      conversationKey = conversationKeySplit.join('/');
    }

     // console.log("Social - generalizingConversationKey returning the new one", conversationKey);
    return conversationKey;
  }

  collapseMenu = () => {
    const {settings} = this.props;
    const {isSearchFocused} = this.state;
    if(settings.isMobileView){
      return;
    }
    const tempState = {
      isMenuActive: false
    };

    if(!isSearchFocused){
      tempState.menuCollapsed = true;
    }

    this.setState(tempState);
  }
  
  uncollapseMenu = () => {
    const {settings} = this.props;
    if(settings.isMobileView){
      return;
    }
    this.setState({
      menuCollapsed: false,
      isMenuActive: true
    });
  }

  toggleMobileMenu = () => {
    const {menuCollapsed} = this.state;
    this.setState({
      menuCollapsed: !menuCollapsed
    });
  }

  focusSearch = () => {
    this.setState({
      isSearchFocused: true
    });
  }
  
  blurSearch = () => {
    const {isMenuActive} = this.state;
    const tempState = {
      isSearchFocused: false
    };

    if(!isMenuActive){
      tempState.menuCollapsed = true;
    }
    this.setState(tempState);
  }

  render() {
    const {
      currentCircleFingerprint,
      filteredConversationList,
      createInputVibrate,
      conversationModalOpen,
      privateButtonVibrate,
      newConversationName,
      menuCollapsed,
      isAdmin,
    } = this.state;
    const {settings: {isMenuCollapsed, isMobileMenuOpen, isMobileView}} = this.props;

    const identitySocial = !currentCircleFingerprint;
    const showCreateButton = isAdmin && !menuCollapsed;
    // console.log("SHOWCREATEBUTTON", menuCollapsed, menuWidth, isMobileView, isMenuCollapsed);

    return (
      <Sider
        className={classNames(style.noTransition,{
          [style.beneath]: conversationModalOpen,
          [style.innerSideBar__near]: isMenuCollapsed && !isMobileView,
          [style.innerSideBar__far]: !isMenuCollapsed && !isMobileView,
          [style.innerSideBar__hidden]: menuCollapsed && isMobileView,
          [style.innerSideBar__compact]: !menuCollapsed && isMobileView
        })}
        collapsible
        collapsed={menuCollapsed}
        width={isMobileView? '420px': '450px'}
        collapsedWidth='65px'
        trigger={null}
        onMouseEnter={() => {this.uncollapseMenu()}}
        onMouseLeave={() => {this.collapseMenu()}}
      >
        <div className={classNames(style.noTransition,{
          [style.beneath]: conversationModalOpen,
          [style.innerSideBar__near__container]: menuCollapsed && !isMobileView,
          [style.innerSideBar__far__container]: !menuCollapsed && !isMobileView,
          [style.innerSideBar__hidden__container]: menuCollapsed && isMobileView,
          [style.innerSideBar__compact__container]: !menuCollapsed && isMobileView
        })}>
          <Title level={3} className={menuCollapsed? style.title__collapsed: style.title}>Conversations</Title>
          <Modal
            key="conversation_creation_modal"
            title="Create a circle conversation"
            visible={conversationModalOpen}
            className={style.overlayModal}
            centered
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            footer={[
              <Button
                key="conversation_creation_modal_cancel"
                className={style.closeConversationButton}
                onClick={() => {this.handleCancel()}}
              >
                Cancel
              </Button>,
              <Tooltip
                key="conversation_creation_modal_private_tooltip"
                trigger="click"
                placement="bottom"
                title="This feature isn't ready yet."
              >
                {/* onClick={() => {this.startConversation("privateCircleMessaging")} */}
                <Button
                  key="conversation_creation_modal_private"
                  className={`${privateButtonVibrate? style.buttonVibrate : ""} ${style.privateConversationButton} `}
                  onClick={() => {this.buttonVibrate("privateButton")}}
                >
                  Private
                </Button>
              </Tooltip>,
              <Button
                key="conversation_creation_modal_public"
                className={style.publicConversationButton}
                onClick={() => {this.startConversation(identitySocial? "directMessaging" : "publicCircleMessaging")}}
              >
                Public
              </Button>
            ]}
          >
            <Input
              className={createInputVibrate? style.conversationInputVibrate : style.conversationInput}
              prefix={<i className={`fe fe-user-plus ${style.conversationIcon}`} />}
              placeholder=" Conversation name..."
              value={newConversationName}
              onChange={(input) => this.conversationFingerprintChange(input.target, input.target.value, true)}
              onPressEnter={() =>  this.startConversation(identitySocial? "directMessaging" : "publicCircleMessaging")}
            />
            {/* this needs to be integrated" onClick={() => this.startConversation("directMessaging")} */}

          </Modal>
          <a
            href="javascript: void(0);"
            aria-label="toggle mobile menu"
            className={classNames({
              [style.mobileToggleButton__near]: menuCollapsed && isMobileView && !isMobileMenuOpen,
              [style.mobileToggleButton__far]: !menuCollapsed && isMobileView && !isMobileMenuOpen,
              [style.mobileToggleButton__hidden]: !isMobileView || isMobileMenuOpen
            })}
            onClick={this.toggleMobileMenu}
          >
            <span />
          </a>
          <a //eslint-disable-line
            href="javascript: void(0);"
            className={classNames({
              [style.mobileMenuBackdrop__hidden]: menuCollapsed && isMobileView,
              [style.mobileMenuBackdrop]: !menuCollapsed && isMobileView
            })}
            onClick={this.toggleMobileMenu}
          />
          <div className={`${style.inputBox} mb-4 d-flex flex-nowrap`}>
            <Input
              className={`${style.conversationInput}`}
              prefix={<i className="fa fa-search" style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder={currentCircleFingerprint ? " Conversation name..." : " Conversation name or fingerprint..."}
              onChange={(input) => this.conversationFingerprintChange(input.target, input.target.value, false)}
              onFocus={() => {this.focusSearch();}}
              onBlur={() => {this.blurSearch();}}
            />
            {showCreateButton ?
              <Button
                className={style.conversationButton}
                onClick={(e) => {e.target.blur(); this.showConversationCreationModal(); }}
              >
                Create
              </Button> 
              : ''
            }
          </div>
          <div className={style.dialogs}>
            <Scrollbars
              autoHide
              autoHeight
              autoHeightMin="100%"
              autoHeightMax="100%"
              renderTrackHorizontal={props => (
                <div 
                  {...props} //eslint-disable-line
                  className="track-horizontal"
                  style={{
                    display: 'none'
                  }}
                />
              )}
              renderView={props => (
                <div
                  {...props} //eslint-disable-line
                  className="view"
                  style={{
                    oveflowX: 'hidden'
                  }}
                />
              )}
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
              {filteredConversationList}
            </Scrollbars>
          </div>
        </div>
      </Sider>
    )
  }
}

export default InnerMenuLeft
