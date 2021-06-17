import React from 'react'
import { Layout } from 'antd'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import classNames from 'classnames'
import TopBar from 'components/layout/TopBar'
import MenuLeft from 'components/layout/MenuLeft'
import InnerMenuLeft from 'components/layout/InnerMenuLeft'
import MenuTop from 'components/layout/MenuTop'
// import Footer from 'components/layout/Footer'
import Sidebar from 'components/layout/Sidebar'

const mapStateToProps = ({ settings }) => ({ settings })

@withRouter
@connect(mapStateToProps)
class AppLayout extends React.PureComponent {
  render() {
    const {
      children,
      settings: {
        menuLayoutType,
        isContentNoMaxWidth,
        isAppMaxWidth,
        isGrayBackground,
        isSquaredBorders,
        isCardShadow,
        isBorderless,
        isTopbarFixed,
        isGrayTopbar,
      },
    } = this.props

    return (
      <Layout
        className={classNames({
          fel__layout__contentNoMaxWidth: isContentNoMaxWidth,
          fel__layout__appMaxWidth: isAppMaxWidth,
          fel__layout__grayBackground: isGrayBackground,
          fel__layout__squaredBorders: isSquaredBorders,
          fel__layout__cardsShadow: isCardShadow,
          fel__layout__borderless: isBorderless,
        })}
      >
        <Sidebar />
        {menuLayoutType === 'left' && <MenuLeft />}
        {menuLayoutType === 'top' && <MenuTop />}
        <InnerMenuLeft />
        <Layout>
          <Layout.Header
            className={classNames('fel__layout__header', {
              fel__layout__fixedHeader: isTopbarFixed,
              fel__layout__headerGray: isGrayTopbar,
            })}
          >
            <TopBar />
          </Layout.Header>
          <Layout.Content style={{ height: '100%', position: 'relative' }}>
            <div className="fel__utils__content">{children}</div>
          </Layout.Content>
          {/* <Layout.Footer>
            <Footer />
          </Layout.Footer> */}
        </Layout>
      </Layout>
    )
  }
}

export default AppLayout
