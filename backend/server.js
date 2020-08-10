import express from 'express';
const cors = require('cors')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { promisify } = require('util')
const creds = require('../credentials.json');


const doc = new GoogleSpreadsheet('1QRHjDwPwRxozDFrYJzqLNxEsBhqsnMeYFSM2_SwRT7Q');


const app = express()

async function accessSpreadsheet() {
    let dados = []
    let variavel = []
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key,
    });
  
    await doc.loadInfo(); // loads document properties and worksheets
  
    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
    const rows = await sheet.getRows();
    const header  = await sheet.headerValues;    
    
    let i = 0
    rows.forEach(element => {
        
        element._rawData.forEach(el =>{
            if(el != ''){
                variavel.push({coluna: header[i], value: el})
            }else{
                
            }
            i++
        })
        i=0
    })
    variavel.forEach(el=>{
      if(el.coluna === "Carimbo de data/hora" || el.coluna === "Nome do registro civil ou nome social:"){

      }else{
        dados.push(el)
      }
    })
    
    tratar(dados)
    Perspectiva(dados)
}
  
let dadosTratados = []
function tratar(dados) {
    const estados = dados.reduce((obj, {coluna, value}) => {
      if (!obj[coluna]) obj[coluna] = [];
      obj[coluna].push(value);
      return obj;
    }, {});
    
    dadosTratados = Object.keys(estados).map(coluna => {
      return {
        coluna,
        values: estados[coluna]
      };
    });
}

function Timeout() {
  setTimeout(()=>{
    console.log('Timeout ativado 30s')
    dadosPerspectiva=[]
    accessSpreadsheet();
    Timeout()
  },30000)
}

let objeto = {}
let dadosPerspectiva = []
function Perspectiva(dados) {
  dados.forEach(el=>{
    if(el.coluna ==="Ano de início no curso do PPGBot:"){
      objeto.AnoInicio = el.value
    }
    if(el.coluna ==="Ano de Titulação:"){
      objeto.AnoTitulacao = el.value
    } 
    if(el.coluna === "Bolsista:"){
      objeto.Bolsista = el.value
    }
    if(el.coluna === "Agência de Fomento:"){
      objeto.Agencia = el.value
    }
    if(objeto.AnoInicio && objeto.AnoTitulacao && objeto.Bolsista && objeto.Agencia){
      var igual = dadosPerspectiva.find(dado=>dado === el);
      if(!igual){
        dadosPerspectiva.push(objeto)
        objeto = {}
      }else{
        console.log('ja existe elemento.');
      }
      
    }
    
  })

  console.log(dadosPerspectiva)
}


accessSpreadsheet()
Timeout()
app.use(cors());
app.get("/api/excel", (req,res)=>{
    res.send(dadosTratados);
})
app.get("/api/perspectiva", (req,res)=>{
  res.send(dadosPerspectiva);
})
app.listen(process.env.PORT || 5000)


