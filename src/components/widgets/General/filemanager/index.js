import React from 'react'
// import FileTree from 'components/widgets/Trees/filetree'
import FileTable from 'components/widgets/Tables/filetable'

/* import { Table, Checkbox } from 'antd'
import { Scrollbars } from 'react-custom-scrollbars'
import FileList from 'components/widgets/Lists/filelist'
import CircleList from 'components/widgets/Lists/circlelist'
*/

class AppsFileManager extends React.Component {


  render(){
    return (
      <div>
        {/* <FileTree /> Not sure if we want this or not... */}
        <FileTable />
      </div>
    )
  }
}

export default AppsFileManager