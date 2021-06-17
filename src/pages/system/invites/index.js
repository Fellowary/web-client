import React from 'react'
import { Helmet } from 'react-helmet'
import InviteManager from 'components/InviteManager'

class SystemInvites extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="You've got an invite!" />
        <InviteManager />
      </div>
    )
  }
}

export default SystemInvites
