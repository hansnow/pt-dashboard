import * as Koa from 'koa'
import * as session from 'koa-session'
import * as bodyParser from 'koa-bodyparser'

import { routes, allowedMethods } from './routes'
const app = new Koa()
app.keys = ['l7ry%2=+$0eevbeu5s1aw^_(*t$h0yg!b4h2i+_^(l@o_#(6zz']

// 事实证明middleware的顺序的确不能随便写
// 比如bodyParser写在后面的话，路由里ctx.request.body就会不可用
app.use(session({ key: 'pd', maxAge: 10000 }, app))

app.use(bodyParser())

app.use(routes()).use(allowedMethods())

app.listen(3000, () => {
  console.log('app started at port 3000')
})
