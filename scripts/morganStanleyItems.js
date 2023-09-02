const fs = require('fs')
const path = require('path')
const { sleep } = require('@galenjs/factories/sleep')
const { camelJsonKeys } = require('@galenjs/factories/lodash')
const { format } = require('date-fns')
const ChartJsImage = require('chartjs-to-image')

const Api = require('../lib/api')

const logger = console
const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
const api = new Api({
  headers: {},
  logger
})

const generateLineChartImg = async ({
  name, filename, xList, yList
}) => {
  const chart = new ChartJsImage()
  chart
    .setConfig({
      type: 'line',
      data: {
        labels: xList,
        datasets: [
          {
            fillColor: 'rgba(220,220,220,0.5)',
            strokeColor: 'rgba(220,220,220,1)',
            pointColor: 'rgba(220,220,220,1)',
            pointStrokeColor: '#fff',
            data: yList,
            label: name
          }
        ]
      }
    })
    .setWidth(3000)
    .setHeight(1000)
    .toFile(filename)
}

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
  if (!ret.success) {
    throw new Error('数据获取异常')
  }
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
  const chartList = list
    .map(i => {
      return {
        ...i,
        date: new Date(i.holdDate)
      }
    })
    .sort((a, b) => a.date - b.date)
  await generateLineChartImg({
    name: code,
    filename: path.join(process.cwd(), `img/morganStanley_${code}.png`),
    xList: chartList.map(i => i.dateStr),
    yList: chartList.map(i => i.holdNum)
  })
  fs.writeFileSync(
    filePath,
    JSON.stringify(list, null, 2)
  )
  const mdList = []
  mdList.push(`# 摩根史丹利-${code}-持仓明细 \n`)
  mdList.push('\n')
  mdList.push(`![${code}](../../img/morganStanley_${code}.png)\n`)
  mdList.push('\n')
  mdList.push('| 标的代码 | 标的名称 | 日期 | 持股数量 | A股占比 | 持股市值 |')
  mdList.push('|:--:|:--:|:--:|:--:|:--:|:--:|')
  list.forEach((item) => {
    mdList.push(`|${item.securityCode}|${item.securityNameAbbr}|${format(new Date(item.holdDate), 'yyyy-MM-dd')}|${item.holdNum}|${item.holdSharesRatio}|${item.holdMarketCap}|`)
  })
  fs.writeFileSync(`./markdown/morganStanley/${code}_data.md`, mdList.join('\n'))
  logger.info('write file done')
}

['002555', '002236', '000429', '600900'].reduce(async (promise, code) => {
  await promise
  await start(code)
  await sleep(Math.floor(Math.random() * (20000 - 10000) + 10000))
}, Promise.resolve())
