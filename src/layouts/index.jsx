import React, { Fragment } from 'react'
import { withRouter, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import NProgress from 'nprogress'
import { Helmet } from 'react-helmet'
import Loader from 'components/layout/Loader'
import PublicLayout from './Public'
import AuthLayout from './Auth'
import AppLayout from './App'
import {isObjectEmpty} from '../utilities'

const Layouts = {
  public: PublicLayout,
  auth: AuthLayout,
  app: AppLayout,
  invites: AuthLayout
}

@withRouter
@connect(({ dispatch, user, identities }) => ({ dispatch, user, identities }))
class Layout extends React.PureComponent {
  previousPath = ''

  constructor(props){
    super(props);

    const {dispatch, location} = this.props;
    if(this.isInvite(location.pathname)){
      dispatch({
        type: 'user/ADD_INVITE',
        payload:{
          inviteUrl: location.pathname
        }
      });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps){ //eslint-disable-line
    const {dispatch} = this.props;
    const {location: nextLocation} = nextProps;

    // console.log("layout locations", currentLocation, nextLocation);
    if(this.isInvite(nextLocation.pathname)){
      // console.log("layout identityFingerprint, pathname", parsedIdentityFingerprint, nextLocation.pathname);
      dispatch({
        type: 'user/ADD_INVITE',
        payload:{
          inviteUrl: nextLocation.pathname
        }
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props
    const { prevLocation } = prevProps
    if (location !== prevLocation) {
      window.scrollTo(0, 0)
    }
  }


  isInvite = (currentPath) => {
    const isAnInvite = currentPath.startsWith('/i/');
    // console.log("layout processing invite", currentPath, this.previousPath);
    return isAnInvite;
  }


  render() {
    const {
      children,
      location: { pathname, search },
      user,
    } = this.props;

    // NProgress Management
    const currentPath = pathname + search;
    // // console.log("currentPath", currentPath, this.previousPath);

    // console.log("layout currentPath", currentPath, this.previousPath);
    if (currentPath !== this.previousPath) {
      NProgress.start();
    }
    const wasInvited = this.isInvite(currentPath);
    let inviteRedirectPath = "";

    // if we're using an invite just send them back to where they came. or login if they haven't already.
    if (wasInvited){
      inviteRedirectPath = this.previousPath ? this.previousPath : "/system/login";
    }

    setTimeout(() => {
      NProgress.done()
      this.previousPath = currentPath;
    }, 300);

    // Layout Rendering
    const getLayout = () => {
      if (pathname === '/') {
        return 'public';
      }
      if (/^\/system(?=\/|$)/i.test(pathname)) {
        return 'auth';
      }
      if (/^\/invites(?=\/|$)/i.test(pathname)) {
        return 'invites';
      }
      return 'app';
    }

    const Container = Layouts[getLayout()];
    const isUserAuthorized = user.authorized;
    const isUserLoading = user.loading;
    const isAuthLayout = getLayout() === 'auth';
    const isInviteLayout = getLayout() === 'invites';

    const BootstrappedLayout = () => {
      if(wasInvited){
        // console.log("was invited");
        return <Redirect to={inviteRedirectPath} />
      }

      // show loader when user in check authorization process, not authorized yet and not on login pages
      if (isUserLoading && !isUserAuthorized && !isAuthLayout) {
        // console.log("user is loading");
        return <Loader />
      }

      if(!isInviteLayout && isUserAuthorized && (!isObjectEmpty(user.invites) || user.currentInvitation)) {
        // console.log("invite layout and we have invites");
        return <Redirect to="/invites" />
      }
      // redirect to login page if current is not login page and user not authorized
      if (!isAuthLayout && !isUserAuthorized) {
        // console.log("is not authLayout")
        return <Redirect to="/system/login" />
      }

      if(isAuthLayout && isUserAuthorized){
        // console.log("it's the auth layout but we're already authorized.  sending to the root path");
        return <Redirect to="/" />
      }
      
      
      // console.log("loading children");
      // // if we're logged in and have invites redirect to the invite page
      // if(isAuthLayout && isUserAuthorized && !isObjectEmpty(user.invites)){
      //   console.log("user is authorized and we have invites");
      //   return <Redirect to="/invites" />
      // }

      // in other case render previously set layout
      return <Container>{children}</Container>
    }

    return (
      <>
        <Helmet titleTemplate="Fellowary | %s" title="Fellowary" />
        {BootstrappedLayout()}
      </>
    )
  }
}

export default Layout
