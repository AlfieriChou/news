const fs = require('fs')
const path = require('path')
const { sleep } = require('@galenjs/factories/sleep')
const { camelJsonKeys } = require('@galenjs/factories/lodash')
const { format } = require('date-fns')

const Api = require('../lib/api')

const logger = console
const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
const api = new Api({
  headers: {},
  logger
})

const getList = async ({
  page = 1,
  code
}, callback) => {
  const ret = await api.get(url, {
    sortColumns: 'HOLD_DATE',
    sortTypes: '-1',
    pageSize: 50,
    pageNumber: page,
    reportName: 'RPT_MUTUAL_HOLD_DET',
    columns: 'ALL',
    source: 'WEB',
    client: 'WEB',
    filter: `(SECURITY_CODE="${code}")(PARTICIPANT_CODE="B01274")(HOLD_DATE>='2023-06-02')`
  })
  logger.info('morganStanley', code, page, JSON.stringify(ret))
  if (ret.code === 0) {
    callback(ret)
  }
  if (ret.result.pages > page) {
    await sleep(2000)
    await getList({
      code,
      page: page + 1
    }, callback)
  }
}

const start = async (
  code = '002555'
) => {
  let list = []
  await getList({
    code
  }, async ret => {
    list = list.concat(camelJsonKeys(ret.result.data))
  })
  const filePath = path.resolve(__dirname, `../json/morganStanley/${code}_data.json`)
  logger.info('morganStanley', code, list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
  const mdList = []
  mdList.push(`# 摩根史丹利-${code}-持仓明细 \n`)
  mdList.push('| 标的代码 | 标的名称 | 日期 | 持股数量 | A股占比 | 持股市值 |')
  mdList.push('|:--:|:--:|:--:|:--:|:--:|:--:|')
  list.forEach((item) => {
    mdList.push(`|${item.securityCode}|${item.securityNameAbbr}|${format(new Date(item.holdDate), 'yyyy-MM-dd')}|${item.holdNum}|${item.holdSharesRatio}|${item.holdMarketCap}|`)
  })
  fs.writeFileSync(`./markdown/morganStanley/${code}_data.md`, mdList.join('\n'))
  logger.info('write file done')
}

['002555', '002236'].reduce(async (promise, code) => {
  await promise
  await start(code)
}, Promise.resolve())
