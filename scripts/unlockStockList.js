const fs = require('fs')
const path = require('path')
const got = require('got')
const { sleep } = require('@galenjs/factories/sleep')
const { format } = require('date-fns')

const logger = console
const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'

const getList = async ({
  page = 1,
  startDate,
  endDate
}, callback) => {
  const ret = await got(url, {
    searchParams: {
      sortColumns: 'FREE_DATE,CURRENT_FREE_SHARES',
      sortTypes: '1,1',
      pageSize: '30',
      pageNumber: page,
      reportName: 'RPT_LIFT_STAGE',
      columns: 'SECURITY_CODE,SECURITY_NAME_ABBR,FREE_DATE,CURRENT_FREE_SHARES,ABLE_FREE_SHARES,LIFT_MARKET_CAP,FREE_RATIO,NEW,B20_ADJCHRATE,A20_ADJCHRATE,FREE_SHARES_TYPE,TOTAL_RATIO,NON_FREE_SHARES,BATCH_HOLDER_NUM',
      source: 'WEB',
      client: 'WEB',
      filter: `(FREE_DATE>='${startDate}')(FREE_DATE<='${endDate}')`
    }
  })
  if (ret.code === 0) {
    callback(ret)
  }
  if (ret.result.page > page) {
    await sleep(2000)
    await this.getList({
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
  const startDate = format(new Date(year, nextMonth, 0), 'yyyy-MM-dd')
  const endDate = format(new Date(year, nextMonth + 1, 0), 'yyyy-MM-dd')
  let list = []
  await getList({
    startDate,
    endDate
  }, async ret => {
    list = list.concat(ret.result.data)
  })
  const filePath = path.resolve(__dirname, `../json/unlockStockList_${startDate}_${endDate}.json`)
  logger.info('unlock stock list', list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
}

start()
