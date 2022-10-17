const got = require('got')
const fs = require('fs')

const logger = console

const url = 'https://api.bilibili.com/x/polymer/space/seasons_archives_list'
const headers = {
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
}
const replyUrl = 'http://api.bilibili.com/x/v2/reply/main'

const getKoalaList = async (page, callback) => {
  const channelRet = await got(url, {
    searchParams: {
      mid: 489667127,
      season_id: 249279,
      sort_reverse: false,
      page_num: page,
      page_size: 30
    },
    headers,
    resolveBodyOnly: true,
    responseType: 'json'
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
    const replyRet = await got(replyUrl, {
      searchParams: {
        type: 1,
        oid: archive.aid
      },
      headers,
      resolveBodyOnly: true,
      responseType: 'json'
    })
    if (replyRet.code !== 0) {
      throw new Error(JSON.stringify(replyRet))
    }
    const { top } = replyRet.data
    if (top?.upper?.content?.message) {
      logger.info('视频置顶评论信息', archive.aid, top.upper.content.message)
      return [...result, {
        ...instance,
        content: top.upper.content.message
      }]
    }
    if (replyRet.data.replies && replyRet.data.replies.length) {
      logger.warn('视频缺乏置顶评论', archive.aid, archive.title, JSON.stringify(replyRet.data.replies[0], null, 2))
      const [{ content: { message } }] = replyRet.data.replies
      if (message.includes('本期时间轴')) {
        return [...result, {
          ...instance,
          content: message
        }]
      }
    }
    return [...result, instance]
  }, Promise.resolve([]))
  await callback(list)
  const pageInfo = channelRet.data.page
  if (
    pageInfo &&
    Math.ceil(pageInfo.total / pageInfo.page_size) > pageInfo.page_num
  ) {
    await getKoalaList(page + 1, callback)
  }
}

const start = async () => {
  let list = []
  await getKoalaList(1, async archives => {
    list = list.concat(archives)
  })
  fs.writeFileSync('test.json', JSON.stringify(list, null, 2))
}

start()
