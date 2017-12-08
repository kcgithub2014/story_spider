'use strict'
import fs from 'fs'
import officegen from 'officegen'
import async from 'async'


let fileData = fs.readFileSync('../data/data.json')
fileData = JSON.parse(fileData)
let story = fileData["story"]

function createDoc(title, link, content) {
    return new Promise((resolve, reject) => {
        let docx = officegen('docx')
        var pObj = docx.createP({align: 'center'})
        pObj.addText(title, {font_face: '宋体', font_size: 20})
        var pObj = docx.createP()
        pObj.addText(`链接：${link}`, {link: link, font_face: '宋体', font_size: 15})
        let _c = content.split('\n')
        _c.forEach(c => {
            var pObj = docx.createP()
            pObj.addText( `\n\n\n\n\n\n\n\n${c}`, {font_face: '宋体', font_size: 15})
        })
        let out = fs.createWriteStream(`${title}.docx`)
        docx.generate(out)
        out.on('close', () => {
            resolve(`Finished to create the ${title}.doc file!`)
        })
        out.on('error', (err) => {
            reject(err)
        })
    })
}

(async () => {
    for(let i=0;i<story.length;i++){
        for(let x=0;x<story[i]["stroyLink"].length;x++){
            let data = story[i]["stroyLink"][x]
                ,result
            try{
                result = await createDoc(data["title"], data["link"], data["content"])
            }catch (e){
                result = e
            }
            console.log(result)
        }
    }
})()