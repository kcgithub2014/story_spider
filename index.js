'use strict'
import path from 'path'
import fs from 'fs'
import superagent from 'superagent'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import express from 'express'
import charset from 'superagent-charset'
import async from 'async'

const request = charset(superagent)
    , base_header = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Host': 'm.5aigushi.com',
    'Pragma': 'no-cache',
    'Proxy-Connection': 'keep-alive',
    'Referer': 'http://m.5aigushi.com/qingchun/list_16_2.html',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
}

let Sitem = []

function getHtml(href) {
    console.log(href)
    return new Promise((resolve, reject) => {
        request
            .get(href)
            .set(base_header)
            .charset('gbk')
            .end((err, res) => {
                if (err) reject(err)
                else resolve(res.text)
            })
    })
}

function taskDelay(time) {
    console.log(`等待${time / 1000}秒`)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('ok')
        }, time)
    })
}

(async () => {
    let $ = cheerio.load(await getHtml('http://m.5aigushi.com/data/sitemap.html'))
        ,fileData = fs.readFileSync(path.join(__dirname, 'data/data.json'))
    fileData = JSON.parse(fileData)
    $('.lanmu a').each((idx, elm) => Sitem.push({
        "link": `http://m.5aigushi.com${$(elm).attr("href")}`,
        "sitem": $(elm).text()
    }))
    console.log(`共有${Sitem.length}个栏目`)
    for (let i = 0; i < Sitem.length; i++) {
        console.log(`抓取${Sitem[i]["sitem"]}页面`)
        let $ = cheerio.load(await getHtml(Sitem[i]["link"]))
            , arr = $('.page li').eq(2).find('a').attr('href').split('_')
            , pages = arr[arr.length-1].replace('.html', "")
        arr.pop()
        Sitem[i]["pages"] = pages
        for (let page = 1; page < pages; page++) {
            console.log(`抓取${Sitem[i]["sitem"]}第${page}页`)
            let link = Sitem[i]["link"]
            link[link.length - 1] == '/' ? "" : link += '/'
            arr.forEach(a => link += a + '_')
            let href = `${link}${page}.html`
            $ = cheerio.load(await getHtml(href))
            let liobjs = $('.article_list_03 li')
            for (let x = 1; x < liobjs.length; x++) {
                console.log(`抓取${Sitem[i]["sitem"]}第${page}页第${x}篇故事`)
                let elm = $(liobjs).eq(x).find('a')
                    , href = $(elm).attr('href')
                    , title = $(elm).text()
                $ = cheerio.load(await getHtml(href))
                let content = $('.article_info').text().replace(/(^\s*)|(\s*$)/g, "")
                    , data = {"link": href, "title": title, "content": content}
                Sitem[i]["stroyLink"] ? Sitem[i]["stroyLink"].push(data) : Sitem[i]["stroyLink"] = [data]
            }
            await taskDelay(2000)
        }
        fileData["story"].push(Sitem[i])
        fileData["now"] = i
        fs.writeFile(path.join(__dirname, 'data/data.json'), JSON.stringify(fileData), (err) => {
            if (err) reject(err)
        })
    }

})()