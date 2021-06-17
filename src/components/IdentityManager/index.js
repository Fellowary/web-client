import React from 'react'
import { withRouter /* , HashRouter as Router /* , Route */ } from 'react-router-dom';
import { Helmet } from 'react-helmet'
import { Tabs, Form, Input, Button, Upload } from 'antd'
import ListFiller from 'components/widgets/Lists/filler'
import IdentityCard from 'components/widgets/IDCard'
import { connect } from 'react-redux';
import IdentityList from 'components/widgets/Lists/identityList' 
import style from './style.module.scss';

const { TabPane } = Tabs
const FormItem = Form.Item
const queryString = require('query-string');


@withRouter
@Form.create()
@connect (({ user, identities, circles, vouchRequesters, vouchResponders }) => ({user, identities, circles, vouchRequesters, vouchResponders}))
class IdentityManager extends React.Component {

  constructor(props){
    super(props);
    const { user, circles, identityFingerprint, identityCircleFingerprint, identities } = this.props;
    // console.log("identity manager constructor", user, identities, circles, identityFingerprint, identityCircleFingerprint);
    this.state.currentIdentity = user.primaryIdentity;
    if (identityFingerprint){
      const identity = identities[identityFingerprint];
      if (identity)
        this.state.currentIdentity = identity;
    }
    // console.log("identity manager constructor current identity", this.state.currentIdentity); // eslint-disable-line

    this.state.filteredCircles = [];
    const identityCircles = this.state.currentIdentity.circles; // eslint-disable-line
    for(const cKey in circles){ // eslint-disable-line
      if (identityCircles.includes(circles[cKey].fingerprint)){
        this.state.filteredCircles.push(circles[cKey]);  // eslint-disable-line
        if (cKey === identityCircleFingerprint){
          // console.log("icf is same as cKey, setting current circle");
          this.state.currentCircle = circles[cKey];
        }
      }
    }

    const circle = this.state.filteredCircles[identityCircleFingerprint]; // eslint-disable-line
    // // console.log("identity manager constructor circle", identityCircleFingerprint, circle, this.state.filteredCircles); // eslint-disable-line

    if (!this.state.currentCircle){ // eslint-disable-line
      // console.log("didn't find circle in filtered circles, assigning first filteredCircle as currentcircle");
      this.state.currentCircle = this.state.filteredCircles[0]; // eslint-disable-line
    }

    this.selectIdentity = this.selectIdentity.bind(this);
    this.selectCircle = this.selectCircle.bind(this);
    this.selectVouchRequest = this.selectVouchRequest.bind(this);
    this.requestVouch = this.requestVouch.bind(this);
    this.checkForVouch = this.checkForVouch.bind(this);
    this.uploadKey = this.uploadKey.bind(this);

    this.dataRequestTypes = {
      'ReceivedVR': 'identities/LOAD_VOUCH_REQUESTERS',
      'SentVR': 'identities/LOAD_VOUCH_RESPONDERS',
      'Votes': 'identities/LOAD_VOTES',
      'Settings': 'identities/LOAD_SETTINGS'
    };

    this.state.tabKey = 'ReceivedVR';
    this.state.render = true;
  }

  state = {};

  // componentDidMount(){
  //   const { currentIdentity } = this.state; //eslint-disable-line
  //   // console.log("identity manager mounted", currentIdentity);
  // }

