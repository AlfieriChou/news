const fs = require('fs')
const { sleep } = require('@galenjs/factories/sleep')

const Api = require('../lib/api')

const url = 'https://api.bilibili.com/x/polymer/space/seasons_archives_list'
const replyUrl = 'http://api.bilibili.com/x/v2/reply/main'

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

const getKoalaList = async (page, callback) => {
  const channelRet = await api.get(url, {
    mid: 489667127,
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
    const replyRet = await api.get(replyUrl, {
      type: 1,
      oid: archive.aid
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
      const [reply] = replyRet.data.replies
      if (reply?.content?.message.includes('时间轴')) {
        return [...result, {
          ...instance,
          content: reply.content.message
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
  logger.info('Koala list', list.length)
  const mdList = []
  mdList.push('# koala hacker news \n')
  list.forEach((item, index) => {
    mdList.push(`## 第${list.length - index}期 \n`)
    mdList.push(`### ${item.title} \n`)
    mdList.push(`- [视频链接](https://www.bilibili.com/video/av${item.id}) \n`)
    if (item.content) {
      mdList.push('|时间轴|简介|链接|')
      mdList.push('|:--:|:--:|:--:|')
      const contentList = item.content.split('\n')
      const linkIndex = contentList.findIndex(i => i.includes('项目链接'))
      if (linkIndex > 0) {
        const titleList = contentList.slice(1, linkIndex)
        const linkList = contentList.slice(linkIndex + 1)
        linkList.forEach((link, index) => {
          if (titleList[index]) {
            const [timeline, ...titleArr] = titleList[index].split(' ')
            mdList.push(`|${timeline}|${titleArr.join('')}|${link}|`)
          }
        })
        mdList.push('\n')
        return
      }
      const titleList = contentList.slice(1)
      titleList.forEach((title) => {
        const [timeline, ...titleArr] = title.split(' ')
        mdList.push(`|${timeline}|${titleArr.join('')}| |`)
      })
      mdList.push('\n')
    }
  })
  fs.writeFileSync('./markdown/koala.md', mdList.join('\n'))
  logger.info('write file done')
}

start()
