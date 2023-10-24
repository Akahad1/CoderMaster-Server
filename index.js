const express =require('express')
const cors=require('cors')
const app =express()
const jwt=require("jsonwebtoken")

app.use(cors())
app.use(express.json())
require('dotenv').config()

const port=process.env.PORT || 5000


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.REACT_APP_NAME}:${process.env.REACT_APP_PASSWORD}@cluster0.xuxoczf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });


    
  } finally {
    
    
  }
}
run().catch(error=>console.error(error));



app.listen(port,()=>{
    console.log('server is running')

})
app.get('/',(req,res)=>{
    res.send("HELLO WORLD")
})

