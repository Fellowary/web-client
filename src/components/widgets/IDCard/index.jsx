import React from 'react'
import { Button, Input } from 'antd'
import style from './style.module.scss'

const { Search } = Input

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class IdentityCardBig extends React.Component {

  state = {
    working: false,
    voucherInputOpen: false,
    requestingVouch: false,
    requesterInputOpen: false,
    checkingForVouch: false,
    uploadingKey: false,
  };

  cardRequestVouch = (voucherFingerprint) => {
    // console.log("cardrequestvouch", voucherFingerprint);
    const {requestVouch} = this.props;
    const {requestingVouch} = this.state;
    if (requestingVouch){
      return;
    }
    this.setState({requestingVouch: true});
    wait(1000).then(()=>{
      this.voucherInput()
    })

    requestVouch(voucherFingerprint);
  };

  cardCheckForVouch = (requesterFingerprint) => {
    const {checkForVouch} = this.props
    // console.log("checkForVouch", requesterFingerprint);
    const {checkingForVouch} = this.state;
    if (checkingForVouch){
      return;
    }
    this.setState({checkingForVouch: true});
    wait(1000).then(()=>{
      this.requesterInput();
    });

    checkForVouch(requesterFingerprint);
  }

  voucherInput = () => {
    const { working, voucherInputOpen } = this.state;

    this.setState({
      working: !working,
      voucherInputOpen: !voucherInputOpen,
      requesterInputOpen: false,
      requestingVouch: false,
      checkingForVouch: false,
    });
  }

  requesterInput = () => {
    const { working, requesterInputOpen } = this.state;
    this.setState({
      working: !working,
      requesterInputOpen: !requesterInputOpen,
      voucherInputOpen: false,
      requestingVouch: false,
      checkingForVouch: false,
    });
  }

  cardUploadKey = () =>{
    const {uploadKey} = this.props;
    // eslint-disable-next-line
    setTimeout(function(){
      this.setState({uploadingKey: false});
    }.bind(this), 1000);
    uploadKey();
  }

  render() {
    const { avatar, name, fingerprint, publicFingerprint } = this.props;
    const { working, voucherInputOpen, requesterInputOpen, uploadingKey, checkingForVouch, requestingVouch } = this.state;
    return (
      <div className="d-flex flex-wrap flex-column align-items-center">
        <div className="fel__utils__avatar fel__utils__avatar--size64 mb-3">
          <img src={avatar} alt={name} />
        </div>
        <div className="text-center">
          <div className="text-dark font-weight-bold font-size-18">{name}</div>
          <div className="font-size-12 mb-3">Core Fingerprint: {fingerprint}</div>
          <div className="font-size-12 mb-3">Publicizable Fingerprint: {publicFingerprint}</div>
          {!working && 
            <div>
              <Button className={style.invite_button} loading={uploadingKey} onClick={this.cardUploadKey}>
                <span className="btn-addon">
                  <i className="btn-addon-icon fa fa-cloud-upload" />
                </span>
                Publicize
              </Button>
              <button type="button" className="btn btn-primary btn-with-addon mr-1 mb-1" onClick={this.voucherInput}>
                <span className="btn-addon">
                  <i className="btn-addon-icon fe fe-chevrons-up" />
                </span>
                Request Vouching
              </button>
              <button type="button" className="btn btn-primary btn-with-addon mb-1" onClick={this.requesterInput}>
                <span className="btn-addon">
                  <i className="btn-addon-icon fe fe-chevrons-down" />
                </span>
                Get Requests
              </button>
            </div>
          }
          {voucherInputOpen &&
            <div>
              <Search
                className={style.invite_button}
                placeholder="Voucher's fingerprint"
                enterButton="Send Vouch Request"
                style={{"width": 400}}
                loading={requestingVouch}
                onSearch={voucherFingerprint => this.cardRequestVouch(voucherFingerprint)}
              />
              <Button className={`${style.cancel_button} btn btn-danger lh-1`} onClick={this.voucherInput}>
                <i className="fa fa-close" />
              </Button>
            </div>
          }
          {requesterInputOpen &&
            <div>
              <Search
                className={style.invite_button}
                placeholder="Requester's fingerprint"
                enterButton="Check Vouch Requests"
                style={{"width": 400}}
                loading={checkingForVouch}
                onSearch={requesterFingerprint => this.cardCheckForVouch(requesterFingerprint)}
              />
              <Button className={`${style.cancel_button} btn btn-danger lh-1`} onClick={this.requesterInput}>
                <i className="fa fa-close" />
              </Button>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default IdentityCardBig
