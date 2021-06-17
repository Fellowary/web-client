import React from 'react';
import { connect } from 'react-redux';
import {isObjectEmpty} from 'utilities'
import { Button, notification } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
import style from './style.module.scss';

@connect(({ user, identities }) => ({ user, identities }))
class InviteManager extends React.Component{
  constructor(props){
    super(props);
    const {dispatch, user, identities} = props;


    this.state.selectedIdentity = undefined;
    this.state.gettingInvite = false;
    this.state.circleRoll = false;
    this.state.adminRoll = false;
    this.state.conversationRoll = false;

    // console.log("invite constructor identities", props.identities); //eslint-disable-line
    if(isObjectEmpty(user.invites) || isObjectEmpty(identities)){
      return; //eslint-disable-line
    }

    if(!this.state.gettingInvite){ //eslint-disable-line
      dispatch({
        type: 'user/GET_INVITE',
        payload:{
          inviteUrl: user.invites[0]
        }
      });
      this.state.gettingInvite = true;
      this.state.selectedIdentity = Object.keys(identities)[0]; //eslint-disable-line
    }
  }

  state = {};

  UNSAFE_componentWillReceiveProps(nextProps){ //eslint-disable-line
    const { dispatch, user, identities} = nextProps;
    const {gettingInvite} = this.state;
    // console.log("invites receiver nextProps", gettingInvite, user.invites, user.currentInvitation);

    if((user.invites.length === 0 && !user.currentInvitation) || isObjectEmpty(identities)){
      return; //eslint-disable-line
    }

    if(!gettingInvite){
      dispatch({
        type: 'user/GET_INVITE',
        inviteUrl: user.invites[0]
      });

      this.setState({
        gettingInvite: true
      });
    }
  }

  generateIdentityList = (
    selectedIdentity
  ) => {
    const identityList = [];
    const {identities} = this.props;
    for (let key in identities){ // eslint-disable-line
      const i = identities[key];
      const item = 
        <a
          role="button"
          tabIndex={0}
          onClick={e => this.selectIdentity(e, i.fingerprint)}
          onKeyDown={e => this.selectIdentity(e, i.fingerprint)}
          key={`invite_modal/${i.fingerprint}`}
          className={
            `${style.item}
            ${
              selectedIdentity === i.fingerprint ? style.current : ''
            }
            d-flex flex-nowrap align-items-center`
          }
        >
          <div className="fel__utils__avatar fel__utils__avatar--size46 mr-3 flex-shrink-0">
            <img src={i.avatar} alt={i.name} />
          </div>
          <div className={`${style.info} flex-grow-1`}>
            <div className="text-uppercase font-size-12 text-truncate text-gray-6">
              {i.fingerprint}
            </div>
            <div className="text-dark font-size-18 font-weight-bold text-truncate">
              {i.name}
            </div>
          </div>
        </a>;
      identityList.push(item);
    }

    return identityList;
  };

  wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
 

  doABarrelRoll = (name) => {

    // e.target.classList.add('Vibrate');
     // console.log("buttonvibrating", buttonName);
    const stateUpdate = {};
    stateUpdate[`${name}Roll`] = true;
    this.setState(stateUpdate);
    this.wait(1000).then(() => {
      stateUpdate[`${name}Roll`] = false;
       // console.log("no more vibrate", stateUpdate);
      this.setState(stateUpdate);
    });
  };

  getInvitationItems = (currentInvitation) => {
    const {circleRoll, adminRoll, conversationRoll} = this.state;

    if (!currentInvitation){
      return {};
    }
    const getDisplayItem = (i, rolling, type) => { //eslint-disable-line
      return (
        <a
          role="button"
          tabIndex={0}
          onClick={() => this.doABarrelRoll(type)}
          onKeyDown={() => this.doABarrelRoll(type)}
          key={`invite_modal/${i.fingerprint}`}
          className={
            `${style.item}
            ${rolling? style.rolling : ""}
            d-flex flex-nowrap align-items-center`
          }
        >
          <div className="fel__utils__avatar fel__utils__avatar--size50 mr-3 flex-shrink-0">
            <img className={`${type==="circle" ? "fel__utils__image--circle" : "fel__utils__image--rounded" }`} src={i.avatar} alt={i.name} />
          </div>
          <div className={`${style.info} flex-grow-1`}>
            <div className="text-dark font-size-18 font-weight-bold text-truncate">
              {i.name}
            </div>
            <div className="text-uppercase font-size-12 text-truncate text-gray-6">
              {i.fingerprint}
            </div>
          </div>
        </a>);
    };

    return {
      circleItem: getDisplayItem(currentInvitation.circle, circleRoll, 'circle'),
      adminItem: getDisplayItem(currentInvitation.admin, adminRoll, 'admin'),
      conversationItem: getDisplayItem(currentInvitation.conversation, conversationRoll, 'conversation')
    };
  };

