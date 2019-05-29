/**
 * 主页面
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Table, Button, Popconfirm, Icon, message } from 'antd'
import AddSiteModal from './AddSiteModal'
import UpdateSiteModal from './UpdateSiteModal'
import UploadChartModal from './UploadChartModal'
import CronTooltip from './CronTooltip'
import * as services from '../../services'

function Dashboard({ history }) {
  const [loading, setLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState({
    loading: false,
    rowKey: ''
  })
  const [sites, setSites] = useState([])
  // 添加站点模态框控制
  const [addSiteModalVisible, setAddSiteModalVisible] = useState(false)
  // 更新站点模态框控制
  const [updateSiteModalVisible, setUpdateSiteModalVisible] = useState(false)
  const [updateSiteModalRow, setUpdateSiteModalRow] = useState({})
  // 上传量图表模态框控制
  const [uploadChartModalVisible, setUploadChartModalVisible] = useState(false)
  const [uploadChartModalRow, setUploadChartModalRow] = useState({})
  async function fetchData() {
    setLoading(true)
    try {
      const resp = await services.getSiteList()
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
  async function logout() {
    try {
      await services.logout()
      history.push('/login')
      message.success('已退出登陆')
    } catch (err) {}
  }
  async function deleteSite(siteID) {
    try {
      await services.deleteSite(siteID)
      message.success('站点删除成功')
      fetchData()
    } catch (err) {
      message.error(err.message)
    }
  }
  async function refreshSite(siteID) {
    setRefreshLoading({ loading: true, rowKey: siteID })
    try {
      await services.refreshSite(siteID)
      fetchData()
      message.success('抓取成功')
    } catch (err) {
      message.error(err.message)
    }
    setRefreshLoading({ loading: false, rowKey: '' })
  }
  // componentDidMount
  useEffect(() => {
    fetchData()
  }, [])
  const title = () => (
    <div>
      <Button
        type="primary"
        icon="plus"
        onClick={() => setAddSiteModalVisible(true)}
      >
        添加站点
      </Button>
      <Button onClick={logout} style={{ marginLeft: 4 }}>
        退出登陆
      </Button>
    </div>
  )
  const columns = [
    {
      title: '站点类型',
      dataIndex: 'type',
      render: type => {
        if (type === 'mteam' || type === 'ourbits') {
          const imgSrcs = {
            mteam: 'https://i.loli.net/2019/05/27/5ceb32abd776f86645.png',
            ourbits: 'https://i.loli.net/2019/05/27/5ceb32abe5f6f46376.png'
          }
          return (
            <img
              src={imgSrcs[type]}
              alt={type}
              title={type}
              style={{ height: 24 }}
            />
          )
        }
        return '未知站点类型'
      }
    },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (name, row) => <Link to={'/site/' + row._id}>{name}</Link>
    },
    {
      title: '上传量',
      dataIndex: 'lastRecord.uploaded',
      render: (v, row) => (
        <span>
          {v}
          <Icon
            type="bar-chart"
            style={{ marginLeft: 4, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => {
              setUploadChartModalVisible(true)
              setUploadChartModalRow(row)
            }}
          />
        </span>
      )
    },
    { title: '下载量', dataIndex: 'lastRecord.downloaded' },
    { title: '魔力值', dataIndex: 'lastRecord.magicPoint' },
    {
      title: '抓取频率',
      dataIndex: 'rule',
      render: v => <CronTooltip cron={v} />
    },
    {
      title: '更新于',
      dataIndex: 'lastRecord.createdAt',
      render: v => format(new Date(v), 'YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      width: 250,
      dataIndex: 'operation',
      render: (_, row) => (
        <>
          <Button
            loading={
              refreshLoading.loading && refreshLoading.rowKey === row._id
            }
            type="primary"
            size="small"
            onClick={() => refreshSite(row._id)}
          >
            更新
          </Button>
          <Button
            size="small"
            onClick={() => {
              setUpdateSiteModalRow(row)
              setUpdateSiteModalVisible(true)
            }}
            style={{ marginLeft: 4 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该站点吗？"
            onConfirm={() => deleteSite(row._id)}
          >
            <Button size="small" style={{ marginLeft: 4 }}>
              删除
            </Button>
          </Popconfirm>
        </>
      )
    }
  ]
  return (
    <>
      <AddSiteModal
        visible={addSiteModalVisible}
        onCancel={() => setAddSiteModalVisible(false)}
        fetchData={fetchData}
      />
      <UpdateSiteModal
        visible={updateSiteModalVisible}
        onCancel={() => setUpdateSiteModalVisible(false)}
        row={updateSiteModalRow}
        fetchData={fetchData}
      />
      <UploadChartModal
        visible={uploadChartModalVisible}
        onCancel={() => setUploadChartModalVisible(false)}
        row={uploadChartModalRow}
      />
      <Table
        rowKey="_id"
        title={title}
        loading={loading}
        columns={columns}
        dataSource={sites}
        pagination={false}
      />
    </>
  )
}

export default Dashboard
