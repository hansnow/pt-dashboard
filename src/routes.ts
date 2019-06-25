import * as Koa from 'koa'
import * as Router from 'koa-router'
import { addDays, startOfDay, format } from 'date-fns'
import * as db from './db'
import { auth } from './middleware'
import getPT from './site-api'
import { reScheduleJob, req, toGB } from './util'
import { HttpError } from './custom-error'

const router = new Router<any, Koa.Context>()
router.use(['/whoami', '/views', '/site'], auth())

// solve CORS issue in
// https://cronexpressiondescriptor.azurewebsites.net
router.get('/cron-descriptor', async ctx => {
  try {
    const data = await req(
      `https://cronexpressiondescriptor.azurewebsites.net/api/descriptor/?expression=${
        ctx.query.cron
      }&locale=zh-CN`
    )
    ctx.body = { ...data }
  } catch (err) {
    throw new HttpError('FetchCronDescFailed')
  }
})

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

// 用户 - 注销
router.get('/logout', ctx => {
  ctx.session.user = null
  ctx.body = { msg: '注销成功' }
})

// 站点 - 添加
router.post('/site', async ctx => {
  const { type, username, password, otp, rule } = ctx.request.body
  if (!type || !username || !password || !rule) {
    ctx.status = 400
    return (ctx.body = { msg: '除OTP外，所有字段必填' })
  }
  const pt = getPT(type)
  try {
    const cookies = await pt.login(username, password, otp)
    const {
      username: siteUsername,
      uploaded,
      downloaded,
      magicPoint
    } = await pt.getAccountInfo()
    const user = await db.getUserByName(ctx.session.user)
    const site = await db.createSite(
      user._id,
      type,
      siteUsername,
      cookies,
      rule
    )
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

// 站点 - 更新
router.put('/site/:id', async ctx => {
  const { type, username, password, otp, rule } = ctx.request.body
  const { id } = ctx.params
  let fields = {}
  try {
    if (type === 'cookie') {
      const site = await db.getSiteByID(id)
      const pt = getPT(<SiteType>site.type.toString())
      const cookies = await pt.login(username, password, otp)
      const { uploaded, downloaded, magicPoint } = await pt.getAccountInfo()
      const record = await db.createRecord(id, uploaded, downloaded, magicPoint)
      fields = {
        cookies,
        rule,
        lastRecord: record._id
      }
      await db.updateSite(id, fields)
      return (ctx.body = { msg: '站点Cookie更新成功' })
    }
    fields = { rule }
    await db.updateSite(id, fields)
    reScheduleJob(id, rule)
    ctx.body = { msg: '站点抓取规则更新成功' }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

// 站点 - 删除
router.delete('/site/:id', async ctx => {
  try {
    const user = await db.getUserByName(ctx.session.user)
    const site = await db.getSiteByID(ctx.params.id)
    // TODO: _id居然是个object，不是string
    if (user._id.toString() === site.owner.toString()) {
      await db.deleteSite(ctx.params.id)
      return (ctx.body = { msg: '删除站点成功' })
    }
    ctx.status = 403
    ctx.body = { msg: '该站点不属于当前用户，无权进行操作' }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

// 站点 - 立即抓取
router.post('/site/:id/history', async ctx => {
  try {
    const user = await db.getUserByName(ctx.session.user)
    const site = await db.getSiteByID(ctx.params.id)
    if (user._id.toString() === site.owner.toString()) {
      const pt = getPT(<SiteType>site.type.toString())
      pt.init(site.cookies.toString())
      const { uploaded, downloaded, magicPoint } = await pt.getAccountInfo()
      const record = await db.createRecord(
        site._id,
        uploaded,
        downloaded,
        magicPoint
      )
      await db.updateSite(site._id, { lastRecord: record._id })
      return (ctx.body = { msg: '站点信息更新成功' })
    }
    ctx.status = 403
    ctx.body = { msg: '该站点不属于当前用户，无权进行操作' }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

// 站点 - 获取历史
router.get('/site/:id/history', async ctx => {
  try {
    const user = await db.getUserByName(ctx.session.user)
    const site = await db.getSiteByID(ctx.params.id)
    if (user._id.toString() === site.owner.toString()) {
      const page = ctx.query.page ? parseInt(ctx.query.page) : 1
      const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10
      return (ctx.body = await db.getRecords(site._id, page, limit))
    }
    ctx.status = 403
    ctx.body = { msg: '该站点不属于当前用户，无权进行操作' }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

// 站点 - 获取绘图数据
router.get('/site/:id/chart', async ctx => {
  const siteID = ctx.params.id
  let { delta } = ctx.query
  delta = delta ? parseInt(delta) : 7
  const now = new Date()
  const startDate = startOfDay(addDays(now, -delta - 1))
  const endDate = startOfDay(now)
  try {
    const records = await db.getChartRecords(siteID, startDate, endDate)
    // TODO: 这段代码的实现逻辑太直接，性能不太好，有时间要改掉
    let filledRecords = Array(delta + 1)
      .fill(0)
      .map((_, idx) => ({
        date: format(addDays(endDate, -idx - 1), 'YYYY-MM-DD')
      }))
      .map(({ date }) => {
        // @ts-ignore
        const target = records.find(r => r._id.date === date)
        if (target) {
          const {
            _id,
            uploaded,
            downloaded,
            magicPoint,
            createdAt
          } = target.data
          return {
            date,
            _id,
            uploaded,
            downloaded,
            magicPoint,
            createdAt
          }
        }
        return { date }
      })
    let calcedRecords = []
    // 临时用的工具函数
    const diff = (a: string, b: string, fn = toGB) =>
      Math.round((fn(a) - fn(b)) * 1e1) / 1e1
    const mpToNum = (mp: string) => parseFloat(mp.replace(',', ''))
    for (let i = 0; i < filledRecords.length - 1; i++) {
      const record = filledRecords[i]
      const nextRecord = filledRecords[i + 1]
      if (record._id && nextRecord._id) {
        calcedRecords.push({
          _id: `${record._id} - ${nextRecord._id}`,
          date: record.date,
          uploaded: diff(record.uploaded, nextRecord.uploaded)
          // downloaded: diff(record.downloaded, nextRecord.downloaded),
          // magicPoint: diff(record.magicPoint, nextRecord.magicPoint, mpToNum)
        })
      } else {
        calcedRecords.push({
          _id: `${record._id} - ${nextRecord._id}`,
          date: record.date,
          uploaded: 0
          // downloaded: 0,
          // magicPoint: 0
        })
      }
    }
    ctx.body = { records: calcedRecords }
  } catch (err) {
    ctx.status = 500
    ctx.body = { msg: err.message }
  }
})

export const routes = () => router.routes()
export const allowedMethods = () => router.allowedMethods()
