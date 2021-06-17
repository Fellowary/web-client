import React from 'react'
import { Helmet } from 'react-helmet'
import Register from 'components/system/Auth/Register'

class SystemRegister extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="Register" />
        <Register />
      </div>
    )
  }
}

export default SystemRegister