  UNSAFE_componentWillReceiveProps(nextProps){ //eslint-disable-line
    // debugger; //eslint-disable-line
    // console.log("identity manager receivingprops", nextProps, this.props);
    const { user, circles, identityFingerprint, identities } = this.props;
    let {currentIdentity} = this.state;
    const { location } = nextProps;
    // console.log("identity manager receiver", user, identities, circles, identityFingerprint);
    // let currentIdentity = null;
    if (!currentIdentity && !identityFingerprint){
      currentIdentity = nextProps.user.primaryIdentity; // eslint-disable-line
      this.setState({
        currentIdentity
      });
    }
    else if(!currentIdentity){
      const identity = nextProps.identities[identityFingerprint];
      if (identity){
        currentIdentity = identity;
        this.setState({
          currentIdentity
        });
      }
    }
    else{
      currentIdentity = nextProps.identities[currentIdentity.fingerprint];
      this.setState({
        currentIdentity
      })
    }

    if (Object.keys(nextProps.identities).length !== Object.keys(identities).length){
      this.setState({
        identities: nextProps.identities // eslint-disable-line
      });
    }

    // Identity's circle management
    if (Object.keys(nextProps.circles).length !== Object.keys(circles).length){
      // console.log("identity manager receiver current identity", currentIdentity, Object.keys(nextProps.circles).length);
      const filteredCircles = [];
      const identityCircles = currentIdentity.circles;
      for(let i=0;i< identityCircles.length;++i){ // eslint-disable-line
        const goodCircle = nextProps.circles[identityCircles[i]];
        if (goodCircle){
          filteredCircles.push(goodCircle);
        }
      }
      // console.log("SELECTING IDENTITY - SETTING STATE", filteredCircles, currentIdentity);
      this.setState({
        filteredCircles
      });

      this.state.currentCircle = user.primaryCircle;
      const parsed = queryString.parse(location.hash); // eslint-disable-line
      // console.log("identity manager receiver -parsed", parsed);
      if (parsed.icircle){
        const circle = nextProps.circles[parsed.icircle]; // eslint-disable-line
        if (circle){
          this.setState({
            currentCircle: circle
          })
        }
      }
    }
    this.setState({
      render: true
    });
    // Vouch Request Management
  }

  shouldComponentUpdate(nextProps, nextState){
    // console.log("should render:", nextState.render);
    return nextState.render
  }

  changeTab = tabKey => {
    this.setState({
      tabKey,
    })
  }

  selectIdentity = (identity) => {
    // const { location } = this.props;
    const {circles} = this.props;
    const {currentIdentity, tabKey} = this.state;
    const parsed = queryString.parse(window.location.hash.replace('#/dashboard/manage','')); // eslint-disable-line


    parsed.identity = identity.fingerprint;
    const qs = queryString.stringify(parsed);
    // console.log("querystring, ", qs);
    // const url = new URL(location.pathName);
    // // console.log(url);
    const newPath = `#/dashboard/manage#${qs}`;
    // console.log("newPath: ", newPath);
    if ('scrollRestoration' in window.history) { // eslint-disable-line
     window.history.scrollRestoration = 'manual'; // eslint-disable-line
    }
    window.history.replaceState(null, null, newPath); // eslint-disable-line

    // // console.log("SELECTING IDENTITY", identity, currentIdentity, circles);
    if (currentIdentity.fingerprint !== identity.fingerprint){
      const filteredCircles = [];
      const identityCircles = identity.circles;
      for(let i=0;i< identityCircles.length;++i){ // eslint-disable-line
        const goodCircle = circles[identityCircles[i]];
        if (goodCircle){
          filteredCircles.push(goodCircle);
        }
      }

      // console.log("SELECTING IDENTITY - SETTING STATE", filteredCircles, identity);

      this.setState({
        currentIdentity: identity,
        filteredCircles,
        render: false
      });
    }
    this.getData(tabKey, identity.fingerprint);
  };

  getData = (source, identityFingerprint) => {
    const {dispatch} = this.props;
    dispatch({
      type: this.dataRequestTypes[source],
      payload:{
        identityFingerprint
      }
    }); 
  }

  selectCircle = (circle) => {
    // const { location } = this.props;
    const parsed = queryString.parse(window.location.hash.replace('#/dashboard/manage','')); // eslint-disable-line
    // console.log("select - location, identityCircle", window.location, circle);
    // console.log("PARSED", parsed);
    parsed.icircle = circle.fingerprint;
    const qs = queryString.stringify(parsed);
    // console.log("queryString, ", qs);
    const newPath = `#/dashboard/manage#${qs}`;
    // console.log("newPath: ", newPath);
    if ('scrollRestoration' in window.history) { // eslint-disable-line
     window.history.scrollRestoration = 'manual'; // eslint-disable-line
    }
    window.history.replaceState(null,null,newPath); // eslint-disable-line

    this.setState({
      currentCircle: circle
    })
  };

  selectRequest = (request) => {
    // console.log("selecting request: ", request);
    this.setState({
      selectedRequest: request
    })
  };



