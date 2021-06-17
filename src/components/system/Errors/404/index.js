import React from 'react'
import { Link } from 'react-router-dom'
import style from '../style.module.scss'

class Error404 extends React.Component {
  render() {
    return (
      <div className={style.errors}>
        <div className="pt-4 pb-4 d-flex align-items-end mt-auto">
          <img src="/images/fellowary-logo.png" alt="Fellowary Logo" />
          <div className="fel__utils__logo__text">
            <div className="fel__utils__logo__name text-uppercase text-dark font-size-21">
              Fellowary
            </div>
            <div className="fel__utils__logo__descr text-uppercase font-size-12 text-gray-6">
              Fellowary
            </div>
          </div>
        </div>
        <div className={`${style.container} pl-5 pr-5 pt-5 pb-5 mb-auto text-dark font-size-30`}>
          <div className="font-weight-bold mb-3">Page not found</div>
          <div>This page is deprecated, deleted, or does not exist at all</div>
          <div className="font-weight-bold font-size-70 mb-1">404 —</div>
          <Link to="/" className="btn btn-outline-primary width-100">
            Go Back
          </Link>
        </div>
        <div className="mt-auto pb-5 pt-5">
          <ul
            className={`${style.footerNav} list-unstyled d-flex mb-2 flex-wrap justify-content-center`}
          >
            <li>
              <a href="#">Terms of Use</a>
            </li>
            <li>
              <a href="#">Compliance</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
            <li>
              <a href="#">Contacts</a>
            </li>
          </ul>
          <div className="text-gray-4 text-center">© 2021 Fellowary. All rights reserved.</div>
        </div>
      </div>
    )
  }
}

export default Error404
