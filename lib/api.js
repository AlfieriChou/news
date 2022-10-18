const got = require('got')
const assert = require('assert')
const shortId = require('shortid')

const pkg = require('../package.json')

const createLogger = logger => ctx => {
  ctx.logger = ctx.context?.logger || logger
}
const fillPkgInfo = () => ctx => {
  ctx.pkg = pkg
}
const fillReqId = () => ctx => {
  ctx.id = shortId.generate()
}

module.exports = class Api {
  constructor ({
    headers,
    logger = console,
    logBody = false
  }) {
    this.logger = logger
    this.got = got.extend({
      timeout: 10000,
      responseType: 'json',
      headers: headers || {},
      hooks: {
        init: [
          fillReqId(),
          fillPkgInfo(),
          createLogger(this.logger)
        ]
      },
      handlers: [
        async (ctx, next) => {
          const { context: { method, data }, url: { searchParams } } = ctx
          assert(data && typeof data === 'object', 'data must be an object')
          ctx.method = method
          if (method === 'GET') {
            Object.entries(data).forEach(([key, value]) => searchParams.set(key, value))
          }
          if (method === 'POST') {
            ctx.json = data
          }
          await next(ctx)
          return ctx.res
        },
        async (ctx, next) => {
          try {
            await next(ctx)
            ctx.logger.info(
              `[${ctx.pkg.name}@${ctx.pkg.version}]`,
              'request',
              {
                id: ctx.id,
                method: ctx.method,
                url: ctx.url.href,
                requestBody: JSON.stringify(ctx.json || {})
              }
            )
            const time = ctx.res.timings.end - ctx.res.timings.start
            ctx.logger.info(
              `[${ctx.pkg.name}@${ctx.pkg.version}]`,
              'response',
              {
                id: ctx.id,
                method: ctx.method,
                url: ctx.url.href,
                time,
                responseBody: logBody ? JSON.stringify(ctx.res.body) : ''
              }
            )
          } catch (err) {
            ctx.logger.error(
              `[${ctx.pkg.name}@${ctx.pkg.version}]`,
              'error',
              {
                id: ctx.id,
                url: ctx.url.href,
                method: ctx.method,
                requestBody: ctx.json ? JSON.stringify(ctx.json) : ctx.body,
                response: ctx.res && ctx.res.body
              },
              err
            )
          }
        },
        async (ctx, next) => {
          ctx.res = await next(ctx)
        }
      ]
    })
  }

  async request (url, options = {}) {
    return this.got(url, options)
      .then(res => res.body)
      .catch(err => {
        return Promise.reject(new Error(err))
      })
  }

  async get (url, data) {
    return this.request(url, {
      context: {
        method: 'GET',
        data: data || {}
      }
    })
  }

  async post (url, data) {
    return this.request(url, {
      context: {
        method: 'POST',
        data: data || {}
      }
    })
  }
}
