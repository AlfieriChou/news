const fs = require('fs')
const path = require('path')
const got = require('got')
const { hash } = require('@galenjs/factories/crypto')
const { sleep } = require('@galenjs/factories/sleep')

const logger = console
const url = 'http://www.100ppi.com/kx/'

const getList = async ({
  page, code, name
}) => {
  const infoUrl = `${url}detail-message-${code}--${page}.html`
  const infoRet = await got(infoUrl)
  const list = infoRet.body
    .split('\r\n')
    .filter(item => item.includes(`[${name}]`))
    .map(item => {
      const [, content] = item.split(`[${name}]`)
      const [message, dateStrSpan] = content.split(' <span>')
      const [dateStr, price] = message.split(`${name}为`)
      const date = dateStrSpan.split('</span>')[0]
      return {
        id: hash(`${dateStr}_${name}`),
        dateStr: `${new Date().getFullYear()}年${dateStr}`,
        date: new Date(date).setHours(0, 0, 0, 0),
        message,
        name,
        price: parseFloat(price)
      }
    })
  return list
}

const syncCommodityData = async ({
  code, name, filename
}) => {
  const list = [
    ...await getList({
      page: 1,
      code,
      name
    }),
    ...await getList({
      page: 2,
      code,
      name
    }),
    ...await getList({
      page: 3,
      code,
      name
    })
  ]
  let existList = []
  const filePath = path.join(process.cwd(), `/json/commodity/${filename}.json`)
  if (fs.existsSync(filePath)) {
    existList = require(filePath)
    list.forEach(item => {
      const exist = existList.find(i => i.id === item.id)
      if (!exist) {
        existList.push(item)
      }
    })
  } else {
    existList = list
  }
  logger.info(`${filename} list`, list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(existList.sort((a, b) => b.date - a.date), null, 2)
  )
  const mdList = []
  mdList.push(`# ${name}价格变动趋势 \n`)
  mdList.push('| 时间 | 价格 | 消息正文 |')
  mdList.push('|:--:|:--:|:--:|')
  existList.forEach((item) => {
    mdList.push(`|${item.dateStr}|${item.price}|${item.message}|`)
  })
  const markdownFilePath = path.join(process.cwd(), `/markdown/commodity/${filename}.md`)
  fs.writeFileSync(markdownFilePath, mdList.join('\n'))
  logger.info(`write ${filename} file done`)
}

const start = async () => {
  await [{
    code: '976',
    name: '金属镨',
    filename: 'praseodymium'
  }, {
    code: '977',
    name: '金属钕',
    filename: 'neodymium'
  }, {
    code: '978',
    name: '金属镝',
    filename: 'dysprosiumMetal'
  }, {
    code: '979',
    name: '氧化钕',
    filename: 'neodymiumOxide'
  }, {
    code: '980',
    name: '氧化镨',
    filename: 'praseodymiumOxide'
  }, {
    code: '981',
    name: '氧化镝',
    filename: 'dysprosiumOxide'
  }, {
    code: '982',
    name: '镨钕合金',
    filename: 'praseodymiumNeodymiumAlloy'
  }, {
    code: '984',
    name: '镝铁合金',
    filename: 'dyFeAlloy'
  }, {
    code: '1454',
    name: '镨钕氧化物',
    filename: 'praseodymiumNeodymiumOxide'
  }].reduce(async (promise, data) => {
    await promise
    await syncCommodityData(data)
    await sleep(Math.floor(Math.random() * (5000 - 3000) + 3000))
  }, Promise.resolve())
}

start()