  getOtherParty = () => {
    const {selectedRequest, currentIdentity } = this.state;
    const inductionPersona = currentIdentity.personaeFingerprints.induction;
    if (!selectedRequest)
      return false;
    const approver = selectedRequest.request_type === 'vouch_request'? "voucher_fingerprint": "circle_admin_fingerprint"
    if (inductionPersona.fingerprint === selectedRequest[approver])
      return selectedRequest.personae_bundle.induction;
    return selectedRequest[approver];
  }

  requestVouch = (voucherFingerprint) => {
    const { dispatch } = this.props;
    const {currentCircle, currentIdentity} = this.state;
    // console.log(`circle: ${currentCircle.fingerprint},identity: ${currentIdentity.fingerprint} requesting vouch from ${voucherFingerprint}`);

    dispatch({
      type: 'circles/REQUEST_VOUCH',
      payload:{
        circleFingerprint: currentCircle.fingerprint,
        identityFingerprint: currentIdentity.fingerprint,
        fingerprint: voucherFingerprint,
      }
    })
  }

  checkForVouch = (requesterFingerprint) => {
    const {dispatch} = this.props;
    const {currentCircle, currentIdentity} = this.state;

    // console.log(`checking for vouch from ${requesterFingerprint}, identity ${currentIdentity.fingerprint}, circle ${currentCircle.fingerprint}`);

    dispatch({
      type: 'circles/CHECK_FOR_VOUCH',
      payload:{
        circleFingerprint: currentCircle.fingerprint,
        identityFingerprint: currentIdentity.fingerprint,
        fingerprint: requesterFingerprint,
      }
    })
  }

  selectVouchRequest = (vouchRequestFingerprint) => {
    // console.log("selectVouchRequest", vouchRequestFingerprint);

    this.setState({
      otherParty: vouchRequestFingerprint
    });
  };

  uploadKey = () => {
    const { dispatch } = this.props;
    const {currentCircle, currentIdentity} = this.state
    // console.log(`dashboard - uploading key for identity ${currentIdentity.fingerprint} using ${currentCircle.fingerprint}`);
    dispatch({
      type: 'circles/UPLOAD_KEY',
      payload:{
        circleFingerprint: currentCircle.fingerprint,
        identityFingerprint: currentIdentity.fingerprint,
      }
    });

  }

