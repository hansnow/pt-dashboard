/**
 * 更新站点信息模态框
 */
import React, { useState, useEffect } from 'react'
import { Modal, Form, Radio, Input, message } from 'antd'
import { FormItem, ruleValidator } from './AddSiteModal'
import { updateSite } from '../../services'

function UpdateSiteModal({ visible, onCancel, row, fetchData, form }) {
  const [loading, setLoading] = useState(false)
  const {
    getFieldDecorator,
    getFieldValue,
    setFieldsValue,
    validateFields
  } = form
  const type = getFieldValue('type')
  // 打开模态框时，同步当前条目的抓取频率
  useEffect(() => {
    if (visible === true) {
      setFieldsValue({
        rule: row.rule || '55 23 * * *'
      })
    }
  }, [visible])
  function submit() {
    validateFields(async (err, fields) => {
      if (err) return message.error('修正表单中的错误后重新提交')
      setLoading(true)
      const { type, username, password, otp, rule } = fields
      let payload = { rule }
      if (type === 'cookie') {
        payload = { ...payload, username, password, otp }
      }
      try {
        await updateSite(row._id, type, payload)
        message.success(
          type === 'cookie' ? '更新站点成功' : '更新站点抓取规则成功'
        )
        fetchData()
        onCancel()
      } catch (err) {
        message.error(err.message)
      }
      setLoading(false)
    })
  }
  return (
    <Modal
      destroyOnClose={true}
      title="更新站点"
      visible={visible}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={submit}
    >
      <FormItem label="更新类型">
        {getFieldDecorator('type', {
          initialValue: 'rule'
        })(
          <Radio.Group>
            <Radio value="rule">更新抓取频率</Radio>
            <Radio value="cookie">更新全部信息</Radio>
          </Radio.Group>
        )}
      </FormItem>
      {type === 'cookie' && (
        <>
          <FormItem label="用户名">
            {getFieldDecorator('username', {
              rules: [{ required: true, message: '用户名必填' }]
            })(<Input allowClear placeholder="用户名" />)}
          </FormItem>
          <FormItem label="密码">
            {getFieldDecorator('password', {
              rules: [{ required: true, message: '密码必填' }]
            })(<Input.Password allowClear placeholder="密码" />)}
          </FormItem>
          <FormItem label="OTP">
            {getFieldDecorator('otp')(<Input allowClear placeholder="OTP" />)}
          </FormItem>
        </>
      )}
      <FormItem label="抓取频率">
        {getFieldDecorator('rule', {
          rules: [
            { required: true, message: '抓取频率必填' },
            { message: 'crontab语句格式有误', validator: ruleValidator }
          ]
        })(<Input placeholder="抓取频率" />)}
      </FormItem>
    </Modal>
  )
}

export default Form.create()(UpdateSiteModal)
