import React from 'react'
import { connect } from 'react-redux'
import { Checkbox } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
import SortableTree, { changeNodeAtPath } from 'react-sortable-tree'
import style from './style.module.scss'

@connect(({ circleTree }) => ({ circleTree }))
class CircleTree extends React.Component {
  state = {
  }

  render(){
    const { circleTree } = this.props
    // console.log("printing circleTree", circleTree);
    // const { circleTree } = this.props
    const getNodeKey = ({ treeIndex }) => treeIndex

    return (
      <div className={style.horizontal}>
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
          <SortableTree
            treeData={circleTree}
            canDrag={false}
            onChange={tree => this.setState({ treeData: tree })}
            generateNodeProps={({ node, path }) => ({
              title: !node.children ? (
                <Checkbox
                  checked={node.checked}
                  onChange={event => {
                    const { checked } = event.target

                    this.setState(state => ({
                      treeData: changeNodeAtPath({
                        treeData: state.treeData,
                        path,
                        getNodeKey,
                        newNode: { ...node, checked },
                      }),
                    }))
                  }}
                >
                  {node.name}
                </Checkbox>
              ) : (
                <Checkbox
                  checked={node.checked}
                  onChange={event => {
                    const { checked } = event.target

                    this.setState(state => ({
                      treeData: changeNodeAtPath({
                        treeData: state.treeData,
                        path,
                        getNodeKey,
                        newNode: { ...node, checked },
                      }),
                    }))
                  }}
                >
                  {node.name}
                </Checkbox>
              ),
            })}
          />
        </Scrollbars>
      </div>
    )
  }
}

export default CircleTree