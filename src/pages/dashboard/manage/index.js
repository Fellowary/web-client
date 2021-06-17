import React from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';

import IdentityManager from 'components/IdentityManager'
import CircleManager from 'components/CircleManager'


const queryString = require('query-string');

@connect (({ user, identities, circles }) => ({ user, identities, circles}))
class DashboardFellowary extends React.Component {

  constructor(props){
    super(props);
    this.voucherSelect = React.createRef();
  }

  render() {
    const { location } = this.props; //eslint-disable-line

    const parsed = queryString.parse(this.props.location.hash.replace("#/manage","")); // eslint-disable-line
    const { circle, identity, icircle } = parsed;
     // console.log("MANAGE CIRCLE", circle, identity, location);
    return (
      <div>
        <Helmet title="Fellowary Dashboard" />
        {!circle &&
          <IdentityManager identityFingerprint={identity} identityCircleFingerprint={icircle} />
        }
        {circle && 
          <CircleManager circleFingerprint={circle} />
        }

      </div>
    )
  }
}

export default withRouter(DashboardFellowary)