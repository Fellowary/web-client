import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import Switch from 'react-router-transition-switch'
import Loadable from 'react-loadable'
import { connect } from 'react-redux'

import Layout from 'layouts'
import Loader from 'components/layout/Loader'
import NotFoundPage from 'pages/system/404'

const loadable = loader =>
  Loadable({
    loader,
    delay: false,
    loading: () => <Loader />,
  })

const routes = [
  // Dashboards
  {
    path: '/files*',
    Component: loadable(() => import('pages/dashboard/files')),
    exact: true,
  },
  {
    path: '/social*',
    Component: loadable(() => import('pages/dashboard/social')),
    exact: true,
  },
  {
    path: '/manage*',
    Component: loadable(() => import('pages/dashboard/manage')),
    exact: true,
  },
  {
    path: '/dashboard/fellowary',
    Component: loadable(() => import('pages/dashboard/fellowary')),
    exact: true,
  },
  {
    path: '/system/500',
    Component: loadable(() => import('pages/system/500')),
    exact: true,
  },
  // System Pages
  {
    path: '/system/login',
    Component: loadable(() => import('pages/system/login')),
    exact: true,
  },
  {
    path: '/invites',
    Component: loadable(() => import('pages/system/invites')),
    exact: true,
  },
  {
    path: '/system/forgot-password',
    Component: loadable(() => import('pages/system/forgot-password')),
    exact: true,
  },
  {
    path: '/system/register',
    Component: loadable(() => import('pages/system/register')),
    exact: true,
  },
  {
    path: '/system/lockscreen',
    Component: loadable(() => import('pages/system/lockscreen')),
    exact: true,
  },
  {
    path: '/system/404',
    Component: loadable(() => import('pages/system/404')),
    exact: true,
  },
]

const mapStateToProps = ({ settings }) => ({ settings })

@connect(mapStateToProps)
class Router extends React.Component {
  render() {
    const {
      history,
      settings: { routerAnimation },
    } = this.props
    return (
      <ConnectedRouter history={history}>
        <Layout>
          <Switch
            render={props => {
              const {
                children,
                location: { pathname },
              } = props
              return (
                <SwitchTransition>
                  <CSSTransition
                    key={pathname}
                    classNames={routerAnimation}
                    timeout={routerAnimation === 'none' ? 0 : 300}
                  >
                    {children}
                  </CSSTransition>
                </SwitchTransition>
              )
            }}
          >
            <Route exact path="/" render={() => <Redirect to="/social" />} />
            {routes.map(({ path, Component, exact }) => (
              <Route path={path} key={path} exact={exact}>
                <Component />
              </Route>
            ))}
            <Route component={NotFoundPage} />
          </Switch>
        </Layout>
      </ConnectedRouter>
    )
  }
}

export default Router
