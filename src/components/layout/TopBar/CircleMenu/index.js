import React from 'react'
import { connect } from 'react-redux'
import { Menu, Button, Divider, Tabs, Badge, Dropdown, Modal, Avatar} from 'antd'
import styles from './style.module.scss'

const { TabPane } = Tabs;


@connect( ({ user, circles }) => ({user, circles}))
class CircleMenu extends React.Component {
  state = {
    circleModalVisible: false,
    circle: {},
  }

  setPrimaryCircle = () => {
    const { dispatch, user } = this.props
    const { circle } = this.state
    // console.log(circle);
    dispatch({
      type: 'circles/SET_PRIMARY_CIRCLE',
      payload: {
        circleFingerprint: circle.fingerprint,
        identityFingerprint: user.primaryIdentity.fingerprint
      },
    })
    this.setState({circleModalVisible: false});
  }

  createCircle = (e) => {
    const {user} = this.props
    // console.log('creating circle');
    if(user.loading){
      return;
    }
    e.stopPropagation();
    const { dispatch } = this.props;
    dispatch({
      type: 'circles/CREATE_CIRCLE',
      payload: {
        circleName: '',
        identityFingerprint: user.primaryIdentity.fingerprint
      },
    })
  }

  deleteCircle = () => {
    // console.log('delete circle menu');
    const { dispatch } = this.props
    const { circle } = this.state
    dispatch({
      type: 'circles/DELETE_CIRCLE',
      payload: {
        fingerprint: circle.fingerprint,
      },
    })
    this.setState({circleModalVisible: false});
  }

  showCircleModal = (fingerprint) => {
    const { circles } = this.props

    // console.log('showCircleModal', fingerprint);
    this.setState({
      circleModalVisible: true,
      circle: circles[fingerprint]
    });
  };

  handleOk = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      circleModalVisible: false,
    });
  };

  handleCancel = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      circleModalVisible: false,
    });
  };

  formatPersonae = personae => {
    // console.log(personae);
    const personaeBlocks = [];
    for(const pType in personae){ // eslint-disable-line
      personaeBlocks.push(
        <div>
          <Divider>{pType}</Divider>
          <pre>{personae[pType].publicKey ? personae[pType].publicKey:'no public key'}</pre>
          <pre>{personae[pType].privateKey ? personae[pType].privateKey:'no private key'}</pre>
        </div>
      );
    }
    return personaeBlocks;
  }
  
  render() {
    const { user } = this.props
    const { circles } = this.props
    // console.log("logging circles", circles);
    // console.log("logging user", user);
    // console.log("logging user's primaryCircle", user.primaryCircle);
    const { circleModalVisible, circle } = this.state
    const { loading } = user.loading

    const menuItems = [];

    for(const fgrprint in circles){ // eslint-disable-line
      // // console.log('ITERATING OVER CIRCLES', circles[fgrprint]);
      menuItems.push(
        <Menu.Item key={fgrprint}>
          <a href="javascript: void(0);" onClick={() => this.showCircleModal(fgrprint)}>
            <div className="flexitem">
              <Avatar className={styles.avatar} shape="square" size="large" src={circles[fgrprint].avatar} />
              <div className={styles.dropdownprimarytext}>
                <div><strong>{circles[fgrprint].name}</strong></div>
                <div>{fgrprint}</div>
              </div>
            </div>
          </a>
        </Menu.Item>
      )
    }

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
      else{
        insert = <pre>{circle[key]}</pre>;
      }
      circleTabs.push(
        <TabPane tab={key} key={key}>
          {insert}
        </TabPane>
      );
    }

    const menu = (
      <Menu selectable={false}>
        {menuItems}
      </Menu>
    )

    return (
      <div>
        <Dropdown overlay={menu} trigger={['click']} onVisibleChange={this.checkCircles}>
          <div className={styles.dropdown}>
            <Badge count={<a href="javascript: void(0);" className="bottomrightbadge" onClick={this.createCircle}><i className="textpulsehover fe fe-plus-circle solidbackground round" /></a>}>
              <Avatar className={styles.avatar} shape="square" size="large" src={user.primaryCircle.avatar} />
            </Badge>
            <div className={styles.dropdownprimarytext}>
              <div><strong>PRIMARY CIRCLE</strong></div>
              <div>{user.primaryCircle.name}</div>
            </div>
          </div>
        </Dropdown>
        <Modal
          title="Public Key - You can give this to anyone safely."
          visible={circleModalVisible}
          centered
          width="1000px"
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button key="back" onClick={this.handleCancel}>
              Cancel
            </Button>,
            <Button type="primary" loading={loading} onClick={this.setPrimaryCircle}>Make Primary</Button>,
            <Button type="secondary" loading={loading} onClick={this.createCircle}>New</Button>,
            <Button type="danger" loading={loading} onClick={this.deleteCircle}>Delete</Button>
          ]}
        >
          <Tabs>
            {circleTabs}
          </Tabs>
        </Modal>

      </div>
    )
  }
}

export default CircleMenu
