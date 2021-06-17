import React from 'react'
import { Helmet } from 'react-helmet'
import { Tabs, Form, Input, Button, Upload } from 'antd'
import ListFiller from 'components/widgets/Lists/filler'

const { TabPane } = Tabs
const FormItem = Form.Item

@Form.create()
class CircleManager extends React.Component {
  constructor(props){
    super(props);
    this.state.tabKey = '1';
  }

  changeTab = tabKey => {
    this.setState({
      tabKey,
    })
  }

  render() {
    const { tabKey } = this.state
    const { form } = this.props

    return (
      <div>
        <Helmet title="Apps: Profile" />
        <div className="fel__utils__heading">
          <h5>Circle Manager</h5>
        </div>
        <div className="row">
          <div className="col-xl-4 col-lg-12">
            <div className="card">
              <div className="card-body" />
            </div>
            <div className="card text-white bg-primary" />
            <div className="card">
              <div className="card-body" />
            </div>
            <div className="card">
              <div className="card-body">
                <ListFiller />
              </div>
            </div>
          </div>
          <div className="col-xl-8 col-lg-12">
            <div className="card">
              <div className="card-header card-header-flex flex-column">
                <div className="d-flex flex-wrap border-bottom pt-3 pb-4 mb-3">
                  <div className="mr-5">
                    <div className="text-dark font-size-18 font-weight-bold">David Beckham</div>
                    <div className="text-gray-6">@david100</div>
                  </div>
                  <div className="mr-5 text-center">
                    <div className="text-dark font-size-18 font-weight-bold">100</div>
                    <div className="text-gray-6">Posts</div>
                  </div>
                  <div className="mr-5 text-center">
                    <div className="text-dark font-size-18 font-weight-bold">17,256</div>
                    <div className="text-gray-6">Followers</div>
                  </div>
                </div>
                <Tabs
                  activeKey={tabKey}
                  className="mr-auto fel-tabs-bold"
                  onChange={this.changeTab}
                >
                  <TabPane tab="Agent Wall" key="1" />
                  <TabPane tab="Messages" key="2" />
                  <TabPane tab="Settings" key="3" />
                </Tabs>
              </div>
              <div className="card-body">
                {tabKey === '1' && (
                  <Form className="login-form">
                    <h5 className="text-black mt-4">
                      <strong>Personal Information</strong>
                    </h5>
                    <div className="row">
                      <div className="col-lg-6">
                        <FormItem label="Username">
                          {form.getFieldDecorator('userName', {
                            rules: [{ required: false }],
                          })(<Input placeholder="Username" />)}
                        </FormItem>
                      </div>
                      <div className="col-lg-6">
                        <FormItem label="Email">
                          {form.getFieldDecorator('email', {
                            rules: [{ required: false }],
                          })(<Input placeholder="Email" />)}
                        </FormItem>
                      </div>
                    </div>
                    <h5 className="text-black mt-4">
                      <strong>New Password</strong>
                    </h5>
                    <div className="row">
                      <div className="col-lg-6">
                        <FormItem label="Password">
                          {form.getFieldDecorator('password')(<Input placeholder="New password" />)}
                        </FormItem>
                      </div>
                      <div className="col-lg-6">
                        <FormItem label="Confirm Password">
                          {form.getFieldDecorator('confirmpassword')(
                            <Input placeholder="Confirm password" />,
                          )}
                        </FormItem>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <h5 className="text-black mt-4 mb-3">
                          <strong>Profile Avatar</strong>
                        </h5>
                        <Upload>
                          <Button>
                            <i className="fe fe-upload mr-2" /> Click to Upload
                          </Button>
                        </Upload>
                      </div>
                      <div className="col-lg-6">
                        <h5 className="text-black mt-4 mb-3">
                          <strong>Profile Background</strong>
                        </h5>
                        <Upload>
                          <Button>
                            <i className="fe fe-upload mr-2" /> Click to Upload
                          </Button>
                        </Upload>
                      </div>
                    </div>
                    <div className="form-actions">
                      <Button
                        style={{ width: 200 }}
                        type="primary"
                        htmlType="submit"
                        className="mr-3"
                      >
                        Submit
                      </Button>
                      <Button htmlType="submit">Cancel</Button>
                    </div>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default CircleManager
