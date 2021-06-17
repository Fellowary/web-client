import React from 'react'
import { Helmet } from 'react-helmet'
import Lockscreen from 'components/system/Auth/Lockscreen'

class SystemLockscreen extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="Lockscreen" />
        <Lockscreen />
      </div>
    )
  }
}

export default SystemLockscreen
