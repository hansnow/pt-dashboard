/**
 * Database Operation
 */

import * as mongoose from 'mongoose'
import { sha256, scheduleCrawlJob } from './util'

mongoose.connect('mongodb://localhost/pt_dashboard', {
  useNewUrlParser: true,
  connectTimeoutMS: 3000
})

// 用户表
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
  lastAccessAt: { type: Date, default: Date.now }
})
export interface IUser extends mongoose.Document {
  name: string
  password: string
  createdAt: Date
  lastAccessAt: Date
}
const User = mongoose.model<IUser>('User', userSchema, 'user')

// 站点(抓取任务)表
const siteSchema = new mongoose.Schema({
  /** ourbits | mteam */
  type: { type: mongoose.Schema.Types.String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cookies: mongoose.Schema.Types.String,
  username: mongoose.Schema.Types.String,
  /** node-schdule object literal syntax */
  rule: { type: mongoose.Schema.Types.String, default: '55 23 * * *' },
  lastRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'Record' }
})
export interface ISite extends mongoose.Document {
  type: mongoose.Schema.Types.String
  owner: mongoose.Schema.Types.ObjectId
  cookies: mongoose.Schema.Types.String
  username: mongoose.Schema.Types.String
  rule: mongoose.Schema.Types.String
  lastRecord: mongoose.Schema.Types.ObjectId
}
const Site = mongoose.model<ISite>('Site', siteSchema, 'site')

// 抓取记录
const recordSchema = new mongoose.Schema({
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  uploaded: mongoose.Schema.Types.String,
  downloaded: mongoose.Schema.Types.String,
  magicPoint: mongoose.Schema.Types.String,
  createdAt: { type: mongoose.Schema.Types.Date, default: Date.now }
})
export interface IRecord extends mongoose.Document {
  site: mongoose.Schema.Types.ObjectId
  uploaded: mongoose.Schema.Types.String
  downloaded: mongoose.Schema.Types.String
  magicPoint: mongoose.Schema.Types.String
  createdAt?: mongoose.Schema.Types.Date
}
const Record = mongoose.model<IRecord>('Record', recordSchema, 'record')

/** 创建用户 */
export async function createUser(name: string, pass: string) {
  const password = sha256(pass)
  const user = new User({ name, password })
  try {
    const res = await user.save()
    return res
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const e = Error(`user ${name} already exist`)
      e.name = 'RegError'
      throw e
    }
    throw err
  }
}

/** 验证用户 */
export async function validateUser(name: string, pass: string) {
  const password = sha256(pass)
  const user = await User.findOne({ name })
  if (user && user.password === password) {
    return user
  }
  const e = Error('用户名/密码错误')
  e.name = 'LoginError'
  throw e
}

/** 通过用户名获取用户 */
export async function getUserByName(name: string) {
  return await User.findOne({ name })
}

/** 创建站点(抓取任务) */
export async function createSite(
  owner: string,
  type: SiteType,
  username: string,
  cookies: string,
  rule: string
) {
  const site = new Site({ owner, type, username, cookies, rule })
  return await site.save()
}

/** 获取站点 */
export async function getAllSites() {
  return await Site.find()
}

export async function getSitesByOwner(
  owner: string,
  projection?: string | object
) {
  return await Site.find({ owner }, projection).populate('lastRecord', {
    _id: 0,
    site: 0,
    __v: 0
  })
}

export async function getSiteByID(_id: string) {
  return await Site.findOne({ _id })
}

/** 更新站点信息 */
export async function updateSite(_id: string, fields: any) {
  await Site.updateOne({ _id }, fields)
}

/** 删除站点 */
export async function deleteSite(_id: string) {
  await Site.deleteOne({ _id })
}

/** 创建抓取记录 */
export async function createRecord(
  site: string,
  uploaded: string,
  downloaded: string,
  magicPoint: string
) {
  const record = new Record({ site, uploaded, downloaded, magicPoint })
  return await record.save()
}

/** 获取抓取记录 */
export async function getRecords(site: string, page: number, limit: number) {
  const total = await Record.find({ site }).count()
  const records = await Record.find({ site }, { site: 0, __v: 0 })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
  return { total, records }
}

/** 获取绘图数据 */
export async function getChartRecords(
  site: string,
  startDate: Date,
  endDate: Date
) {
  const records = await Record.aggregate([
    { $project: { __v: 0 } },
    {
      $match: {
        site: new mongoose.Types.ObjectId(site),
        createdAt: { $gt: startDate, $lt: endDate }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Shanghai'
            }
          }
        },
        data: { $first: '$$ROOT' }
      }
    },
    { $sort: { 'data.createdAt': -1 } }
  ]).exec()
  return records
}

mongoose.connection.on('error', () => {
  console.error('Cannot connect to mongodb')
  process.exit(1)
})
mongoose.connection.once('open', () => {
  console.log('mongodb connected')
  scheduleCrawlJob()
})

// TODO: when to close connection
// process.on('SIGINT', function() {
//   mongoose.connection.close(() => {
//     console.log('mongodb connection is closed')
//     process.exit(0)
//   })
// })
