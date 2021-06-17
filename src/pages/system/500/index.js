import React from 'react'
import { Helmet } from 'react-helmet'
import Error500 from 'components/system/Errors/500'

class System500 extends React.Component {
  render() {
    return (
      <div>
        <Helmet title="Page 500" />
        <Error500 />
      </div>
    )
  }
}

export default System500
