/**
 * 自定义错误类型
 */
import * as koa from 'koa'

interface ErrorMsg {
  [key: string]: string
}
const ERROR_MSG: ErrorMsg = {
  SessionExpired: 'Cookie已失效或用户未登录，请重新登录',
  FetchCronDescFailed: 'Cron描述获取失败'
}

export class HttpError extends Error {
  constructor(
    public name: string,
    public status: number = 500,
    public msg?: string
  ) {
    super(msg || ERROR_MSG[name] || 'Unknown Error')
    this.name = name
    this.msg = msg || ERROR_MSG[name] || 'Unknown Error'
    this.status = status
  }
}

export function httpErrorHandler() {
  let httpErrorMiddleware: koa.Middleware
  httpErrorMiddleware = async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      if (err instanceof HttpError) {
        ctx.body = { msg: err.msg }
        ctx.status = err.status
      } else {
        console.log('=== Unhandled Error Catched By httpErrorHandler ===')
        console.log(err)
      }
    }
  }
  return httpErrorMiddleware
}
