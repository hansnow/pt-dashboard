import { createHmac } from 'crypto'
import * as https from 'https'
import * as schedule from 'node-schedule'
import { getAllSites, createRecord, updateSite } from './db'
import { fetchMteam } from './pt-api'

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
    // TODO: <string><unknown> 把这个破玩意儿去掉
    const jobName = getJobName(site._id.toString())
    const j = schedule.scheduleJob(jobName, site.rule.toString(), async () => {
      const d = new Date()
      try {
        const { uploaded, downloaded, magicPoint } = await fetchMteam(<string>(
          (<unknown>site.cookies)
        ))
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
