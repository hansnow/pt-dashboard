import { createHmac } from 'crypto'
import * as https from 'https'
import * as schedule from 'node-schedule'
import { getAllSites, createRecord, updateSite } from './db'
import getPT from './site-api'

export const secret = '!)5&!h-x6w!o#32jkmwj1wue*4etx&h*+2$izq7t1e65932@5m'

export function sha256(s: string) {
  return createHmac('sha256', secret)
    .update(s)
    .digest('hex')
}

// 生成Job名
function getJobName(id: string) {
  return 'site-' + id
}

// 数据库连接之后，执行站点的抓取调度
export async function scheduleCrawlJob() {
  const sites = await getAllSites()
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i]
    const jobName = getJobName(site._id.toString())
    const j = schedule.scheduleJob(jobName, site.rule.toString(), async () => {
      const d = new Date()
      const pt = getPT(<SiteType>site.type.toString())
      pt.init(site.cookies.toString())
      try {
        const { uploaded, downloaded, magicPoint } = await pt.getAccountInfo()
        const record = await createRecord(
          site._id,
          uploaded,
          downloaded,
          magicPoint
        )
        await updateSite(site._id, { lastRecord: record._id })
        console.log(
          `[Job Done] ${d.toISOString()} <${site.type}>${
            site.username
          } ${uploaded},${downloaded},${magicPoint}`
        )
      } catch (err) {
        console.log(`[Job Error] ${d.toISOString()}`, err)
      }
    })
    console.log(`[Job Added] <${site.type}>${site.username} rule: ${site.rule}`)
  }
}

// 更新Job执行频率
export async function reScheduleJob(id: string, rule: string) {
  const jobName = getJobName(id)
  schedule.rescheduleJob(jobName, rule)
  console.log(`[Job Rescheduled] ${jobName} ${rule}`)
}

// 一个简陋的HTTP客户端
export function req(url: string) {
  return new Promise((resolve, reject) => {
    https
      .get(url, resp => {
        let data = ''
        resp.on('data', chunk => (data += chunk))
        resp.on('end', () => {
          resolve(JSON.parse(data))
        })
      })
      .on('error', err => {
        reject(err)
      })
  })
}

// 存储进制转换
// '27.391 TB' -> 27391
// '895.23 GB' -> 895.23
export function toGB(str: string) {
  if (str.endsWith('TB')) {
    return parseFloat(str.replace('TB', '')) * 1e3
  } else if (str.endsWith('GB')) {
    return parseFloat(str.replace('TB', ''))
  } else {
    throw new Error('[toGB] 不认识的单位')
  }
}
