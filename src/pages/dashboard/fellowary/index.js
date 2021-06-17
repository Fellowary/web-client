import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Button, Input, Modal } from 'antd'

import CircleTree from 'components/widgets/Trees/circletree'
import VoucherSelect from 'components/widgets/General/voucherselect'
// import UserList from 'components/widgets/Lists/identitylist' 

/* import CircleList from 'components/widgets/Lists/circlelist'
*/
import FileManager from 'components/widgets/General/filemanager'
import style from './style.module.scss'

const { Search } = Input

@connect (({ user, identities, circles }) => ({user, identities, circles}))
class DashboardFellowary extends React.Component {

  constructor(props){
    super(props);
    this.voucherSelect = React.createRef();
  }

  state = {
    focusedNode: 0,
   /* circleUserList: [
      {circle: 'dummycircle', name: 'billy'},
      {circle: 'othercircle', name: 'dave'}
    ],
    mailList: [
      {circle: 'dummycircle', name: 'billy'},
      {circle: 'othercircle', name: 'dave'}
    ], */
    vouchModalVisible: false,
    selectedCircles: [],
    selectedVouchers: [],
    requestingVouch: false,
    checkingForVouch: false,
    uploadingKey: false,
  }

  gotoTreeNode = userKey => {
    console.log("in gotoTreeNode, userKey:", userKey);
  }

  selectNode = userKey => {
    console.log("in selectNode, userKey:", userKey);
  }

  showVouchModal = () => {
    const { circles } = this.props

    console.log('showCircleModal', circles);
    this.setState({
      vouchModalVisible: true,
    });
  };

  requestVouch = (user, fingerprint) => {
    const {requestingVouch} = this.state;
    if (requestingVouch){
      return;
    }
    const { dispatch } = this.props
    console.log(`requesting vouch from ${fingerprint}`);
    this.setState({requestingVouch: true});
    // eslint-disable-next-line
    setTimeout(function(){
      this.setState({requestingVouch: false});
    }.bind(this), 1000);
    dispatch({
      type: 'circles/REQUEST_VOUCH',
      payload:{
        circleFingerprint: user.primaryCircle.fingerprint,
        identityFingerprint: user.primaryIdentity.fingerprint,
        fingerprint,
      }
    })
  }

  checkForVouch = (user, fingerprint) => {
    const {checkingForVouch} = this.state;
    if (checkingForVouch){
      return;
    }
    const { dispatch } = this.props
    console.log(`requesting vouch from ${fingerprint}`);
    this.setState({checkingForVouch: true});
    // eslint-disable-next-line
    setTimeout(function(){
      this.setState({checkingForVouch: false});
    }.bind(this), 1000);
    dispatch({
      type: 'circles/CHECK_FOR_VOUCH',
      payload:{
        circleFingerprint: user.primaryCircle.fingerprint,
        identityFingerprint: user.primaryIdentity.fingerprint,
        fingerprint,
      }
    })
  }

  uploadKey = () => {
    const {uploadingKey} = this.state;
    const {user} = this.props;
    if (uploadingKey){
      return;
    }
    const { dispatch } = this.props
    console.log(`dashboard - uploading key for ${user.primaryIdentity.fingerprint}`);

    // eslint-disable-next-line
    setTimeout(function(){
      this.setState({uploadingKey: false});
    }.bind(this), 1000);

    dispatch({
      type: 'circles/UPLOAD_KEY',
      payload:{
        circleFingerprint: user.primaryCircle.fingerprint,
        identityFingerprint: user.primaryIdentity.fingerprint,
      }
    })
  }

  handleOk = e => {
    const { dispatch } = this.props
    console.log("GETTING VOUCHERS", this.voucherSelect.current.state.selectedVouchers);

    console.log(e);
    this.setState({
      vouchModalVisible: false,
    });
    dispatch({
      type: 'circles/VOUCH',
      payload:{
        voucher: '',
        circles: [],
        vouchee: ''
      }
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      vouchModalVisible: false,
    });
  };

  render() {
    const { user, circles, identities } = this.props
    const { 
      vouchModalVisible,
      focusedNode,
     // circleUserList,
     // mailList,
      selectedCircles,
      selectedVouchers, // map of {circle fingerprint: identity fingerprint}
      requestingVouch,
      checkingForVouch,
      uploadingKey
    } = this.state
    const { loading } = user.loading

    return (
      <div>
        <Helmet title="Fellowary Dashboard" />
        <div className="fel__utils_heading">
          <h3>
            Dashboard
            <Button className={style.invite_button} onClick={this.showVouchModal}>
              <i className="fa fa-user-plus" />
              Vouch
            </Button>
            <Button className={style.invite_button} loading={uploadingKey} onClick={this.uploadKey}>
              <i className="fa fa-user-plus" />
              Upload(Test)
            </Button>
            <Search
              className={style.invite_button}
              placeholder="Someone's fingerprint"
              enterButton="Request Vouch"
              style={{"width": 400}}
              loading={requestingVouch}
              onSearch={value => this.requestVouch(user, value)}
            />
            <Search
              className={style.invite_button}
              placeholder="Someone's fingerprint"
              enterButton="Check For Vouch Request"
              style={{"width": 400}}
              loading={checkingForVouch}
              onSearch={value => this.checkForVouch(user, value)}
            />
          </h3>
        </div>
        <div className="row">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body">
                <h6 className="text-uppercase text-dark font-weight-bold mb-3">Circle Tree</h6>
                <CircleTree focusedNode={focusedNode} selectNode={this.selectNode} />
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-uppercase text-dark font-weight-bold mb-3">People</h6>
                {/* <UserList list={circleUserList} /> */}
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card">
              <div className="card-body">
                <h6 className="text-uppercase text-dark font-weight-bold mb-3">Mail</h6>
                {/* <UserList list={mailList} /> */}
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-body">
                <FileManager />
              </div>
            </div>
          </div>
        </div>
        <Modal
          title="Vouch for someone you know"
          visible={vouchModalVisible}
          centered
          width="1000px"
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button key="back" onClick={this.handleCancel}>
              Nah
            </Button>,
            <Button key="vouch" type="primary" loading={loading} onClick={this.handleOk}>Vouch</Button>,
          ]}
        >
          <VoucherSelect
            ref={this.voucherSelect}
            circles={circles}
            identities={identities}
            selectedCircles={selectedCircles}
            selectedVouchers={selectedVouchers} 
          />
        </Modal>
      </div>
    )
  }
}

export default DashboardFellowary