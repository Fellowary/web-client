import React from 'react'
import {Input, Button, Statistic} from 'antd';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars'
import style from './style.module.scss'

const {Countdown} = Statistic;

@connect(({user, identities, circles, personae, messages}) => ({user, identities, circles, personae, messages}))
class Messaging extends React.Component {

  constructor(props){
    super(props);
    this.scrollBars = React.createRef();

    const {dispatch, user, messages, personae, conversationKey, currentIdentityFingerprint} = this.props;
    console.log("Messaging constructor", conversationKey, currentIdentityFingerprint, this.props);

    if(user?.serverState){
      if(user.serverState.status === 'throttled'){
        this.state.throttled = true;
        this.state.forbidden = false;
        console.log("SERVERSTATE:", user.serverState, "2021-05-24T23:20:51Z");
        this.state.denialBar = this.getDenialBar(user.serverState.status, user.serverState.endTime);
      }
      else if(user.serverState.status === 'forbidden'){
        this.state.forbidden = true;
        this.state.throttled = false;
        this.state.denialBar = this.getDenialBar(user.serverState.status, user.serverState.conversation);
      }
      else{
        this.state.throttled = false;
        this.state.forbidden = false;
      }
    }

    const generalizedConversationKey = this.generalizeCircleConversationKey(conversationKey);

    console.log("Messaging receiveprops", generalizedConversationKey);
    // console.log("dispatching identities/LOAD_MESSAGES", nextProps.conversationKey);
  
    // the conversation is different that what we had before, change the active conversation on the backend
    dispatch({
      type: 'identities/CHANGE_ACTIVE_CONVERSATION',
      payload:{
        inactiveConversationKey: '',
        activeConversationKey: generalizedConversationKey
      }
    });

    if(generalizedConversationKey){
      // load the conversations messages
      dispatch({
        type: 'identities/LOAD_MESSAGES',
        payload:{
          conversationKey: generalizedConversationKey,
          tense: 'present'
        }
      });
    }
    this.state.conversationKey = generalizedConversationKey;
    this.state.render = false;
    
    if(messages && messages[generalizedConversationKey]) {
      // console.log("about to createMessageItems");
      // The conversationKey is the same so we should be receiving messages.  Assemble them.
      const {
        tempMessageItems: messageItems,
        missingPersonae,
        cf: circleFingerprint,
        newMessagePosition //eslint-disable-line
      } = this.createMessageItems(messages[generalizedConversationKey].messages, personae);
      // console.log("messaging receivingProps, after createmessageItems", newMessagePosition);
      this.state.messageItems = messageItems;
      this.state.render = true;
      if(missingPersonae.length > 0){
        this.getMissingPersonae(missingPersonae, circleFingerprint);
        this.state.gettingPersonae = true;
      }
      else if(missingPersonae.length === 0){
        this.state.gettingPersonae = false;
      }
    }
  }

  state = {
    render: true,
    gettingPersonae: false,
    messageItems: [],
    outgoingMessage: '',
    currentMessageSignature: '',
    currentMessagePosition: '',
    scrollTop: 0.0,
    hitBottom: false,
    tryToAdjustScrollBar: false,
    throttled: false,
    forbidden: false
  }

