import * as koa from 'koa'
import { HttpError } from './custom-error'

// 要求用户必须登录
export function auth() {
  return function(ctx: koa.Context, next: () => Promise<any>) {
    if (ctx.session.user) {
      return next()
    }
    throw new HttpError('SessionExpired', 401)
  }
}
