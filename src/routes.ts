import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as db from './db'
import { auth } from './middleware'
import { loginMteam, fetchMteam } from './pt-api'

const router = new Router<any, Koa.Context>()
router.use(['/whoami', '/views', '/site'], auth())

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

// 站点 - 添加
router.post('/site', async ctx => {
  const { type, username, password, otp } = ctx.request.body
  if (!type || !username || !password || !otp) {
    ctx.status = 400
    return (ctx.body = { msg: '所有字段必填' })
  }
  try {
    const cookies = await loginMteam(username, password, otp)
    const {
      username: siteUsername,
      uploaded,
      downloaded,
      magicPoint
    } = await fetchMteam(cookies)
    const user = await db.getUserByName(ctx.session.user)
    const site = await db.createSite(user._id, 'mteam', siteUsername, cookies)
    const record = await db.createRecord(
      site._id,
      uploaded,
      downloaded,
      magicPoint
    )
    await db.updateSite(site._id, { lastRecord: record._id })
    ctx.body = { msg: '添加站点成功' }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

// 站点 - 获取
router.get('/site', async ctx => {
  try {
    const user = await db.getUserByName(ctx.session.user)
    const sites = await db.getSitesByOwner(user._id, {
      owner: 0,
      __v: 0,
      cookies: 0
    })
    ctx.body = { sites }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

export const routes = () => router.routes()
export const allowedMethods = () => router.allowedMethods()
