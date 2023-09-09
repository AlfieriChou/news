const fs = require('fs')
const path = require('path')
const { sleep } = require('@galenjs/factories/sleep')
const { format } = require('date-fns')

const Api = require('../lib/api')

const LIMIT = 50

const logger = console
const url = 'https://push2.eastmoney.com/api/qt/clist/get'
const api = new Api({
  headers: {},
  logger
})

const getList = async ({
  page = 1
}, callback) => {
  const ret = await api.get(url, {
    fid: 'f164',
    po: 1,
    pz: LIMIT,
    pn: page,
    np: 1,
    fltt: 2,
    invt: 2,
    ut: 'b2884a393a59ad64002292a3e90d46a5',
    fs: 'm:90+t:2',
    fields: 'f12,f14,f2,f109,f164,f165,f166,f167,f168,f169,f170,f171,f172,f173,f257,f258,f124,f1,f13'

  })
  logger.info('price momentum', page, JSON.stringify(ret))
  if ((ret?.data?.diff || []).length) {
    callback(ret)
  }
  if ((ret?.data?.diff || []).length === LIMIT) {
    await sleep(2000)
    await getList({
      page: page + 1
    }, callback)
  }
}

const start = async () => {
  let list = []
  await getList({
  }, async ret => {
    list = list.concat(ret.data.diff)
  })
  const filePath = path.resolve(__dirname, '../json/priceMomentum/5days_data.json')
  logger.info('price momentum', list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
  const sortList = list.sort((a, b) => a.f109 - b.f109)
  const mdList = []
  mdList.push('# 5日涨跌幅 \n')
  mdList.push('\n')
  mdList.push('| 板块名称 | 涨跌幅 | 5日主力流入净值 | 5日超大单净流入 | 5日流入最多板块标的 |')
  mdList.push('|:--:|:--:|:--:|:--:|:--:|')
  sortList.forEach((item) => {
    mdList.push(`|${item.f14}|${item.f109}|${item.f164}|${item.f166}|${item.f257}/${item.f258}|`)
  })
  fs.writeFileSync(`./markdown/priceMomentum/${format(new Date(), 'yyyy-MM-dd')}_5days_data.md`, mdList.join('\n'))
  logger.info('write file done')
}

start()