  render() {
    const { tabKey, currentIdentity, currentCircle, filteredCircles, otherParty } = this.state; //eslint-disable-line
    const { form, identities, circles, vouchRequesters, vouchResponders} = this.props;//eslint-disable-line
    // console.log("RENDER IDENTITY MANAGER", circles, identities, currentIdentity, currentCircle, filteredCircles, vouchRequesters, vouchResponders, otherParty);
    // const circleValues = Object.values(circles);
    // // console.log("currentIdentity", currentIdentity);

    const sentAccessRequests = [];

    const receivedAccessRequests = [];
    const currentCircleFingerprint = currentCircle? currentCircle.fingerprint: "";

    return (
      <div>
        <Helmet title="Identity Manager" />
        <div className="fel__utils__heading">
          <h5>Identity Manager</h5>
        </div>
        <div className="row">
          <div className="col-xl-4 col-lg-12">
            <div className="card">
              <div className="card-body">
                <IdentityCard 
                  name={currentIdentity.name}
                  fingerprint={currentIdentity.fingerprint}
                  publicFingerprint={currentIdentity.personaeFingerprints.induction}
                  avatar={currentIdentity.avatar}
                  uploadKey={this.uploadKey}
                  requestVouch={this.requestVouch}
                  checkForVouch={this.checkForVouch}
                />
              </div>
            </div>
            <div className="card text-white bg-primary">
              <IdentityList selector={this.selectIdentity} aggiList={identities} fingerprint={currentIdentity.fingerprint} shape="square" />
            </div>
            <div className="card text-white bg-primary">
              <IdentityList selector={this.selectCircle} aggiList={filteredCircles} fingerprint={currentCircleFingerprint} shape="circle" />
            </div>
            <div className="card">
              <div className="card-body">
                <ListFiller />
              </div>
            </div>
          </div>
          <div className="col-xl-8 col-lg-12">
            <div className="card">
              <div className="card-header card-header-flex flex-column">
                <div className="d-flex flex-wrap border-bottom pt-3 pb-4 mb-3">
                  <div className="mr-5">
                    <div className="text-dark font-size-18 font-weight-bold">David Beckham</div>
                    <div className="text-gray-6">@david100</div>
                  </div>
                  <div className="mr-5 text-center">
                    <div className="text-dark font-size-18 font-weight-bold">100</div>
                    <div className="text-gray-6">Posts</div>
                  </div>
                  <div className="mr-5 text-center">
                    <div className="text-dark font-size-18 font-weight-bold">17,256</div>
                    <div className="text-gray-6">Followers</div>
                  </div>
                </div>
                <Tabs
                  activeKey={tabKey}
                  className="mr-auto fel-tabs-bold"
                  onChange={this.changeTab}
                >
                  <TabPane tab="Received Vouch Requests" key="ReceivedVR" />
                  <TabPane tab="Sent Vouch Requests" key="SentVR" />
                  <TabPane tab="Votes" key="Votes" />
                  <TabPane tab="Settings" key="Settings" />
                </Tabs>
              </div>
              <div className="card-body card-body-flex flex-wrap">
                {tabKey === 'ReceivedVR' && 
                  <div className={style.request_communicator}>
                    <div className="flex-grow-1 mr-1">
                      <IdentityList
                        selector={this.selectVouchRequest}
                        aggiList={vouchRequesters}
                        shape="square"
                      />
                    </div>
                    <div className="flex-grow-1 p-1">
                      {/* <Messaging
                        circle={currentCircle}
                        us={currentIdentity}
                        them={otherParty}
                        messageType='vouchRequestMessage'
                      /> */}
                    </div>
                  </div>
                }
                {tabKey === 'SentVR' && 
                  <div className={style.request_communicator}>
                    <div className="flex-grow-1">
                      <IdentityList 
                        selector={this.selectAccessRequest}
                        aggiList={sentAccessRequests}
                        aggList2={receivedAccessRequests}
                      />
                    </div>
                    <div className="flex-grow-1">
                      {/* <Messaging us={currentIdentity} them={otherParty} /> */}
                    </div>
                  </div>
                }
                {tabKey === 'Votes' && (
                  <Form className="login-form">
                    <h5 className="text-black mt-4">
                      <strong>Personal Information</strong>
                    </h5>
                    <div className="row">
                      <div className="col-lg-6">
                        <FormItem label="Username">
                          {form.getFieldDecorator('userName', {
                            rules: [{ required: false }],
                          })(<Input placeholder="Username" />)}
                        </FormItem>
                      </div>
                      <div className="col-lg-6">
                        <FormItem label="Email">
                          {form.getFieldDecorator('email', {
                            rules: [{ required: false }],
                          })(<Input placeholder="Email" />)}
                        </FormItem>
                      </div>
                    </div>
                    <h5 className="text-black mt-4">
                      <strong>New Password</strong>
                    </h5>
                    <div className="row">
                      <div className="col-lg-6">
                        <FormItem label="Password">
                          {form.getFieldDecorator('password')(<Input placeholder="New password" />)}
                        </FormItem>
                      </div>
                      <div className="col-lg-6">
                        <FormItem label="Confirm Password">
                          {form.getFieldDecorator('confirmpassword')(
                            <Input placeholder="Confirm password" />,
                          )}
                        </FormItem>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <h5 className="text-black mt-4 mb-3">
                          <strong>Profile Avatar</strong>
                        </h5>
                        <Upload>
                          <Button>
                            <i className="fe fe-upload mr-2" /> Click to Upload
                          </Button>
                        </Upload>
                      </div>
                      <div className="col-lg-6">
                        <h5 className="text-black mt-4 mb-3">
                          <strong>Profile Background</strong>
                        </h5>
                        <Upload>
                          <Button>
                            <i className="fe fe-upload mr-2" /> Click to Upload
                          </Button>
                        </Upload>
                      </div>
                    </div>
                    <div className="form-actions">
                      <Button
                        style={{ width: 200 }}
                        type="primary"
                        htmlType="submit"
                        className="mr-3"
                      >
                        Submit
                      </Button>
                      <Button htmlType="submit">Cancel</Button>
                    </div>
                  </Form>
                )}
                {tabKey === 'Settings' &&
                  <div>Settings Pagee</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default IdentityManager
