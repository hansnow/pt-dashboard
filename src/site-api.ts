/**
 * NexusPHP based PT site API
 */

// Usage
// const nexus = new NexusPHP('https://tp.m-team.cc/')
// // 1. login with username and password
// try {
//   const cookies = await nexus.login('username', 'password')
//   saveToDB(cookies)
//   const basicInfo = await nexus.getAccountInfo()
// } catch (e) {
//   if (e.name === 'NeedOTP') {
//     console.log('需要填写OTP才能登录')
//   } else if (e.name === 'WrongPassword') {
//     console.log('用户名或密码错误')
//   } else {
//     console.log('登录过程中发生错误')
//   }
// }
// // 2. login via cookie
// nexus.init('cookie string')
// const basicInfo = await nexus.getAccountInfo()

import { CookieJar } from 'tough-cookie'
import * as got from 'got'
import * as cheerio from 'cheerio'

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/73.0.3683.103 Safari/537.36'

function getClient(baseUrl: string, cookieJar: CookieJar) {
  return got.extend({
    baseUrl,
    cookieJar,
    headers: {
      'User-Agent': UA
    }
  })
}

class NexusPHP {
  public url: string
  public cookieJar: CookieJar
  public client: got.GotInstance<got.GotBodyFn<string>>

  constructor(url: string) {
    this.url = url
    const cookieJar = new CookieJar()
    this.cookieJar = cookieJar
    this.client = getClient(this.url, cookieJar)
  }

  init(cookies: string) {
    const cookieJar = CookieJar.fromJSON(cookies)
    this.client = getClient(this.url, cookieJar)
  }
}

export class Ourbits extends NexusPHP {
  constructor() {
    super('https://ourbits.club/')
  }
  async login(username: string, password: string, otp?: string) {
    // REF: 为什么got只能处理303的redirect
    // https://github.com/sindresorhus/got/issues/568
    try {
      const resp = await this.client.post('/takelogin.php', {
        headers: {
          // Referer字段必须有，否则会提示用户名或密码错误
          Referer: this.url + 'login.php',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${username}&password=${password}`
      })
      // either login success or otp page is a 302 response
      // so 200 would be an error
      if (resp.body.indexOf('用户名或密码不正确')) {
        const err = Error('用户名或密码错误')
        err.name = 'WrongPassword'
        throw err
      }
      const err = Error('登录过程中发生错误')
      err.name = 'LoginFailed'
      throw err
    } catch (e) {
      if (e.name === 'WrongPassword' || e.name === 'LoginFailed') {
        throw e
      }
      if (e.statusCode === 302) {
        // login success
        if (e.headers['location'].indexOf('index.php') > -1) {
          return JSON.stringify(this.cookieJar.toJSON())
        }
        // if (e.headers['location'].indexOf('verify.php') > -1) {
        //   if (!otp) {
        //     const err = Error('需要填写OTP才能登录')
        //     err.name = 'NeedOTP'
        //     throw err
        //   }
        // }
      }
      const err = Error('登录过程中发生错误')
      err.name = 'LoginFailed'
      throw err
    }
  }
  async getAccountInfo(): Promise<AccountInfo> {
    const resp = await this.client.get('/')
    const $ = cheerio.load(resp.body)
    // 是否还没签到
    const attendanceExist = $('a[href="attendance.php"]').length > 0
    if (attendanceExist) {
      await this.client.get('/attendance.php')
    }
    const username = $('span>a[href^="userdetails"]').text()
    const raw = $('.color_uploaded')
      .parent()
      .contents()
    try {
      let magicPoint = raw[14].data.replace(']:', '').trim()
      // 处理 '597,818.2 (签到已得100)' 这种情况
      // 注意，中间的不是空格(32)而是nbsp(160)！
      if (magicPoint.indexOf(' ') > -1) {
        magicPoint = magicPoint.split(' ')[0]
      }
      const uploaded = raw[attendanceExist ? 26 : 24].data.trim()
      const downloaded = raw[attendanceExist ? 28 : 26].data.trim()
      return {
        username,
        magicPoint,
        uploaded,
        downloaded
      }
    } catch (e) {
      if (e.name === 'TypeError') {
        // Cannot read property 'data' of null
        // 说明Cookie失效了
        const err = Error('Cookie已失效')
        err.name = 'CookieExpired'
        throw err
      }
      throw e
    }
  }
}

export class MTeam extends NexusPHP {
  constructor() {
    super('https://tp.m-team.cc/')
  }
  async login(
    username: string,
    password: string,
    otp?: string
  ): Promise<string> {
    // REF: 为什么got只能处理303的redirect
    // https://github.com/sindresorhus/got/issues/568
    try {
      const resp = await this.client.post('/takelogin.php', {
        headers: {
          // Referer字段必须有，否则会提示用户名或密码错误
          Referer: this.url + 'login.php',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${username}&password=${password}`
      })
      // either login success or otp page is a 302 response
      // so status=200 would be an error
      const err = Error('登录过程中发生错误')
      err.name = 'LoginFailed'
      throw err
    } catch (e) {
      if (e.name === 'LoginFailed') {
        throw e
      }
      if (e.statusCode === 302) {
        // login success
        if (e.headers['location'].indexOf('index.php') > -1) {
          return JSON.stringify(this.cookieJar.toJSON())
        }
        // wrong password
        if (e.headers['location'].indexOf('login.php') > -1) {
          const err = Error('用户名或密码错误')
          err.name = 'WrongPassword'
          throw err
        }
        // OTP required
        if (e.headers['location'].indexOf('verify.php') > -1) {
          // blank otp, throw error
          if (!otp) {
            const err = Error('需要填写OTP才能登录')
            err.name = 'NeedOTP'
            throw err
          }
          // otp verification
          const otpURL = e.headers['location']
          // TODO: is try-catch in try-catch an anti-pattern?
          try {
            await this.client.get(otpURL)
            await this.client.post(otpURL, {
              headers: {
                Referer: otpURL,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `otp=${otp}`
            })
            const err = Error('OTP认证失败')
            err.name = 'WrongOTP'
            throw err
          } catch (ee) {
            if (ee.name === 'err') {
              throw ee
            }
            if (
              ee.statusCode === 302 &&
              ee.headers['location'].indexOf('index.php') > -1
            ) {
              return JSON.stringify(this.cookieJar.toJSON())
            }
            const err = Error('OTP认证失败')
            err.name = 'WrongOTP'
            throw err
          }
        }
      }
      const err = Error('登录过程中发生错误')
      err.name = 'LoginFailed'
      throw err
    }
  }
  async getAccountInfo(): Promise<AccountInfo> {
    const resp = await this.client.get('/')
    const $ = cheerio.load(resp.body)
    const username = $('a[href^="userdetails"]').text()
    const raw = $('.color_uploaded')
      .parent()
      .contents()
    try {
      const magicPoint = raw[14].data.replace(']:', '').trim()
      const uploaded = raw[24].data.trim()
      const downloaded = raw[26].data.trim()
      return {
        username,
        magicPoint,
        uploaded,
        downloaded
      }
    } catch (e) {
      if (e.name === 'TypeError') {
        // Cannot read property 'data' of null
        // 说明Cookie失效了
        const err = Error('Cookie已失效')
        err.name = 'CookieExpired'
        throw err
      }
      throw e
    }
  }
}

export default function getPT(type: SiteType) {
  let pt = null
  if (type === 'mteam') {
    pt = new MTeam()
  } else if (type === 'ourbits') {
    pt = new Ourbits()
  } else {
    const err = Error('未知站点流程')
    err.name = 'UnknownSiteType'
    throw err
  }
  return pt
}
