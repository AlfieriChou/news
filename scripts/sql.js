const { sleep } = require('@galenjs/factories/sleep')

const Api = require('../lib/api')

const url = 'https://api.bilibili.com/x/polymer/space/seasons_archives_list'

const logger = console
const api = new Api({
  headers: {
    authority: 'api.bilibili.com',
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    origin: 'https://space.bilibili.com',
    referer: 'https://space.bilibili.com/489667127/channel/collectiondetail?sid=249279',
    'sec-ch-ua': '"Chromium";v="106", "Microsoft Edge";v="106", "Not;A=Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 Edg/106.0.1370.37'
  },
  logger
})

const getSqlList = async (page, callback) => {
  const channelRet = await api.get(url, {
    mid: 399970381,
    season_id: 249279,
    sort_reverse: false,
    page_num: page,
    page_size: 30
  })
  logger.info('获取合集信息', page, JSON.stringify(channelRet))
  if (channelRet.code !== 0) {
    throw new Error(JSON.stringify(channelRet))
  }
  const { archives } = channelRet.data
  const list = await archives.reduce(async (promise, archive) => {
    const result = await promise
    const instance = {
      id: archive.aid,
      aid: archive.aid,
      title: archive.title,
      createdAt: archive.ctime * 1000,
      publishAt: archive.pubdate * 1000
    }
    await sleep(Math.floor(Math.random(3) * 1000 + 1000))
    // TODO: 获取SQL信息
    return [...result, instance]
  }, Promise.resolve([]))
  await callback(list)
  const pageInfo = channelRet.data.page
  if (
    pageInfo &&
    Math.ceil(pageInfo.total / pageInfo.page_size) > pageInfo.page_num
  ) {
    await getSqlList(page + 1, callback)
  }
}

const start = async () => {
  let list = []
  await getSqlList(1, async archives => {
    list = list.concat(archives)
  })
  logger.info('sql list', list.length)
}

start()
