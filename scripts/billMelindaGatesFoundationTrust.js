const fs = require('fs')
const path = require('path')
const { sleep } = require('@galenjs/factories/sleep')
const { camelJsonKeys } = require('@galenjs/factories/lodash')
const { format } = require('date-fns')
const _ = require('lodash')

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
    sortColumns: 'UPDATE_DATE,END_DATE,SECURITY_CODE',
    sortTypes: '-1,-1,-1',
    pageSize: 50,
    pageNumber: 1,
    columns: 'ALL;D10_ADJCHRATE,D30_ADJCHRATE,D60_ADJCHRATE',
    source: 'WEB',
    client: 'WEB',
    filter: '(HOLDER_NEW="10054004")(END_DATE>=\'2015-03-31\')',
    reportName: 'RPT_CUSTOM_F10_EH_FREEHOLDERS_JOIN_FREEHOLDER_SHAREANALYSIS'
  })
  logger.info('billMelindaGatesFoundationTrust', startDate, endDate, page, JSON.stringify(ret))
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
  const filePath = path.resolve(__dirname, '../json/billMelindaGatesFoundationTrust/data.json')
  logger.info('billMelindaGatesFoundationTrust', list.length)
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
  const groupByList = _.groupBy(list, x => `${x.endDate.slice(0, 10).split('-').join('')}-${x.reportDateName}`)
  Object.entries(groupByList).forEach(([key, values]) => {
    const mdList = []
    mdList.push('# 报表周期 \n')
    mdList.push(`${key}\n`)
    mdList.push('| 标的代码 | 标的名称 | 持仓数 | 报告期 | 持股变动 | 股东类型 | 流通市值 |')
    mdList.push('|:--:|:--:|:--:|:--:|:--:|:--:|:--:|')
    values.forEach((value) => {
      mdList.push(
        `|${
          value.securityCode
        }|${
          value.securityNameAbbr
        }|${
          value.holdNum
        }|${
          value.reportDateName
        }|${
          value.holdnumChangeName
        }|${
          value.holderNewtype
        }|${
          value.holderMarketCap
        }|`
      )
    })
    fs.writeFileSync(`./markdown/billMelindaGatesFoundationTrust/${key}.md`, mdList.join('\n'))
  })
  logger.info('write file done')
}

start()
