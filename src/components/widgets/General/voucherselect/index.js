import React from 'react'
import { Scrollbars } from 'react-custom-scrollbars'
import { Table, Avatar, Button } from 'antd'
import style from './style.module.scss'

class VoucherSelect extends React.Component {


  circleColumns = [
    {
      title: () => <Button className="spaced_icon" onClick={this.resetVouchers}><i className="fa fa-reply-all spaced_icon" />Reset</Button>,
      dataIndex: 'avatar',
      render: src => <Avatar className={style.avatar} shape="square" size="small" src={src} />
    },
    {
      title: 'Circle',
      dataIndex: 'namecombo',
      render: src => <div><div>{src.name}</div><div>{src.fingerprint}</div></div>
    }
  ];

  identityColumns = [
    {
      title: '',
      dataIndex: 'avatar',
      render: src => <Avatar className={style.avatar} shape="square" size="small" src={src} />
    },
    {
      title: 'Identity',
      dataIndex: 'namecombo',
      render: src => <div><div>{src.name}</div><div>{src.fingerprint}</div></div>
    }
  ];


  constructor(props){
    super(props);
    this.state.selectedCircleFingerprint = '';
    this.state.selectedVouchers = {};
  }

  /* selectRow = (fingerprint) => {
    const {selectedRowKeys} = this.state;
    if (selectedRowKeys.indexOf(fingerprint) >= 0) {
      selectedRowKeys.splice(selectedRowKeys.indexOf(fingerprint), 1);
    } else {
      selectedRowKeys.push(fingerprint);
    }
    // console.log("selectRow", selectedRowKeys);
    this.setState({ selectedRowKeys });
  } */

  /* selectRow = (record) => {
    const {selectedRowKeys} = this.state;
    if (selectedRowKeys.indexOf(record.key) >= 0) {
      selectedRowKeys.splice(selectedRowKeys.indexOf(record.key), 1);
    } else {
      selectedRowKeys.push(record.key);
    }
    // console.log("selectRow", selectedRowKeys);
    // this.setState({ selectedRowKeys });
    // this.state.selectedCircleFingerprint = selectedRowKeys[selectedRowKeys.length-1];
  } */


  onSelectedRowKeysChange = (selectedRowKeys) => { //eslint-disable-line
    // console.log("checkbox", selectedRowKeys);
    // this.setState({ selectedRowKeys });
    // this.state.selectedCircleFingerprint = selectedRowKeys[selectedRowKeys.length-1];
  }



  getIdentityData = (identities, circleFingerprint) => {
    const identityData = [];
    // console.log("getting identity data", identities, circleFingerprint);
    Object.entries(identities).forEach( ([fingerprint, identity]) => {
      if (identity.circles.includes(circleFingerprint) || identity.circles.includes(circleFingerprint.substr(0, circleFingerprint.length-4))){  // TODO
        identityData.push({
          key: fingerprint,
          avatar: identity.avatar,
          name: identity.name,
          namecombo: {name: identity.name, fingerprint},
          fingerprint
        });
        identityData.push({
          key: `${fingerprint}-xxx`,
          avatar: identity.avatar,
          name: identity.name,
          namecombo: {name: identity.name, fingerprint: `${fingerprint}-xxx`},
          fingerprint: `${fingerprint}-xxx`
        });
      }
    });

    return identityData;
  }

  selectCircle = (fingerprint) => {
    this.setState({selectedCircleFingerprint: fingerprint});
  }

  selectIdentity = (fingerprint) => {
    // console.log("selectIdentity", fingerprint);
    const {selectedCircleFingerprint, selectedVouchers} = this.state;
    if (selectedVouchers[selectedCircleFingerprint] === fingerprint){
      delete selectedVouchers[selectedCircleFingerprint];
    }
    else{
      selectedVouchers[selectedCircleFingerprint] = fingerprint;
    }
    // this.selectRow(selectedCircleFingerprint);
    // console.log("selectIdentity", selectedVouchers);
    this.setState(selectedVouchers);
  }

  resetVouchers = () => {
    const {selectedVouchers} = this.state;
    const entries = Object.entries(selectedVouchers);
    for (let i=0; i < entries.length; i+=1){
      delete selectedVouchers[entries[i][0]];
    }
    this.setState({selectedVouchers});
  }

  render(){
    const { circles, identities } = this.props //eslint-disable-line
    const { selectedCircleFingerprint, selectedVouchers } = this.state
    // console.log(circles, identities);
    // const { selectedRowKeys } = this.state;
    /* const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange,
    }; */

    // // console.log(Scrollbars, Table, circles, selectedVouchers, rowSelection);
    // console.log(selectedCircleFingerprint);

    return (
      <div className={[style.horizontal, 'row'].join(' ')}>
        <div className='col-lg-6' />
        <div className='col-lg-6'>
          <Scrollbars 
            autoHide
            renderThumbVertical={({ ...props }) => (
              <div
                {...props}
                style={{
                  width: '5px',
                  borderRadius: 'inherit',
                  backgroundColor: 'rgba(195, 190, 220, 0.4)',
                  left: '1px',
                }}
              />
            )}
          >
            <Table
              columns={this.identityColumns}
              rowClassName={(record) => 
                selectedVouchers[selectedCircleFingerprint] === record.fingerprint? style.complete: ''
              }
              dataSource={this.getIdentityData(identities, selectedCircleFingerprint)}
              onRow={(record) => ({
                onClick: () => {
                  this.selectIdentity(record.fingerprint);
                },
              })}
            />
          </Scrollbars>
        </div>
      </div>
    )
  }
}

export default VoucherSelect