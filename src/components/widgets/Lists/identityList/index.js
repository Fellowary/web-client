import React from 'react'
import { Input, Avatar } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
// import { dispatch } from 'react-redux';

import style from './style.module.scss'

class IdentityList extends React.Component {

  constructor(props){
    super(props);
    const { fingerprint } = props;
    let { aggiList } = props
    if (!aggiList) aggiList = {};
    let i=0;
    for(const key in aggiList){ // eslint-disable-line
      if (aggiList[key].fingerprint === fingerprint){
        // console.log("found it, activeIndex", i);
        this.state.activeIndex = i;
        break;
      }
      ++i; // eslint-disable-line
    }
  }

  state = {
    activeIndex: 0,
    identityFilter: "",
  }

  UNSAFE_componentWillReceiveProps (nextProps){ //eslint-disable-line
    // // console.log("identitylist receive", nextProps);
    const { fingerprint } = nextProps;
    let { aggiList } = nextProps
    if (!aggiList) aggiList = {};
    let i=0;
    for(const key in aggiList){ // eslint-disable-line
      if (aggiList[key].fingerprint === fingerprint){
        // console.log("found it, activeIndex", i);
        this.state.activeIndex = i;
        break;
      }
      ++i; // eslint-disable-line
    }
  }

  changeDialog = (e, index) => {
    e.preventDefault()
    // console.log(index);
    this.setState({
      activeIndex: index,
    })
  }

  selectUser = (e, index) => {
    e.preventDefault();
    // console.log(index);
    this.setState({
      activeIndex: index,
    });
  }

  selectIdentity = (identity, e, index) => {
    const { selector } = this.props;
    e.preventDefault();
    // console.log("selectIdentity", identity, e, index);
    this.setState({
      activeIndex: index,
    });
    selector(identity);
  };

  filterIdentities = (e) => {
    // console.log("filter identities", e, e.target.value);
    this.setState({
      identityFilter: e.target.value.toLowerCase(),
    });
  };

  createFilteredList = (aggiList, filterName, shape) => {
    const {activeIndex} = this.state;
    const fList = [];
    let index=0;
    for (const key in aggiList){ // eslint-disable-line
      const i = index;
      if(aggiList[key].name.toLowerCase().includes(filterName)){
        fList.push(
          <a
            href="javascript: void(0);"
            onClick={(e) => this.selectIdentity(aggiList[key], e, i)}
            key={index}
            className={`${style.item} ${
              i === activeIndex ? style.current : ''
            } d-flex flex-nowrap align-items-center`}
          >
            <div className="mr-3 flex-shrink-0">
              <Avatar shape={shape} src={aggiList[key].avatar} alt={aggiList[key].name} />
            </div>
            <div className={`${style.info} flex-grow-1`}>
              <div className="text-dark font-size-15 font-weight-bold text-truncate">
                {aggiList[key].name}
              </div>
              <div className="text-dark font-size-8 text-truncate">
                {aggiList[key].fingerprint}
              </div>
            </div>
            <div
              hidden={!aggiList[key].unread}
              className={`${style.unread} flex-shrink-0 align-self-start`}
            >
              <div className="badge badge-success">{aggiList[key].unread}</div>
            </div>
          </a>
        );
      }
      ++index; // eslint-disable-line
    }
    return fList;
  }


  render(){
    const { identityFilter } = this.state;
    // const { name, position, dialog, avatar } = dialogs[activeIndex]
    let { aggiList } = this.props;
    const {shape} = this.props
    if(!aggiList) aggiList = {};
    const filteredList = this.createFilteredList(aggiList, identityFilter, shape);

    // console.log("identityList rendering", aggiList, identityFilter);
    return (
      <div className={style.identityListBackground}>
        <div className="mb-2">
          <Input
            prefix={<i className="fa fa-search" style={{ color: 'rgba(0,0,0,.25)' }} />}
            placeholder="Search..."
            onChange={this.filterIdentities}
          />
        </div>
        <div className={style.dialogs}>
          <Scrollbars
            autoHide
            renderThumbVertical={({ ...props }) => (
              <div
                {...props}
                style={{
                  width: '5px',
                  borderRadius: 'inherit',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  left: '1px',
                }}
              />
            )}
          >
            {filteredList}
          </Scrollbars>
        </div>
      </div> 

    )
  }
}

export default IdentityList