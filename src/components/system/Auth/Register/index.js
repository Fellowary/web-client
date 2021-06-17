import React from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button, Spin } from 'antd'
import { Link } from 'react-router-dom'
import style from '../style.module.scss'

@Form.create()
@connect(({ user }) => ({ user }))
class Register extends React.Component {
  onSubmit = event => {
    event.preventDefault()
    const { form, dispatch } = this.props
    form.validateFields((error, values) => {
      if (!error) {
        dispatch({
          type: 'user/REGISTER',
          payload: values
        });

      }
    })
  }

  render() {
    const {
      form,
      user: { loading },
    } = this.props

    return (
      <div className={style.auth}>
        <div className="pt-5 pb-5 d-flex align-items-end mt-auto">
          <img src="/images/fellowary-fellows-500.png" className={style.fellowaryLogo} alt="Fellowary Logo" />
        </div>
        <div className={`${style.container} pl-5 pr-5 pt-5 pb-5 bg-white`}>
          <div className="text-dark font-size-30 mb-4 text-center">Create a Local Account</div>
          <Spin spinning={loading}>
            <Form layout="vertical" hideRequiredMark onSubmit={this.onSubmit} className="mb-4">
              <Form.Item>
                {form.getFieldDecorator('extensionUsername', {
                  initialValue: 'testuser',
                  rules: [{ required: true, message: 'Please input an extension username.' }],
                })(<Input size="large" placeholder="Extension Username" />)}
              </Form.Item>
              <Form.Item>
                {form.getFieldDecorator('extensionPassword', {
                  initialValue: 'password',
                  rules: [{ required: true, message: 'Please input an extension password.' }],
                })(<Input size="large" placeholder="Extension Password" />)}
              </Form.Item>
              <Button
                type="button"
                htmlType="submit"
                size="large"
                className="text-center btn btn-success w-100 font-weight-bold font-size-18"
              >
                Go
              </Button>
            </Form>
          </Spin>
        </div>
        <div className="text-center font-size-18 pt-4 mb-auto">
          <span className="mr-2">Already have an account?</span>
          <Link to="/system/login" className="font-weight-bold text-blue text-underlined">
            <u>Log In</u>
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
              <a href="/contacts">Contacts</a>
            </li>
          </ul>
          <div className="text-gray-4 text-center">© 2019 Fellowary inc. All rights reserved.</div>
        </div>
      </div>
    )
  }
}

export default Register
