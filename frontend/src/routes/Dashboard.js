/**
 * 主页面
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Table, Button, Popconfirm, message } from 'antd'
import { getSiteList, logout } from '../services'

function Dashboard({ history }) {
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState([])
  async function fetchData() {
    setLoading(true)
    try {
      const resp = await getSiteList()
      const { sites: newSites } = await resp.json()
      setSites(newSites)
    } catch (err) {
      message.error(err.message)
      if (err.code === 'E0401') {
        history.push('/login')
      }
      console.log(err)
    }
    setLoading(false)
  }
  async function signOut() {
    try {
      await logout()
      history.push('/login')
      message.success('已退出登陆')
    } catch (err) {}
  }
  // componentDidMount
  useEffect(() => {
    fetchData()
  }, [])
  const title = () => (
    <div>
      <Button onClick={signOut}>退出登陆</Button>
    </div>
  )
  const columns = [
    { title: '站点类型', dataIndex: 'type' },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (name, row) => <Link to={'/site/' + row._id}>{name}</Link>
    },
    { title: '上传量', dataIndex: 'lastRecord.uploaded' },
    { title: '下载量', dataIndex: 'lastRecord.downloaded' },
    { title: '魔力值', dataIndex: 'lastRecord.magicPoint' },
    {
      title: '更新于',
      dataIndex: 'lastRecord.createdAt',
      render: v => format(new Date(v), 'YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (_, row) => (
        <>
          <Button type="primary" size="small">
            更新
          </Button>
          <Popconfirm title="确定要删除该站点吗？">
            <Button size="small" style={{ marginLeft: 4 }}>
              删除
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]
  return (
    <Table
      rowKey="_id"
      title={title}
      loading={loading}
      columns={columns}
      dataSource={sites}
      pagination={false}
    />
  )
}

export default Dashboard
