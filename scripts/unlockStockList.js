const fs = require('fs')
const path = require('path')
const { sleep } = require('@galenjs/factories/sleep')
const { camelJsonKeys } = require('@galenjs/factories/lodash')
const { format } = require('date-fns')

const Api = require('../lib/api')

const ONE_DAY = 24 * 60 * 60 * 1000

const logger = console
const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
const api = new Api({
  headers: {},
  logger
})

const getList = async ({
  page = 1,
  startDate,
  endDate
}, callback) => {
  const ret = await api.get(url, {
    sortColumns: 'FREE_DATE,CURRENT_FREE_SHARES',
    sortTypes: '1,1',
    pageSize: '30',
    pageNumber: page,
    reportName: 'RPT_LIFT_STAGE',
    columns: 'SECURITY_CODE,SECURITY_NAME_ABBR,FREE_DATE,CURRENT_FREE_SHARES,ABLE_FREE_SHARES,LIFT_MARKET_CAP,FREE_RATIO,NEW,B20_ADJCHRATE,A20_ADJCHRATE,FREE_SHARES_TYPE,TOTAL_RATIO,NON_FREE_SHARES,BATCH_HOLDER_NUM',
    source: 'WEB',
    client: 'WEB',
    filter: `(FREE_DATE>='${startDate}')(FREE_DATE<='${endDate}')`
  })
  logger.info('unlock stock list', startDate, endDate, page, JSON.stringify(ret))
  if (ret.code === 0) {
    callback(ret)
  }
  if (ret.result.pages > page) {
    await sleep(2000)
    await getList({
      startDate,
      endDate,
      page: page + 1
    }, callback)
  }
}

const start = async () => {
  const date = new Date()
  const year = date.getFullYear()
  const nextMonth = date.getMonth() + 1
  const startDate = format(new Date(year, nextMonth, 0).getTime() + ONE_DAY, 'yyyy-MM-dd')
  const endDate = format(new Date(year, nextMonth + 1, 0), 'yyyy-MM-dd')
  let list = []
  await getList({
    startDate,
    endDate
  }, async ret => {
    list = list.concat(camelJsonKeys(ret.result.data))
  })
  const filePath = path.resolve(__dirname, `../json/unlockStock/${startDate}_${endDate}.json`)
  logger.info('unlock stock list', list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
  const mdList = []
  mdList.push('# 解禁股票列表 \n')
  mdList.push('| 标的代码 | 标的名称 | 解禁时间 | 限售股类型 | 解禁数量（股） | 实际解禁数量（股） | 占解禁前流通市值比例(%) |')
  mdList.push('|:--:|:--:|:--:|')
  list.forEach((item) => {
    mdList.push(`|${item.securityCode}|${item.securityNameAbbr}|${item.freeDate}|${item.freeSharesType}|${item.ableFreeShares}万|${item.currentFreeShares}万|(${(item.freeRatio * 100).toFixed(2)}|`)
  })
  fs.writeFileSync(`./markdown/unlockStock/${startDate}_${endDate}.md`, mdList.join('\n'))
  logger.info('write file done')
}

start()
