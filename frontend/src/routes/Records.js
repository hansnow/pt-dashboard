/**
 * 抓取记录
 */
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Table, Button, message } from 'antd'
import { getRecords } from '../services'

function Records({ match, history }) {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })
  const [total, setTotal] = useState(0)
  async function fetchData() {
    setLoading(true)
    try {
      const resp = await getRecords(
        match.params.site,
        pagination.current,
        pagination.pageSize
      )
      const { total, records } = await resp.json()
      setRecords(records)
      setTotal(total)
    } catch (err) {
      message.error(err.message)
      if (err.code === 'E0401') {
        history.push('/login')
      }
      console.log(err)
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchData()
  }, [pagination])
  function handlePaginationChange(current, pageSize) {
    setPagination({ current, pageSize })
  }
  const columns = [
    { title: '上传量', dataIndex: 'uploaded' },
    { title: '下载量', dataIndex: 'downloaded' },
    { title: '魔力值', dataIndex: 'magicPoint' },
    {
      title: '更新时间',
      dataIndex: 'createdAt',
      render: v => format(new Date(v), 'YYYY-MM-DD HH:mm:ss')
    }
  ]
  const paginationOpt = {
    ...pagination,
    total,
    showTotal: () => `共 ${total} 条数据`,
    showSizeChanger: true,
    onChange: handlePaginationChange,
    onShowSizeChange: handlePaginationChange
  }
  const title = () => (
    <>
      <Button icon="arrow-left" onClick={() => history.push('/')}>
        返回站点列表
      </Button>
    </>
  )
  return (
    <Table
      rowKey="_id"
      title={title}
      loading={loading}
      columns={columns}
      dataSource={records}
      pagination={paginationOpt}
    />
  )
}

export default Records
