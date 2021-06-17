import React from 'react'
import { Helmet } from 'react-helmet'
import Login from 'components/system/Auth/Login'

class SystemLogin extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="Login" />
        <Login />
      </div>
    )
  }
}

export default SystemLogin
