import React from 'react'
import { Layout } from 'antd'
import { withRouter } from 'react-router-dom'

@withRouter
class AuthLayout extends React.PureComponent {
  render() {
    const { children } = this.props
    return (
      <Layout>
        <Layout.Content>
          <div>{children}</div>
        </Layout.Content>
      </Layout>
    )
  }
}

export default AuthLayout
