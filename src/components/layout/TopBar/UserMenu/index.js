import React from 'react'
import { connect } from 'react-redux'
import { Menu, Dropdown, Modal, Avatar, Badge } from 'antd'
import styles from './style.module.scss'

@connect(({ user }) => ({ user }))
class ProfileMenu extends React.Component {
  state = {
    count: 7,
    publicKeyVisible: false,
    privateKeyVisible: false,
  }

  logout = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'user/LOGOUT',
    })
  }

  addCount = () => {
    let { count } = this.state
    count += 1
    this.setState({
      count,
    })
  }

  showPublicKeyModal = () => {
    this.setState({
      publicKeyVisible: true,
    });
  };

  showPrivateKeyModal = () => {
    this.setState({
      privateKeyVisible: true,
    });
  };

  doSomething = e => {
    e.stopPropagation();
    // console.log("sup");
  };

  handleOk = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      publicKeyVisible: false,
      privateKeyVisible: false,
    });
  };

  handleCancel = e => { //eslint-disable-line
    // console.log(e);
    this.setState({
      publicKeyVisible: false,
      privateKeyVisible: false,
    });
  };

  render() {
    const { user } = this.props
    const { count, publicKeyVisible, privateKeyVisible } = this.state
    // console.log("logging user", user);
    const menu = (
      <Menu selectable={false}>
        <Menu.Item>
          <strong>Hello, {user.username || 'Anonymous'}</strong>
          <div>
            <strong>Fingerprint: </strong>
            {user.fingerprint}
          </div>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <a href="javascript: void(0);" onClick={this.showPublicKeyModal}>
            <strong>Show Public Key</strong>
          </a>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <a href="javascript: void(0);" onClick={this.showPrivateKeyModal}>
            <strong>Show Private Key</strong>
          </a>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <a href="javascript: void(0);">
            <i className={`${styles.menuIcon} fe fe-user`} />
            Edit Profile
          </a>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <a href="javascript: void(0);" onClick={this.logout}>
            <i className={`${styles.menuIcon} fe fe-log-out`} />
            Logout
          </a>
        </Menu.Item>
      </Menu>
    )
    return (
      <div>
        <Dropdown overlay={menu} trigger={['click']} onVisibleChange={this.addCount}>
          <div className={styles.dropdown}>
            <Badge count={count} onClick={this.doSomething}>
              <Avatar className={styles.avatar} shape="square" size="large" src={user.avatar} />
            </Badge>
            <div className={styles.dropdownprimarytext}>
              <div><strong>USER</strong></div>
              <div>{user.username}</div>
            </div>
          </div>
        </Dropdown>
        <Modal
          title="Public Key - You can give this to anyone safely."
          visible={publicKeyVisible}
          centered
          width="600px"
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <pre>{user.publicKey}</pre>
        </Modal>
        <Modal
          title="Private Key - DON'T GIVE THIS OUT. SERIOUSLY."
          visible={privateKeyVisible}
          centered
          width="600px"
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <pre>{user.privateKey}</pre>
        </Modal>
      </div>
    )
  }
}

export default ProfileMenu