  selectIdentity = (e, identityFingerprint) => {
    this.setState({
      selectedIdentity: identityFingerprint
    });
  };

  handleOk = () => {
    const {dispatch, user: {currentInvitation}} = this.props;
    const {selectedIdentity} = this.state;

    if (!selectedIdentity){
      notification.error({
        message: "No Identity Chosen",
        description: "Please select an Identity."
      });
      return;
    }
    dispatch({
      type: 'user/ACCEPT_INVITE',
      payload:{
        inviteUrl: currentInvitation.inviteUrl,
        identityFingerprint: selectedIdentity
      }
    });
  }

  handleCancel = () => {
    const {dispatch, user: {currentInvitation}} = this.props;
    dispatch({
      type: 'user/REJECT_INVITE',
      payload:{
        inviteUrl: currentInvitation.inviteUrl
      }
    });
  }


  
  render() {
    const {
      dispatch,
      user: {loading, currentInvitation, invites},
    } = this.props;

    const {
      selectedIdentity,
      gettingInvite
    } = this.state;
    
    // console.log("rendering", gettingInvite, currentInvitation);
    if (!gettingInvite && !currentInvitation){
     this.setState({
        gettingInvite: true
      }); 
      dispatch({
        type: 'user/GET_INVITE',
        inviteUrl: invites[0]
      });
    }

    const identityList = this.generateIdentityList(selectedIdentity);

    const {circleItem, adminItem, conversationItem} = this.getInvitationItems(currentInvitation);


    return (

      <div className={style.inviteBox}>
        <div className="pt-5 pb-5 d-flex align-items-end mt-auto">
          <img src="/images/fellowary-fellows-500.png" className={style.fellowaryLogo} alt="Fellowary Logo" />
        </div>
        <div className={`${style.container} pl-5 pr-5 pt-5 pb-5`}>
          <div className="text-dark font-size-30 mb-2 text-center">
            You have an invitation from {adminItem}
          </div>
          <div className="text-dark font-size-30 mb-2 text-center">
            In the circle of the {circleItem}
          </div>
          <div className="text-dark font-size-30 mb-2 text-center">
            To join their chat {conversationItem}
          </div>

          <div className="text-dark ml-2 mb-10 font-size-24">Who do you want to join as?</div>
          
          <div className={style.identityList}>
            <Scrollbars
              autoHeight
              autoHeightMin={100}
              autoHeightMax={300}
              renderThumbVertical={({ ...props }) => (
                <div
                  {...props} //eslint-disable-line
                  style={{
                    width: '5px',
                    borderRadius: 'inherit',
                    backgroundColor: 'rgba(195, 190, 220, 0.4)',
                    left: '1px',
                    justifyContent: 'center',
                    display: 'flex',
                  }}
                />
              )}
            >
              {identityList}
            </Scrollbars>
          </div>
          <Button
            onClick={() => {this.handleOk()}}
            type="primary"
            size="large"
            className="text-center btn btn-success w-100 font-weight-bold font-size-18"
            htmlType="submit"
            loading={loading}
          >
            Join
          </Button>
          <Button
            onClick={() => {this.handleCancel()}}
            type="danger"
            size="large"
            className={`text-center ${style.reject} btn btn-danger w-100 font-weight-bold font-size-18`}
            htmlType="submit"
            loading={loading}
          >
            Reject
          </Button>
        </div>
        <div className="mt-auto pb-5 pt-5">
          <ul
            className={`${style.footerNav} list-unstyled d-flex mb-2 flex-wrap justify-content-center`}
          >
            <li>
              <a href="/terms">Terms of Use</a>
            </li>
            <li>
              <a href="/compliance">Compliance</a>
            </li>
            <li>
              <a href="/support">Support</a>
            </li>
            <li>
              <a href="/contact">Contacts</a>
            </li>
          </ul>
          <div className="text-gray-4 text-center">© 2021 Fellowary. All rights reserved.</div>
        </div>
      </div>
    );
  }
}

export default InviteManager