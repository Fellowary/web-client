import React from 'react'
import { Form, Input, Button } from 'antd'
import { Link } from 'react-router-dom'
import style from '../style.module.scss'

@Form.create()
class ForgotPassword extends React.Component {
  onSubmit = event => {
    event.preventDefault()
    const { form } = this.props
    form.validateFields((error, values) => { //eslint-disable-line
      if (!error) {
        // console.log(values)
      }
    })
  }

  render() {
    const { form } = this.props

    return (
      <div className={style.auth}>
        <div className="pt-5 pb-5 d-flex align-items-end mt-auto">
          <img src="/images/fellowary-logo.png" alt="Fellowary Logo" />
          <div className="fel__utils__logo__text">
            <div className="fel__utils__logo__name text-uppercase text-dark font-size-21">
              Fellowary
            </div>
            <div className="fel__utils__logo__descr text-uppercase font-size-12 text-gray-6">
              Chat
            </div>
          </div>
        </div>
        <div className={`${style.container} pl-5 pr-5 pt-5 pb-5 bg-white text-center`}>
          <div className="text-dark font-size-30 mb-4">Reset Password</div>
          <Form layout="vertical" hideRequiredMark onSubmit={this.onSubmit} className="mb-4">
            <Form.Item>
              {form.getFieldDecorator('email', {
                rules: [{ required: true, message: 'Please input your e-mail address' }],
              })(<Input size="large" placeholder="Email" />)}
            </Form.Item>
            <Button
              type="button"
              htmlType="submit"
              size="large"
              className="text-center btn btn-success w-100 font-weight-bold font-size-18"
            >
              Reset my password
            </Button>
          </Form>
        </div>
        <div className="text-center font-size-18 pt-4 mb-auto">
          <Link to="/system/login" className="font-weight-bold text-blue">
            <i className="fe fe-arrow-left align" />
            Go Back
          </Link>
        </div>
        <div className="mt-auto pb-5 pt-5">
          <ul
            className={`${style.footerNav} list-unstyled d-flex mb-2 flex-wrap justify-content-center`}
          >
            <li>
              <a href="javascript: void(0);">Terms of Use</a>
            </li>
            <li>
              <a href="javascript: void(0);">Compliance</a>
            </li>
            <li>
              <a href="javascript: void(0);">Support</a>
            </li>
            <li>
              <a href="javascript: void(0);">Contacts</a>
            </li>
          </ul>
          <div className="text-gray-4 text-center">© 2021 Fellowary. All rights reserved.</div>
        </div>
      </div>
    )
  }
}

export default ForgotPassword
