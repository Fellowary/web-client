import React from 'react'
import { Helmet } from 'react-helmet'
import Error404 from 'components/system/Errors/404'

class System404 extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="Page 404" />
        <Error404 />
      </div>
    )
  }
}

export default System404
