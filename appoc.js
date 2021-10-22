const express = require('express')
const cors = require('cors')
const ef = require('express-fileupload')
const fs = require('fs');
const Tesseract = require('tesseract.js');
const hostname = 'localhost'
const port = process.env.PORT || 7453

var filename = 'ocr_image'
var app = express()
app.use(cors())
app.use(ef())
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use('/img', express.static('storage/images'))
app.use('/dtxt', express.static('storage/text_files'))
app.get('/', (req,res)=>{
    res.send('<h1>Web OCR</h1>')
})


const capturedImage = async (req, res, next) => {
    try {
        const path = './storage/images/ocr_image.jpeg'     // destination image path
        let imgdata = req.body.img;                 // get img as base64
        const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');     // convert base64
        await fs.writeFileSync(path, base64Data,  {encoding: 'base64'});                  // write img file

        Tesseract.recognize(
            `http://${hostname}:${port}/img/ocr_image.jpeg`,
            'eng',
            
        )
        .then(({ data: { text } }) => {
            //console.log(text)
            return res.send({
                image: imgdata,
                path: path,
                text: text
            });
        })

    } catch (e) {
        next(e);
    }
}
app.post('/capture', capturedImage)


app.post('/upload', async (req, res) => {
    if (req.files) {
        var efFile = req.files.file
        // console.log(efFile)
        filename = efFile.name
        if (efFile.mimetype === 'image/jpg' || efFile.mimetype === 'image/png' || efFile.mimetype === 'image/tiff' || efFile.mimetype === 'image/bmp'||efFile.mimetype === 'image/jpeg') {

            await efFile.mv('./storage/images/' + filename, (err) => {
                if (err) {
                    //console.log(err)
                    res.send(err)
                } else {
                    //console.log(filename)
                    // res.send(filename)
                    try {
                        Tesseract.recognize(
                            `./storage/images/${filename}`,
                            'eng',
                        )

                            .then(({ data: { text } }) => {
                                //console.log(text)
                                return res.send({
                                    image: `http://greazey-ocr-api.herokuapp.com/img/${filename}`,
                                    path: `http://greazey-ocr-api.herokuapp.com/img/${filename}`,
                                    text: text

                                });
                            })
                    }
                    catch (err) {
                        console.error(err)
                    }
                }
            })
        } else {
            return res.send({
                image: `This File type is not Supported`,
                path: `This File type is not Supported`,
                text: `This File type is not Supported`

            });
        }
    }
})
app.post('/txt',  async (req, res)=>{
    fs.writeFile(`storage/text_files/${filename}.txt`,req.body.txt, (err) => {  
        if (err) throw err;
      })
        return await res.send({path: `http://greazey-ocr-api.herokuapp.com/dtxt/${filename}.txt` 
          })
   
      
  
})

app.listen(port,()=>console.log(`listening to http://${hostname}:${port}`))
