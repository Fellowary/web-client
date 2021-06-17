import React from 'react'
import { connect } from 'react-redux'
import { Button, Tooltip } from 'antd'
// import { Scrollbars } from 'react-custom-scrollbars'
import Messaging from 'components/widgets/Messaging'
import {isObjectEmpty} from 'utilities'

import style from './style.module.scss'

@connect (({ dispatch, user, identities, circles, personae }) => ({ dispatch, user, identities, circles, personae }))
class SocialDashboard extends React.Component {

  constructor(props){
    super(props);
    console.log("social constructor", this.props);

    const {dispatch, user, circles, identities, personae} = this.props;
    
    // default the pathName
    let pathName = window.location.hash; // why is this fully lowercase?
    if (pathName === "#/social"){
      // console.log("social constructor pathname and user currentPage", pathName, user, pathName === user.currentPage);
      pathName = user.currentPage; // user currentPage should always exist.
      window.history.replaceState(null, '', pathName);
    }

    if (isObjectEmpty(identities)){
       // console.log("identities is empty returning");
      return;
    }

    // console.log("social constructor pathname", window.location.hash);

    // 
    const {
      parsedIdentityFingerprint,
      parsedCircleFingerprint,
      parsedConversationFingerprint //eslint-disable-line
    } = this.parseCurrentIdentityCircleConvo(identities, circles, personae);

    this.state.currentIdentityFingerprint = parsedIdentityFingerprint;
    this.state.currentCircleFingerprint = parsedCircleFingerprint;
    this.state.currentOtherPartyFingerprint = parsedConversationFingerprint;

    dispatch({
      type: 'innerMenu/SET_STATE',
      payload:{
        identityFingerprint: parsedIdentityFingerprint,
        circleFingerprint: parsedCircleFingerprint,
        conversationFingerprint: parsedConversationFingerprint
      }
    });

    if(this.state.currentCircleFingerprint && circles[this.state.currentCircleFingerprint]){//eslint-disable-line
      this.state.isAdmin = circles[this.state.currentCircleFingerprint].admins.includes(this.state.currentIdentityFingerprint);//eslint-disable-line
    }

    const conversationSummaries = identities[this.state.currentIdentityFingerprint].conversations;//eslint-disable-line
    const activeConversationKey = this.getConversationKey(conversationSummaries, this.state.currentCircleFingerprint, this.state.currentOtherPartyFingerprint);//eslint-disable-line
    this.state.activeConversationKey = activeConversationKey; // this.generalizeCircleConversationKey(activeConversationKey);//eslint-disable-line

    console.log("social constructor activeconversationkey", this.state.activeConversationKey); //eslint-disable-line
    this.state.currentConversationName = personae[this.state.currentOtherPartyFingerprint]? personae[this.state.currentOtherPartyFingerprint].name: "A bit quiet here, eh?"; //eslint-disable-line
  }

  state = {
    currentIdentityFingerprint: '',
    currentOtherPartyFingerprint: '',
    currentCircleFingerprint: '',
    importantButtonVibrate: false,
    activeConversationKey: '',
  }

