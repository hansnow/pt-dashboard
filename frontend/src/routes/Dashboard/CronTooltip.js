/**
 * 将crontab表达式翻译为人类可读的语句
 */
import React, { useState, useEffect } from 'react'
import { Tooltip, Icon, Spin, message } from 'antd'
import { translateCron } from '../../services'

function CronTooltip({ cron }) {
  const [desc, setDesc] = useState('未知')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  async function fetchDesc() {
    setLoading(true)
    setDesc('未知')
    try {
      const resp = await translateCron(cron)
      const { description } = await resp.json()
      setDesc(description)
    } catch (err) {
      message.error(err.message)
    }
    setLoading(false)
  }
  useEffect(() => {
    if (visible) {
      fetchDesc()
    }
  }, [visible])
  return (
    <Tooltip
      trigger={['click']}
      title={loading ? <Spin spinning={true} size="small" /> : desc}
      visible={visible}
      onVisibleChange={visible => setVisible(visible)}
    >
      <span>{cron}</span>
      <Icon type="info-circle" style={{ marginLeft: 4, cursor: 'pointer' }} />
    </Tooltip>
  )
}

export default CronTooltip
