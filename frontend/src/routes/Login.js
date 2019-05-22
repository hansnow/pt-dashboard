/**
 * 登陆页
 */

import React, { useState, useEffect } from 'react'
import { Tabs, Input, Icon, Button, message } from 'antd'
import * as services from '../services'

function Login({ history }) {
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [loading, setLoading] = useState(false)
  async function checkLogin() {
    try {
      await services.getSiteList()
      history.push('/')
    } catch (err) {}
  }
  async function login() {
    setLoading(true)
    try {
      await services.login(loginUsername, loginPassword)
      message.success('登陆成功')
      history.push('/')
    } catch (err) {
      message.error(`登陆失败: ${err.message}`)
      console.log(err)
    }
    setLoading(false)
  }
  async function register() {
    setLoading(true)
    try {
      await services.register(registerUsername, registerPassword)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }
  // componentDidMount
  useEffect(() => {
    checkLogin()
  }, [])
  const userIcon = <Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />
  const lockIcon = <Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />
  return (
    <div className="login-wrap">
      <Tabs tabBarStyle={{ border: 'none' }}>
        <Tabs.TabPane tab="登陆" key="login">
          <Input
            allowClear
            placeholder="用户名"
            prefix={userIcon}
            value={loginUsername}
            onChange={e => setLoginUsername(e.target.value)}
          />
          <Input.Password
            allowClear
            placeholder="密码"
            prefix={lockIcon}
            style={{ marginTop: 8 }}
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            onPressEnter={login}
          />
          <Button
            type="primary"
            loading={loading}
            style={{ marginTop: 8, width: '100%' }}
            onClick={login}
          >
            登陆
          </Button>
        </Tabs.TabPane>
        <Tabs.TabPane tab="注册" key="register">
          <Input
            allowClear
            placeholder="用户名"
            prefix={userIcon}
            value={registerUsername}
            onChange={e => setRegisterUsername(e.target.value)}
          />
          <Input.Password
            allowClear
            placeholder="密码"
            prefix={lockIcon}
            style={{ marginTop: 8 }}
            value={registerPassword}
            onChange={e => setRegisterPassword(e.target.value)}
            onPressEnter={register}
          />
          <Button
            type="primary"
            loading={loading}
            style={{ marginTop: 8, width: '100%' }}
            onClick={register}
          >
            注册
          </Button>
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default Login