  UNSAFE_componentWillReceiveProps(nextProps){ //eslint-disable-line
    const {dispatch, conversationKey, currentIdentityFingerprint} = this.props;
    console.log("Messaging componentWillReceiveProps", conversationKey, currentIdentityFingerprint, this.props, nextProps);
    const {gettingPersonae, currentMessagePosition} = this.state;
    const {user} = nextProps;

    const tempState = {};

    // tempState.denialBar = this.getDenialBar('throttled', "2021-05-24T23:20:51Z");

    if(user?.serverState){
      if(user.serverState.status === 'throttled'){
        tempState.throttled = true;
        tempState.forbidden = false;
        console.log("SERVERSTATE:", user.serverState, "2021-05-24T23:20:51Z");
        tempState.denialBar = this.getDenialBar(user.serverState.status, user.serverState.endTime);
      }
      else if(user.serverState.status === 'forbidden'){
        tempState.forbidden = true;
        tempState.throttled = false;
        tempState.denialBar = this.getDenialBar(user.serverState.status, user.serverState.conversation);
      }
      else{
        tempState.throttled = false;
        tempState.forbidden = false;
      }
    }

    const generalizedConversationKey = this.generalizeCircleConversationKey(nextProps.conversationKey);

    console.log("Messaging receiveprops", generalizedConversationKey);
    if (conversationKey !== nextProps.conversationKey){
      // console.log("dispatching identities/LOAD_MESSAGES", nextProps.conversationKey);
    
      // the conversation is different that what we had before, change the active conversation on the backend
      dispatch({
        type: 'identities/CHANGE_ACTIVE_CONVERSATION',
        payload:{
          inactiveConversationKey: conversationKey,
          activeConversationKey: generalizedConversationKey
        }
      });
      if(generalizedConversationKey){
        // load the conversations messages
        dispatch({
          type: 'identities/LOAD_MESSAGES',
          payload:{
            conversationKey: generalizedConversationKey,
            tense: 'present'
          }
        });
      }
      tempState.conversationKey = generalizedConversationKey;
      tempState.render = false;
    }
    else if(nextProps.messages && nextProps.messages[generalizedConversationKey]) {
      // console.log("about to createMessageItems");
      // The conversationKey is the same so we should be receiving messages.  Assemble them.
      const {
        tempMessageItems: messageItems,
        missingPersonae,
        cf: circleFingerprint,
        newMessagePosition
      } = this.createMessageItems(nextProps.messages[generalizedConversationKey].messages, nextProps.personae);
      // console.log("messaging receivingProps, after createmessageItems", newMessagePosition);
      tempState.messageItems = messageItems;
      tempState.render = true;
      if(!gettingPersonae && missingPersonae.length > 0){
        this.getMissingPersonae(missingPersonae, circleFingerprint);
        tempState.gettingPersonae = true;
      }
      else if(gettingPersonae && missingPersonae.length > 0){
        // we're already looking.
      }
      else if(gettingPersonae && missingPersonae.length === 0){
        tempState.gettingPersonae = false;
      }

      // if the last message that we've gotten is the same as the previous last message that we've gotten
      // then we're not moving and we should pin the scrollbar to the bottom
      if (newMessagePosition){
        // console.log("messaging receivingProps, newMessagePosition");
        if(currentMessagePosition !== newMessagePosition){
          // console.log("messaging receivingProps, currentMessagePosition !== newMessagePosition");
          tempState.tryToAdjustScrollBar = true;
        }

        tempState.newMessagePosition = newMessagePosition;
        // if(hitBottom && currentMessagePosition === newMessagePosition){
        //   // console.log("sticking to bottom");
        //   tempState.stickToBottom = true;
        // }
        // else{
        //   // console.log("not sticking to bottom", this.scrollBars.current.getValues().top);
        // }
      }
    }


    this.setState(tempState);
  }

  shouldComponentUpdate(nextProps, nextState){
    // SHOULD UPDATE MESSAGING
    // // console.log("should update Messaging:", nextState.render);
    return nextState.render;
  }

  componentDidUpdate(){
    const {messages} = this.props;
    const {conversationKey} = this.state;
    const {currentMessagePosition, newMessagePosition, hitBottom, tryToAdjustScrollBar} = this.state;
    const values = this.scrollBars.current.getValues();
    if(!conversationKey){
      console.log("didUpdate no conversationKey returning");
      return;
    }
    console.log(`didUpdate ingestType ${messages[conversationKey].ingestType} hitBottom: ${hitBottom}`);

    // keep the scrollbar on the bottom
    if(messages[conversationKey].ingestType === 'push' && hitBottom){
      console.log("scrolling to bottom");
      this.scrollBars.current.scrollToBottom();
    }
    // keep the scrollbar on the same messages
    else if (tryToAdjustScrollBar){
      const messagesLength = messages[conversationKey].messages.length;
      console.log("messagepositions", currentMessagePosition, newMessagePosition);
      const adjustment = newMessagePosition < currentMessagePosition? -5 : -1;
      this.scrollBars.current.scrollTop(Math.round(values.scrollHeight*((newMessagePosition+adjustment)/messagesLength)));
      console.log("adjusting scrollbar to ", Math.round(values.scrollHeight*((newMessagePosition+adjustment)/messagesLength)), newMessagePosition);
      this.setState({ // eslint-disable-line
        tryToAdjustScrollBar: false,
      });
    }


    // if(scrolledUp){
    //   const {messages, conversationKey} = this.props;
    //   // make sure we actually have messages before we try
    //   if (messages && messages[conversationKey] && messages[conversationKey].messages.length > 0 && currentMessageSignature !== ''){
    //     console.log("handleScrollBarUpdate, met requirements", messages[conversationKey].messages, currentMessageSignature);
    //     const messagesLength = messages[conversationKey].messages.length;
    //     for(let i=0;i < messages[conversationKey].messages.length; ++i){ //eslint-disable-line
    //       if( messages[conversationKey].messages[i].signature === currentMessageSignature) {
    //         console.log(`scrollHeight: ${values.scrollHeight}, position: ${Math.floor(values.scrollHeight*(i/messagesLength))}, i/count: ${i}/${messagesLength}`)
    //         this.scrollBars.current.scrollTop(Math.floor(values.scrollHeight*(i/messagesLength)));
    //         break;
    //      }
    //     }
    //   }
    // }


    window.scrolly = this.scrollBars.current;
  }

