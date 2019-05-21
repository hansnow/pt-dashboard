import * as got from 'got'
import { CookieJar } from 'tough-cookie'
import * as cheerio from 'cheerio'

export const ourbitsUrl = 'https://ourbits.club/'
export const mteamUrl = 'https://tp.m-team.cc/'

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/73.0.3683.103 Safari/537.36'

export function getClient(
  site: SiteType,
  cookieJar: CookieJar
): got.GotInstance<got.GotBodyFn<string>> {
  let baseUrl = ourbitsUrl
  if (site === 'mteam') {
    baseUrl = mteamUrl
  }
  return got.extend({
    baseUrl,
    cookieJar,
    headers: {
      'User-Agent': UA
    }
  })
}

/** 登陆mteam获取cookie */
// REF: 为什么got只能处理303的redirect
// https://github.com/sindresorhus/got/issues/568
export async function loginMteam(
  username: string,
  password: string,
  otp?: string
) {
  const cookieJar = new CookieJar()
  const client = getClient('mteam', cookieJar)
  let nextUrl = ''
  try {
    await client.post('/takelogin.php', {
      headers: {
        // Referer字段必须有，否则会提示用户名或密码错误
        Referer: 'https://tp.m-team.cc/login.php',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${username}&password=${password}`
    })
    // 请求结果状态码是200，显然有问题
    const err = Error('mteam登陆出现异常，StatusCode=200')
    err.name = 'MteamLoginFailed'
    throw err
  } catch (err) {
    if (err.name === 'MteamLoginFailed') {
      throw err
    }
    if (
      err.statusCode === 302 &&
      err.headers['location'].indexOf('verify.php') > -1
    ) {
      nextUrl = err.headers['location']
    } else {
      const e = new Error('mteam登陆出现异常，返回结果与预期不符')
      e.name = 'MteamLoginFailed'
      throw e
    }
  }
  // 这里必须先访问一次OTP页面
  await client.get(nextUrl)
  try {
    await client.post(nextUrl, {
      headers: {
        Referer: nextUrl,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `otp=${otp}`
    })
    const e = Error('mteam两步验证出现异常，StatusCode=200')
    e.name = 'MteamOTPFailed'
    throw e
  } catch (err) {
    if (err.name === 'MteamOTPFailed') {
      throw err
    }
    if (
      err.statusCode === 302 &&
      err.headers['location'].indexOf('index.php') > -1
    ) {
      return JSON.stringify(cookieJar.toJSON())
    }
    const e = new Error('mteam两步验证出现异常，返回结果与预期不符')
    e.name = 'MteamOTPFailed'
    throw e
  }
}

/** 获取mteam站点信息 */
export async function fetchMteam(cookies: string) {
  const cookieJar = CookieJar.fromJSON(cookies)
  const client = getClient('mteam', cookieJar)
  const resp = await client.get('/')
  const $ = cheerio.load(resp.body)
  const username = $('a[href^="userdetails"]').text()
  const raw = $('.color_uploaded')
    .parent()
    .contents()
  const magicPoint = raw[14].data.replace(']:', '').trim()
  const uploaded = raw[24].data.trim()
  const downloaded = raw[26].data.trim()
  return {
    username,
    magicPoint,
    uploaded,
    downloaded
  }
}
