import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as db from './db'
import { auth } from './middleware'

const router = new Router<any, Koa.Context>()
router.use(['/whoami', '/views'], auth())

// 用户 - 注册
router.post('/register', async ctx => {
  const { username, password } = ctx.request.body
  try {
    const user = await db.createUser(username, password)
    ctx.body = { msg: `用户 ${user.name} 创建成功` }
  } catch (err) {
    if (err.name === 'RegError') {
      ctx.status = 403
    } else {
      ctx.status = 500
    }
    ctx.body = { msg: err.message }
  }
})

// 用户 - 登录
router.post('/login', async ctx => {
  const { username, password } = ctx.request.body
  try {
    const user = await db.validateUser(username, password)
    ctx.session.user = user.name
    ctx.body = { msg: ` 用户 ${user.name} 登录成功` }
  } catch (err) {
    if (err.name === 'LoginError') {
      ctx.status = 401
    } else {
      ctx.status = 500
    }
    ctx.body = { msg: err.message }
  }
})

// 测试登录用户
router.get('/whoami', async ctx => {
  ctx.body = `You are ${ctx.session.user}`
})

router.get('/views', ctx => {
  if (ctx.path === '/favicon.ico') return
  let n = ctx.session.views || 0
  ctx.session.views = n + 1
  ctx.body = 'Hi ' + ctx.session.user + ' , you have visit ' + n + ' times.'
})

export const routes = () => router.routes()
export const allowedMethods = () => router.allowedMethods()
