import * as Koa from 'koa'
import * as session from 'koa-session'
import * as bodyParser from 'koa-bodyparser'

import { routes, allowedMethods } from './routes'
import { httpErrorHandler } from './custom-error'

const PORT = 4000

const app = new Koa()
app.keys = ['l7ry%2=+$0eevbeu5s1aw^_(*t$h0yg!b4h2i+_^(l@o_#(6zz']

// 事实证明middleware的顺序的确不能随便写
// 比如bodyParser写在后面的话，路由里ctx.request.body就会不可用
app.use(httpErrorHandler())

app.use(session({ key: 'pd' }, app))

app.use(bodyParser())

app.use(routes()).use(allowedMethods())

app.listen(PORT, () => {
  console.log('app started at port ' + PORT)
})