  UNSAFE_componentWillReceiveProps(nextProps){//eslint-disable-line
    console.log("Social willReceiveProps", this.props, nextProps);    

    const {dispatch, user, identities, circles, personae} = nextProps;

    // default the pathName
    let pathName = window.location.hash; // why is this fully lowercase?
    if (pathName === "#/social"){
      pathName = user.currentPage; // user currentPage should always exist.
      window.history.replaceState(null, '', pathName);
    }

    if (isObjectEmpty(identities)){
       // console.log("identities is empty returning");
      return;
    }

    const tempState = {};
    const {currentIdentityFingerprint, currentCircleFingerprint, currentOtherPartyFingerprint} = this.state;
    tempState.currentIdentityFingerprint = currentIdentityFingerprint;
    tempState.currentCircleFingerprint = currentCircleFingerprint;
    tempState.currentOtherPartyFingerprint = currentOtherPartyFingerprint;
    const {
      parsedIdentityFingerprint,
      parsedCircleFingerprint,
      parsedConversationFingerprint //eslint-disable-line
    } = this.parseCurrentIdentityCircleConvo(identities, circles, personae);

    console.log("dispatching innerMenu", parsedIdentityFingerprint, parsedCircleFingerprint, parsedConversationFingerprint);
    dispatch({
      type: 'innerMenu/SET_STATE',
      payload:{
        identityFingerprint: parsedIdentityFingerprint,
        circleFingerprint: parsedCircleFingerprint,
        conversationFingerprint: parsedConversationFingerprint
      }
    });


    if(currentIdentityFingerprint !== parsedIdentityFingerprint
      || currentCircleFingerprint !== parsedCircleFingerprint
      || currentOtherPartyFingerprint !== parsedConversationFingerprint){

      tempState.currentIdentityFingerprint = parsedIdentityFingerprint;
      tempState.currentCircleFingerprint = parsedCircleFingerprint;
      tempState.currentOtherPartyFingerprint = parsedConversationFingerprint;

      console.log(`Social setting tempState fingerprints `, tempState);
    }

    if(personae[tempState.currentOtherPartyFingerprint]){
      tempState.currentConversationName = personae[tempState.currentOtherPartyFingerprint]? personae[tempState.currentOtherPartyFingerprint].name : 'A bit quiet here, eh?';
    }

    const conversationSummaries = identities[tempState.currentIdentityFingerprint].conversations;
    const activeConversationKey = this.getConversationKey(conversationSummaries, tempState.currentCircleFingerprint, tempState.currentOtherPartyFingerprint);
    tempState.activeConversationKey = activeConversationKey; // this.generalizeCircleConversationKey(activeConversationKey);
    // tempState.currentConversationName = currentConversationName || personae[currentOtherPartyFingerprint].name;

    // set it and goooooo
    this.setState(tempState);
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

  getChatLink = () => {
    const {dispatch} = this.props;
    const {activeConversationKey} = this.state;
    if (!activeConversationKey){
      return;
    }
    dispatch({
      type: 'circles/GET_CONVERSATION_LINK',
      payload:{
        conversationKey: activeConversationKey
      }
    });
  }

  deleteConversation = () => {
    const {dispatch, identities} = this.props;
    const {currentConversationName, activeConversationKey, currentIdentityFingerprint, currentCircleFingerprint, currentOtherPartyFingerprint} = this.state;

    if(!activeConversationKey){
      return;
    }
    const identity = identities[currentIdentityFingerprint];
    let redirectionPath = `/social/identity/${currentIdentityFingerprint}${currentCircleFingerprint? `/circle/${currentCircleFingerprint}`:``}`;
    
    for(let c in identity.conversations){ //eslint-disable-line
      if(c !== activeConversationKey && currentCircleFingerprint === identity.conversations[c].coreCircleFingerprint){
        redirectionPath += `/convo/${identity.conversations[c].otherPartyFingerprint}`;
        break;
      }
    }

    dispatch({
      type: 'identities/DELETE_CONVERSATION',
      payload:{
        conversationName: currentConversationName,
        conversationFingerprint: currentOtherPartyFingerprint,
        conversationKey: activeConversationKey,
        redirectionPath
      }
    });

  }

  wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


  parseCurrentIdentityCircleConvo = (inIdentities, inCircles, inPersonae) => {
    const {user} = this.props;
    let {identities, circles, personae} = this.props;

    if (inIdentities){identities = inIdentities;}
    if (inCircles){circles = inCircles;}
    if (inPersonae){personae = inPersonae;}

    const location = window.location.hash; // eslint-disable-line
    const pathSections = location.split('/');
    let parsedIdentityFingerprint = pathSections[pathSections.indexOf('identity')+1];

    // if there is no identityFingerprint we're just going to default to the primary for everything.
    if (parsedIdentityFingerprint === '#'){
      return {parsedIdentityFingerprint: user.primaryIdentity.fingerprint, parsedCircleFingerprint: user.primaryCircle.fingerprint};
    }
    
    parsedIdentityFingerprint = identities[parsedIdentityFingerprint] && identities[parsedIdentityFingerprint].fingerprint || user.primaryIdentity.fingerprint;


    // on the next two blocks
    // the reason we use the octothorpe for the comparison is because that's the beginning of the document.location.hash.

    let parsedCircleFingerprint = pathSections[pathSections.indexOf('circle')+1];
    console.log("parsedcirclefingerprint", parsedCircleFingerprint);
    parsedCircleFingerprint = parsedCircleFingerprint === '#' ? null : circles[parsedCircleFingerprint]?.fingerprint;


    let parsedConversationFingerprint = pathSections[pathSections.indexOf('convo')+1];
    if(parsedConversationFingerprint !== '#' && personae[parsedConversationFingerprint]){
      parsedConversationFingerprint = personae[parsedConversationFingerprint].fingerprint;
    }
    else{
      parsedConversationFingerprint = null;
    }
 
    // parsedCircleFingerprint can be null here, identity is always set
    return {parsedIdentityFingerprint, parsedCircleFingerprint, parsedConversationFingerprint};
  }

  getConversationKey = (conversationSummaries, circleFingerprint, otherPartyFingerprint) => {
    for(const cKey in conversationSummaries){ //eslint-disable-line
      const convo = conversationSummaries[cKey];
      if (convo.coreCircleFingerprint === circleFingerprint && convo.otherPartyFingerprint === otherPartyFingerprint){
        return cKey;
      }
    }
    return '';
  }

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

  render() {
    const {
      activeConversationKey,
      currentConversationName,
      currentIdentityFingerprint,
      currentOtherPartyFingerprint,
      importantButtonVibrate
    } = this.state;
    console.log("RENDER");

    return (
      <div className={`card ${style.messageCard}`}>
        <div className="card-header card-header-flex align-items-center">
          <div className="d-flex flex-column justify-content-center mr-auto">
            <h5 className="mb-0 mr-2 font-size-18">
              {currentConversationName} {currentOtherPartyFingerprint? <span className="font-size-14 text-gray-6">({currentOtherPartyFingerprint})</span>:''}
            </h5>
          </div>
          <div>
            <Tooltip placement="top" title="Copy Chat Link">
              <Button 
                className="btn btn-sm btn-info mr-2"
                onClick={() => {this.getChatLink();}}
              >
                <i className="fa fa-chain right-pad" />
              </Button>
            </Tooltip>
            <Tooltip
              key="conversation_mark_tooltip"
              visible={importantButtonVibrate}
              placement="bottom"
              title="This feature isn't ready yet."
            >
              <Button
                className={`${importantButtonVibrate ? style.buttonVibrate : ""}  "btn btn-sm btn-light mr-2"`}
                onClick={() => {this.buttonVibrate("importantButton"); }}
              >
                <i className="fe fe-star right-pad" />
              </Button>
            </Tooltip>

            <Button
              className={`${style.deleteButton}  "btn btn-sm btn-light"`}
              onClick={() => {this.deleteConversation();}}
            >
              <i className="fe fe-trash right-pad" />
            </Button>
          </div>
        </div>
        <div className={style.cardBody}>
          <Messaging
            currentIdentityFingerprint={currentIdentityFingerprint}
            conversationKey={activeConversationKey}
          />
        </div>
      </div>
    )
  }
}

export default SocialDashboard;
