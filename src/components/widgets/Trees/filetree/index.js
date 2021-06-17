import React from 'react'
import SortableTree, { changeNodeAtPath } from 'react-sortable-tree'
import { Scrollbars } from 'react-custom-scrollbars'

class AppsFileManager extends React.Component {
  state = {
    treeData: [
      { name: 'IT Manager', checked: true },
      {
        name: 'Regional Managers',
        expanded: true,
        children: [
          { name: 'Branch Manager', checked: true },
          { name: 'QA Engineer', checked: true },
          { name: 'Network Administrator', checked: false },
          { name: 'Project Manager', checked: false },
          { name: 'Team Leader', checked: true },
        ],
      },
    ],
  }

  render(){
    const { treeData } = this.state
    const getNodeKey = ({ treeIndex }) => treeIndex

    return (
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
          treeData={treeData}
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
              <span>{node.name}:</span>
            ),
          })}
        />
      </Scrollbars>
    )
  }
}

export default AppsFileManager