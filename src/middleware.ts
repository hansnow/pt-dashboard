import * as koa from 'koa'

// 要求用户必须登录
export function auth() {
  return function(ctx: koa.Context, next: () => Promise<any>) {
    if (ctx.session.user) {
      return next()
    }
    ctx.status = 401
    ctx.body = { code: 'E0401', msg: 'Cookie已失效或用户未登录，请重新登录' }
  }
}
