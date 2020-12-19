import express from 'express';
const cors = require('cors')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { promisify } = require('util')
const creds = require('../credentials.json');

//Parametros fixos dos id do form e do config
let docId = '1QRHjDwPwRxozDFrYJzqLNxEsBhqsnMeYFSM2_SwRT7Q'
const docIdConfig = '1cBXuaO0uxvhJVp58HjxRQJ_aEZGqFsv4nzY1M_aeLcw'


//Pegar o atual que está presente nas configurações

async function PegarIdAtual( AtualId ) {
  const docConfig = new GoogleSpreadsheet(AtualId)
  await docConfig.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key,
  }); 
  await docConfig.loadInfo()
  const sheet = docConfig.sheetsByIndex[0]; // or use doc.sheetsById[id]
  const rows = await sheet.getRows();
  docId = rows[0]._rawData[3]
  return docId
}


const app = express()

async function accessSpreadsheet() {
    let dados = []
    let variavel = []
    let array_md = []
    const doc = new GoogleSpreadsheet(docId);
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
      if(el.coluna=="Nível de Pós-Graduação:"){
        array_md.push(el)
      }
      if(el.coluna === "Carimbo de data/hora" || el.coluna === "Nome do registro civil ou nome social:" || el.coluna === "Data de nascimento (dia, mês, ano):"){

      }else{
        dados.push(el)
      }
    })
    
    tratar(dados,array_md)
    Perspectiva(dados)
}
  
let dadosTratados = []
function tratar(dados,array_md) {
    const estados = dados.reduce((obj, {coluna, value}) => {
      if (!obj[coluna]) obj[coluna] = [];
      obj[coluna].push(value);
      return obj;
    }, {});
    
    let i = 0;
    dadosTratados = Object.keys(estados).map(coluna => {
      if(coluna=="Idade com que ingressou no curso do PPGBot:" || coluna=="Ano de início no curso do PPGBot:" || coluna=="Ano de Titulação:" || coluna=="Bolsista:" || coluna=="O que gerou sua pesquisa na pós-graduação:"){
        return{
          coluna,
          values: estados[coluna],
          nivel: array_md
        }
      }
      return {
        coluna,
        values: estados[coluna]
      };

    });
}

function Timeout() {
  setTimeout(()=>{
    console.log('Timeout ativado 20s')
    dadosPerspectiva=[]
    PegarIdAtual(docIdConfig).then(()=>{
      accessSpreadsheet();
      Timeout()
    }).catch(()=>{
      console.log("problema na extração dos dados...");
    })
    
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
    if(el.coluna=="Nível de Pós-Graduação:"){
      objeto.Nivel = el.value
    }
    if(objeto.AnoInicio && objeto.AnoTitulacao && objeto.Bolsista && objeto.Agencia && objeto.Nivel){
      var igual = dadosPerspectiva.find(dado=>dado === el);
      if(!igual){
        dadosPerspectiva.push(objeto)
        objeto = {}
      }else{
        console.log('ja existe elemento.');
      }
      
    }
    
  })

  
}


PegarIdAtual(docIdConfig).then(()=>{
  accessSpreadsheet()
  Timeout()
}).catch(()=>{
  console.log("problema na estração dos dados....")
})

app.use(cors());
app.get("/api/excel", (req,res)=>{
    res.send(dadosTratados);
})
app.get("/api/perspectiva", (req,res)=>{
  res.send(dadosPerspectiva);
})
app.get("/api/docId", (req,res)=>{
  res.send(docId);
})
app.listen(process.env.PORT || 5000)


