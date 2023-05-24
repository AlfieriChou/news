const fs = require('fs')
const path = require('path')
const got = require('got')
const { hash } = require('@galenjs/factories/crypto')

const logger = console
const url = 'http://www.100ppi.com/kx/'

const getList = async (page) => {
  const infoUrl = `${url}detail-message-976--${page}.html`
  const infoRet = await got(infoUrl)
  const list = infoRet.body
    .split('\r\n')
    .filter(item => item.includes('[金属镨]'))
    .map(item => {
      const [, content] = item.split('[金属镨]')
      const [message, dateStrSpan] = content.split(' <span>')
      const [dateStr, price] = message.split('金属镨为')
      const date = dateStrSpan.split('</span>')[0]
      return {
        id: hash(`${dateStr}_金属镨`),
        dateStr: `${new Date().getFullYear()}年${dateStr}`,
        date: new Date(date).setHours(0, 0, 0, 0),
        message,
        name: '金属镨',
        price: parseFloat(price)
      }
    })
  return list
}

const start = async () => {
  const list = [
    ...await getList(1),
    ...await getList(2),
    ...await getList(3)
  ]
  let existList = []
  const filePath = path.join(process.cwd(), '/json/commodity/praseodymium.json')
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
  logger.info('praseodymium list', list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(existList.sort((a, b) => b.date - a.date), null, 2)
  )
  const mdList = []
  mdList.push('# 金属镨价格变动趋势 \n')
  mdList.push('| 时间 | 价格 | 消息正文 |')
  mdList.push('|:--:|:--:|:--:|')
  existList.forEach((item) => {
    mdList.push(`|${item.dateStr}|${item.price}|${item.message}|`)
  })
  const markdownFilePath = path.join(process.cwd(), '/markdown/commodity/praseodymium.md')
  fs.writeFileSync(markdownFilePath, mdList.join('\n'))
  logger.info('write file done')
}

start()
