import React from 'react'
import { HashRouter as Router, Route } from 'react-router-dom'
import { LocaleProvider } from 'antd'
import zhCN from 'antd/lib/locale-provider/zh_CN'
import Dashboard from './routes/Dashboard/Dashboard'
import Login from './routes/Login'
import Records from './routes/Records'

function App() {
  return (
    <LocaleProvider locale={zhCN}>
      <div className="container">
        <Router>
          <Route path="/" exact component={Dashboard} />
          <Route path="/login" component={Login} />
          <Route path="/site/:site" component={Records} />
        </Router>
      </div>
    </LocaleProvider>
  )
}

export default App