  getDenialBar = (serverStatus, info) => {
    let denialBar;
    if(serverStatus === 'throttled'){

      const endTime =  new Date(info); // info will be a JSON format date or a utc milliseconds epoch timestamp
      const now = Date.now();
      denialBar = (
        <div className={style.denialBar}>
          <span>SlowMode.</span>
          <Countdown
            value={endTime.getTime()} 
            valueStyle={{
              color: '#d4d8e0',
              paddingLeft: '10px',
              alignContent: 'center',
              fontSize: '21px'
            }}
            format=" ss:SSS"
          />
        </div>
      );
      const duration = endTime.getTime() - now;
      
      // clear it after the duration is up
      this.wait(duration).then(() => {

        this.setState({
          throttled: false
        });
      });
      
    }
    if(serverStatus === 'forbidden'){
      denialBar = <div className={style.denialBar}>You cannot talk here...</div>;
    }

    return denialBar;
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

  createMessageItems = (messages, personae) => {
    const {currentIdentityFingerprint} = this.props;
    const {currentMessageSignature, conversationKey} = this.state;

    const [, , cf, ] = conversationKey.split('/'); //eslint-disable-line
    let missingPersonae = {};
    const tempMessageItems = [];
    const placeholderPersona = {
      avatar: '/images/avatars/colorful-placeholder.png',
      name: "loading...",
    };

    // console.log("createMessageItems, messages", messages);
    let i=0;
    let newMessagePosition = null;
    // we are prepending
    for(let message of messages){ // eslint-disable-line
      // const message = messages[i];
      let messageDate;
      if(message.networkReceivedDate){
        messageDate = (new Date(message.networkReceivedDate)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      }
      else if(message.receivedDate) {
        messageDate = (new Date(message.receivedDate)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      }
      else{
        messageDate = (new Date(message.signedDate)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      }
      if (currentMessageSignature === message.signature){
        newMessagePosition = i;
      }
      const key = `${conversationKey}/${message.signature}`;
      if (message.status.includes('sent')){ // this needs to be put in the backend.  just set a bool for comparison here instead.
        let persona = personae[currentIdentityFingerprint];
        if (!persona){
          missingPersonae[currentIdentityFingerprint] = true;
          persona = placeholderPersona;
        }
        // this is our message
        tempMessageItems.push(
          <div key={key} className={`${style.message} ${style.answer}`}>
            <div className={style.messageContent}>
              <div className="text-gray-4 font-size-12">You, {messageDate}</div>
              <div>{message.message}</div>
            </div>
            <div className={`${style.messageAvatar} fel__utils__avatar`}>
              <img src={persona.avatar} alt={persona.name} />
            </div>
          </div>
        );
      }
      else{
        // this is someone else's message
        let persona = personae[message.personaFingerprint];
        if(!persona){
          missingPersonae[message.personaFingerprint] = true;
          persona = placeholderPersona;
        }
        tempMessageItems.push(
          <div key={key} className={`${style.message} ${style.answer}`}>
            <div className={style.messageContent}>
              <div className="text-gray-4 font-size-12">{persona.name}, {messageDate}</div>
              <div>{message.message}</div>
            </div>
            <div className={`${style.messageAvatar} fel__utils__avatar`}>
              <img src={persona.avatar} alt={persona.name} />
            </div>
          </div>
        );
      }
      i++; //eslint-disable-line
    }

    missingPersonae = Object.keys(missingPersonae);
    return {tempMessageItems, missingPersonae, cf, newMessagePosition};
  };

  getMissingPersonae = (missingPersonaeList, cf) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'identities/LOAD_PERSONAE',
      payload:{
        personaFingerprintList: missingPersonaeList,
        circleFingerprint: cf === 'null'? null : cf
      }
    });
  }

  
  sendMessage = (e) => { //eslint-disable-line
    const { user: {connection}, conversationKey, dispatch } = this.props;
    const {outgoingMessage, throttled, forbidden} = this.state;
    // console.log("sendMessage e.target.value", e.target.value);

    // console.log("sendmessage UI outgoing message", outgoingMessage);
    if (connection === "closed" || throttled || forbidden){
      console.log("connection is closed, can't send messages");
      return;
    }

    if (!outgoingMessage || typeof outgoingMessage !== 'string' || outgoingMessage.length <= 0){
      // console.error("outgoing message not good", outgoingMessage);
      return;
    }

    // console.log("sendMessage UI", outgoingMessage, conversationKey);

    dispatch({
      type: 'identities/SEND_MESSAGE',
      payload:{
        conversationKey,
        message: outgoingMessage
      }
    });

    this.setState({
      outgoingMessage: '',
    });
  };

  inputChange = ({ target }) => {
    const {value} = target;
    // console.log("inputChange", value, target);
    this.setState({
      outgoingMessage: value,
    });
  }


  handleScrollStart = () => {
    const values = this.scrollBars.current.getValues();
    // console.log("handleScrollStart", values);
    this.setState({ //eslint-disable-line
      scrollTop: values.top
    });
  }

  handleScrollStop = () => {
    const values = this.scrollBars.current.getValues();
    const {messages, dispatch} = this.props;
    const {scrollTop, conversationKey} = this.state;
    // const messageCount = messages[conversationKey].messages.length;

    const messageIndex = Math.min(Math.round((messages[conversationKey].messages.length - 1) * values.top), messages[conversationKey].messages.length - 1);
    const currentMessage = messages[conversationKey].messages[messageIndex];
    console.log(`scrollstop conversationKey: ${conversationKey}, messageIndex: ${messageIndex}`, messages);
    //  console.log("ScrollStop currentMessage, message count, and values", this, currentMessage.message, messageCount, values);
    // console.log(`ScrollStop currentMessage: ${currentMessage.message}, signature: ${currentMessage.signature} index: ${messageIndex}`);
    // console.log(`ScrollStop value.top: ${values.top}`);

    const tempState = {
      currentMessageSignature: currentMessage?.signature,
      currentMessagePosition: messageIndex,
    };
    // scrolled down, get more messages from the head
    console.log(`values.top ${values.top}, scrollTop: ${scrollTop}`);
    if(values.top >= .95){
      dispatch({
        type: 'identities/LOAD_MESSAGES',
        payload:{
          conversationKey,
          tense: 'future'
        }
      });

      // hit the bottom, this make sure that we 
      // if(values.top === 1){
      // console.log("hit bottom");
      tempState.hitBottom = true;
      // }
    }
    // scrolled up
    else if (values.top < scrollTop){
      // get more messages from the tail
      if(values.top < 0.4){
        dispatch({
          type: 'identities/LOAD_MESSAGES',
          payload:{
            conversationKey,
            tense: 'past'
          }
        });
      }
      tempState.hitBottom = false;
    }


    this.setState(tempState);
  }

  getInputBar = (connected, blocked, outgoingMessage) => {
    return (
      <>
        <Input
          type="text"
          className={blocked? `form-control ${style.hidden}` :"form-control"}
          disabled={!connected}
          placeholder={connected ? "Send a message..." : "Not connected"}
          value={outgoingMessage}
          onChange={this.inputChange}
          onPressEnter={this.sendMessage}
        />
        <div className="input-group-append">
          <Button className={`btn btn-primary ${style.inputButton} ${blocked? style.hidden: ''}`} type="button" onClick={this.sendMessage}>
            <i className="fe fe-send align-middle" />
          </Button>
        </div>
      </>
    );
  };

  getDBar = (blocked) => {
    const {denialBar} = this.state;
    if(blocked) return denialBar;
    return '';
  }
  
  render() {
    const {messageItems, outgoingMessage, throttled, forbidden} = this.state;
    const {user: {connection}} = this.props;
    const connected = connection === "open"; // && !throttled && !forbidden;
    const blocked = throttled || forbidden;
    console.log("blocked", blocked);

    const inputBar = this.getInputBar(connected, blocked, outgoingMessage);
    const denialBar = this.getDBar(blocked);

    return (
      <div className={style.contentWrapper}>
        <Scrollbars
          ref={this.scrollBars}
          renderThumbVertical={({ styles, ...props }) => (
            <div
              {...props}
              style={{
                ...styles,
                width: '4px',
                borderRadius: 'inherit',
                backgroundColor: '#c5cdd2',
                left: '1px',
              }}
            />
          )}
          autoHide
          style={{
            width: "100%",
            height: "70vh"
          }}
          onScrollStart={() => {this.handleScrollStart()}}
          onScrollStop={() => {this.handleScrollStop()}}
        >
          <div className={style.contentWrapper}>
            {messageItems}
          </div>
        </Scrollbars>
        <div className="input-group mb-3">
          {inputBar}
          {denialBar}
        </div>
      </div>
    )
  }
}

export default Messaging
