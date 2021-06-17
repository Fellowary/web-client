import React from 'react'
import { connect } from 'react-redux'
import { Menu, Button, Divider, Tabs, Badge, Dropdown, Modal, Avatar} from 'antd'
import styles from './style.module.scss'

const { TabPane } = Tabs;


@connect( ({ user, identities }) => ({user, identities}))
class IdentityMenu extends React.Component {
  state = {
    identityModalVisible: false,
    identity: {},
  }

  setPrimaryIdentity = () => {
    const { dispatch } = this.props
    const { identity } = this.state
    // console.log(identity);
    dispatch({
      type: 'identities/SET_PRIMARY_IDENTITY',
      payload: {
        fingerprint: identity.fingerprint,
      },
    })
    this.setState({identityModalVisible: false});
  }

  createIdentity = (e) => {
    console.log('creating identity');
    e.stopPropagation();
    const { dispatch, user } = this.props
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

  deleteIdentity = () => {
    // console.log('delete identity menu');
    const { dispatch } = this.props
    const { identity } = this.state
    dispatch({
      type: 'identities/DELETE_IDENTITY',
      payload: {
        name: identity.name,
        fingerprint: identity.fingerprint,
        redirect: window.location.hash.includes(`/identity/${identity.fingerprint}`)
      },
    })
    this.setState({identityModalVisible: false});
  }

  showIdentityModal = (fingerprint) => {
    const { identities } = this.props

    // console.log('showIdentityModal', fingerprint);
    this.setState({
      identityModalVisible: true,
      identity: identities[fingerprint]
    });
  };

  handleOk = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      identityModalVisible: false,
    });
  };

  handleCancel = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      identityModalVisible: false,
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
    const { user } = this.props;
    const { identities } = this.props;
    // console.log("logging identities", identities);
    // console.log("logging user", user);
    const { identityModalVisible, identity } = this.state;
    const { loading } = user.loading;

    const menuItems = [];
    for(const fgrprint in identities){ // eslint-disable-line
      // // console.log('ITERATING OVER IDENTITIES', identities[fgrprint]);

      menuItems.push(
        <Menu.Item key={`${fgrprint}-identityMenu`}>
          <a href="javascript: void(0);" onClick={() => this.showIdentityModal(fgrprint)}>
            <div className="flexitem">
              <Avatar className={styles.avatar} shape="square" size="large" src={identities[fgrprint].avatar} />
              <div className={styles.dropdownprimarytext}>
                <div><strong>{identities[fgrprint].name}</strong></div>
                <div>{fgrprint}</div>
              </div>
            </div>
          </a>
        </Menu.Item>
      )
    }

    const identityTabs = [];
    // console.log("chosen identity", identity);
    const safeKeys =['name', 'avatar', 'fingerprint', 'publicKey', 'privateKey', 'circles'];
    for(const key in identity){ // eslint-disable-line
      if(!safeKeys.includes(key)){
        continue; //eslint-disable-line
      }
      let insert = null;
      if (key === 'avatar'){
        insert = <img src={identity[key]} alt={identity.name} />
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

    const menu = (
      <Menu selectable={false}>
        {menuItems}
      </Menu>
    )
    return (
      <div>
        <Dropdown overlay={menu} trigger={['click']} onVisibleChange={this.checkIdentities}>
          <div className={styles.dropdown}>
            <Badge count={5}>
              <Badge count={<a href="javascript: void(0);" className="bottomrightbadge" onClick={this.createIdentity}><i className="textpulsehover fe fe-plus-circle solidbackground round" /></a>}>
                <Avatar className={styles.avatar} shape="square" size="large" src={user.primaryIdentity.avatar} />
              </Badge>
            </Badge>
            <div className={styles.dropdownprimarytext}>
              <div><strong>PRIMARY IDENTITY</strong></div>
              <div>{user.primaryIdentity.name}</div>
            </div>
          </div>
        </Dropdown>
        <Modal
          title="Identity Info"
          visible={identityModalVisible}
          centered
          width="1000px"
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button key="topIdentityMenuCancel" onClick={this.handleCancel}>
              Cancel
            </Button>,
            <Button key="topIdentityMenuMakePrimary" type="primary" loading={loading} onClick={this.setPrimaryIdentity}>Make Primary</Button>,
            <Button key="topIdentityMenuCreateIdentity" type="secondary" loading={loading} onClick={this.createIdentity}>New</Button>,
            <Button key="topIdentityMenuDeleteIdentity" type="danger" loading={loading} onClick={this.deleteIdentity}>Delete</Button>
          ]}
        >
          <Tabs>
            {identityTabs}
          </Tabs>
        </Modal>

      </div>
    )
  }
}

export default IdentityMenu
