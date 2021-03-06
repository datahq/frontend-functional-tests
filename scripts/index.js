const fs = require('fs')

const json2csv = require('json2csv')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')


let newLine= "\r\n"


const checkPage = async (url, options={}) => {
  const res = await fetch(url, options)
  return res
}

const datapackageJson = async (url, options={}) => {
  const res = await fetch(url, options)
  if (res.status === 200) {
    let body = await res.text()
    body = JSON.parse(body)
    return body
  }
  else {
    return res
  }
}

// const pageLoadTime = async (url) => {
//   const browser = await puppeteer.launch()
//   const page = await browser.newPage()
//   await page.goto(url, {
//     networkIdleTimeout: 5000,
//     waitUntil: 'networkidle',
//     timeout: 0
//   })
//   let metrics = await page.getMetrics()
//   await browser.close()
//   return metrics
// }

const pageContent = async (url) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setCookie({
    name: 'jwt',
    value: `${process.env.AUTH_TOKEN}`,
    url: url
  })
  await page.goto(url, {
    networkIdleTimeout: 70000,
    networkIdleInflight: 35,
    waitUntil: 'networkidle',
    timeout: 0
  })
  let content = await page.content()
  await browser.close()
  return content
}


// const writeToCSV = (statuses) => {
//   let fields = ["id","name","page_status","page_title","dataset_title","readme","csv_links","csv_preview_links","json_links","zip_links","datapackage_json","total_load_time","script_laod_time","layout_load_time","tables","graphs"]
//   let toCsv = {
//       data: statuses,
//       fields: fields,
//       hasCSVColumnTitle: false
//   }
//   let csv = json2csv(toCsv) + newLine;
//
//   fs.appendFile('status.csv', csv, err => {
//       if (err) {
//         console.log(err)
//       }
//       console.log('The data appended to file!');
//   })
// }

const frontendStatus = async (dataset,baseUrl,newLine,options,revisionUrl) => {
  const statuses = {}
  const date = new Date()
  statuses.id = date.toISOString()
  statuses.name = dataset.name
  let showcaseUrl = revisionUrl ? revisionUrl : `${baseUrl}/${dataset.owner}/${dataset.name}`
  // page status
  const page = await checkPage(showcaseUrl, options)
  statuses.page_status = page.status + ':' + page.statusText
  if (page.status === 200) {
    const htmlBody = await pageContent(showcaseUrl)
    const $ = await cheerio.load(htmlBody, {
      withDomLvl1: true,
      normalizeWhitespace: false,
      xmlMode: false,
      decodeEntities: true
    })
    let datapackageUrl = `${baseUrl}/${dataset.owner}/${dataset.name}/datapackage.json`
    const dp = await datapackageJson(datapackageUrl, options)
    // page title
    let pageTitle = $('head').find('title').text()
    if (pageTitle.includes(dp.title)) {
      statuses.page_title = 'OK'
    } else {
      statuses.page_title = 'NOT OK'
    }
    //dataset title
    let datasetTitle = $('.showcase-page-header').find('h1').text()
    if (datasetTitle.includes(dp.title)) {
      statuses.dataset_title = 'OK'
    } else {
      statuses.dataset_title = 'NOT OK'
    }
    // readme
    let readme = $('.inner_container').find('#readme').text()
    if (readme === 'Read me') {
      statuses.readme = 'OK'
    } else {
      statuses.readme = 'NOT OK'
    }
    // resources link
    const resourcesLink = $('.resource-listing').find('a')
    for (let i = 0; i < resourcesLink.length; i++) {
      if (resourcesLink[i].attribs.href.startsWith('/')) {
        switch(resourcesLink[i].attribs.href.substr(resourcesLink[i].attribs.href.lastIndexOf('.') + 1)) {
          case 'csv':
            let csvLinks = baseUrl + resourcesLink[i].attribs.href
            const csvUrl = await checkPage(csvLinks, options)
            statuses.csv_links = csvUrl.status + ':' + csvUrl.statusText
            break;
          case 'json':
            let jsonLinks = baseUrl + resourcesLink[i].attribs.href
            const jsonUrl = await checkPage(jsonLinks, options)
            statuses.json_links = jsonUrl.status + ':' + jsonUrl.statusText
            break;
          case 'zip':
            let zipLinks = baseUrl + resourcesLink[i].attribs.href
            const zipUrl = await checkPage(zipLinks, options)
            statuses.zip_links = zipUrl.status + ':' + zipUrl.statusText
            break;
        }
      }
    }
    // datapackage_json
    const datapackageLink = $('.container').find('.btn-default')
    if ( datapackageLink.text() === 'Datapackage.json') {
      let datapackageUrl = baseUrl + datapackageLink[0].attribs.href
      const dpUrl = await checkPage(datapackageUrl, options)
      statuses.datapackage_json = dpUrl.status + ':' + dpUrl.statusText
    }
    // graphs
    try {
      const graph = $('#plotly0') || $('#vega0')
      if (graph) {
        statuses.graphs = 'OK'
      } else {
        statuses.graphs = 'NOT OK'
      }
    } catch (e) {
      statuses.graphs = 'NOT OK'
    }
    // tables
    const table = $('.htCore').find('tr').length
    if (table > 2) {
      statuses.tables = 'OK'
    } else {
      statuses.tables = 'NOT OK'
    }
    // validation status report
    const validationStatus = $('.alert-danger').find('h3').text()
    if (validationStatus.length > 10) {
      statuses.validation_status = 'OK'
    } else {
      statuses.validation_status = 'NOT OK'
    }

    // validation status by goodtables ui
    const goodtablesReport = $('.goodtables-ui-report').find('a').text()
    if (goodtablesReport.includes('Error details')) {
      statuses.goodtables_report = 'OK'
    } else {
      statuses.goodtables_report = 'NOT OK'
    }

    // page loading time
    // const loadTime = await pageLoadTime(showcaseUrl)
    // statuses.total_load_time = loadTime.TaskDuration
    // statuses.script_laod_time = loadTime.ScriptDuration
    // statuses.layout_load_time = loadTime.LayoutDuration
  }
  // append row into csv file
  //const appentToStatus = writeToCSV(statuses)
  return statuses
}


module.exports = {
  frontendStatus
}
