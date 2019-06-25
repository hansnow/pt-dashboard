/**
 * 添加站点模态框
 */
import React, { useState } from 'react'
import { Modal, Form, Radio, Input, message } from 'antd'
import cronParser from 'cron-parser'
import { addSite } from '../../services'

export const FormItem = props => (
  <Form.Item {...props} wrapperCol={{ span: 13 }} labelCol={{ span: 7 }} />
)

export const ruleValidator = (_, value, callback) => {
  if (!value) return callback()
  try {
    cronParser.parseExpression(value)
    callback()
  } catch (err) {
    callback(err.message)
  }
}

function AddSiteModal({ visible, onCancel, fetchData, form }) {
  const [loading, setLoading] = useState(false)
  const { getFieldDecorator, validateFields } = form
  function submit() {
    validateFields(async (err, fields) => {
      if (err) return message.error('修正表单中的错误后重新提交')
      setLoading(true)
      const { type, username, password, otp, rule } = fields
      try {
        await addSite(type, username, password, otp, rule)
        message.success('添加站点成功')
        onCancel()
        fetchData()
      } catch (err) {
        message.error(err.message)
      }
      setLoading(false)
    })
  }
  return (
    <Modal
      destroyOnClose={true}
      title="添加站点"
      visible={visible}
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={loading}
    >
      <FormItem label="类型">
        {getFieldDecorator('type', {
          initialValue: 'mteam',
          rules: [{ required: true, message: '站点类型必填' }]
        })(
          <Radio.Group>
            <Radio value="mteam">M-Team</Radio>
            <Radio value="ourbits">Ourbits</Radio>
          </Radio.Group>
        )}
      </FormItem>
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
        {getFieldDecorator('otp', {
          rules: [{ required: true, message: 'OTP必填' }]
        })(<Input allowClear placeholder="OTP" />)}
      </FormItem>
      <FormItem label="抓取频率">
        {getFieldDecorator('rule', {
          initialValue: '55 23 * * *',
          rules: [
            { required: true, message: '抓取频率必填' },
            { message: 'crontab语句格式有误', validator: ruleValidator }
          ]
        })(<Input placeholder="抓取频率" />)}
      </FormItem>
    </Modal>
  )
}

export default Form.create()(AddSiteModal)
