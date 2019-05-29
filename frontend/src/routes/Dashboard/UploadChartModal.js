/**
 * 上传量历史图表
 */
import React, { useState, useEffect, useRef } from 'react'
import { Modal, Spin, message } from 'antd'
import { getChartData } from '../../services'

function UploadChartModal(props) {
  // 数据和图表库的加载状态
  const [loading, setLoading] = useState(false)
  // const [records, setRecords] = useState([])
  const chartDom = useRef(null)
  const { visible, onCancel, row } = props
  function refreshChart(records = [], echarts) {
    const option = {
      color: ['#3398DB'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // 坐标轴指示器，坐标轴触发有效
          type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
        },
        formatter: '{b}: {c}GB'
      },
      grid: {
        top: 30,
        left: '3%',
        right: 40,
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          name: '日期',
          data: records.map(r => r.date.slice(5)),
          axisTick: {
            alignWithLabel: true
          }
        }
      ],
      yAxis: [
        {
          name: '上传量(GB)',
          type: 'value'
        }
      ],
      series: [
        {
          name: '上传量',
          type: 'bar',
          barWidth: '60%',
          data: records.map(r => r.uploaded)
        }
      ]
    }
    const chart = echarts.init(chartDom.current)
    chart.setOption(option, true)
  }
  async function fetchData(delta) {
    setLoading(true)
    try {
      const resp = await getChartData(row._id, delta)
      const { records } = await resp.json()
      // setRecords(records)
      const echarts = await import('echarts')
      refreshChart(records.reverse(), echarts)
    } catch (err) {
      message.error(err.message)
    }
    setLoading(false)
  }
  useEffect(() => {
    if (visible) {
      fetchData()
    }
  }, [visible])
  return (
    <Modal
      title="上传量"
      visible={visible}
      onCancel={onCancel}
      destroyOnClose={true}
    >
      <Spin spinning={loading} size="large">
        <div ref={chartDom} style={{ height: 350 }} />
      </Spin>
    </Modal>
  )
}

export default UploadChartModal
