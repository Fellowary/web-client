import React from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button } from 'antd'
import { Link } from 'react-router-dom'
import style from '../style.module.scss'

@Form.create()
@connect(({ user }) => ({ user }))
class Login extends React.Component {



  onSubmit = event => {
    // console.log("attempting login");
    event.preventDefault()
    const { form, dispatch, user: {invites} } = this.props
    form.validateFields((error, values) => {
      // console.log("validated", values, error);
      if (!error) {
        dispatch({
          type: 'user/SIGN_IN',
          payload: {...values, invites},
        })
      }
    })
  }

  render() {
    const {
      form,
      user: { loading },
      user
    } = this.props
    console.log(user);
    return (
      <div className={style.auth}>
        <div className="pt-5 pb-5 d-flex align-items-end mt-auto">
          <img src="/images/fellowary-fellows-500.png" className={style.fellowaryLogo} alt="Fellowary Logo" />
        </div>
        <div className={`${style.container} pl-5 pr-5 pt-5 pb-5 bg-white`}>
          <div className="text-dark font-size-30 mb-2 text-center">Log In</div>
          <div className="text-muted text-center mb-4">
            Login and password - testuser / password
          </div>
          <Form layout="vertical" hideRequiredMark onSubmit={this.onSubmit} className="mb-4">
            <Form.Item>
              {form.getFieldDecorator('extensionUsername', {
                initialValue: 'testuser',
                rules: [{ required: true, message: 'Please input your username' }],
              })(<Input size="large" placeholder="Extension Username" />)}
            </Form.Item>
            <Form.Item>
              {form.getFieldDecorator('extensionPassword', {
                initialValue: 'password',
                rules: [{ required: true, message: 'Please input your password' }],
              })(<Input size="large" type="password" placeholder="Password" />)}
            </Form.Item>
            <Button
              type="primary"
              size="large"
              className="text-center btn btn-success w-100 font-weight-bold font-size-18"
              htmlType="submit"
              loading={loading}
            >
              Log In
            </Button>
          </Form>
          <div className="text-center">
            <Link to="/system/forgot-password" className="text-blue font-weight-bold font-size-18">
              Forgot password?
            </Link>
          </div>
        </div>
        <div className="text-center font-size-18 pt-4 mb-auto">
          <span className="mr-2">Don&apos;t have an account?</span>
          <Link to="/system/register" className="font-weight-bold text-blue text-underlined">
            <u>Sign Up</u>
          </Link>
        </div>
        <div className="mt-auto pb-5 pt-5">
          <ul
            className={`${style.footerNav} list-unstyled d-flex mb-2 flex-wrap justify-content-center`}
          >
            <li>
              <a href="/terms">Terms of Use</a>
            </li>
            <li>
              <a href="/compliance">Compliance</a>
            </li>
            <li>
              <a href="/support">Support</a>
            </li>
            <li>
              <a href="/contact">Contacts</a>
            </li>
          </ul>
          <div className="text-gray-4 text-center">© 2021 Fellowary. All rights reserved.</div>
        </div>
      </div>
    )
  }
}

export default Login
