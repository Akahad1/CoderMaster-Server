const express =require('express')
const cors=require('cors')
const app =express()
const jwt=require("jsonwebtoken")
const SSLCommerzPayment = require('sslcommerz-lts')

app.use(cors())
app.use(express.json())
require('dotenv').config()

const port=process.env.PORT || 5000



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.REACT_APP_NAME}:${process.env.REACT_APP_PASSWORD}@cluster0.xuxoczf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function veryfiyjwt(req,res,next){
  const authHeader =req.headers.authraization
  console.log('headertoken', authHeader)
  console.log('env code', process.env.ACCESS_TOKEN_SECRET)
  if(!authHeader){
    res.status(401).send({message:'unauthraized access'})
  }
  const token=authHeader.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
    if(err){
      res.status(403).send({message:'Forbidend access'})
    }
    req.decoded=decoded
    next()
  })

}

const store_id = process.env.REACT_APP_STORE_ID
const store_passwd = process.env.REACT_APP_STORE_PASSWD
const is_live = false //true for live, false for sandbox


async function run() {
  try {
    
     client.connect();
    // await client.db("admin").command({ ping: 1 });
    const allCouresCollation =client.db('CoderMaster').collection('AllCoures')
    const instactorCollation =client.db('CoderMaster').collection('Instactor')
    const OrderCollation =client.db('CoderMaster').collection('order')
    const ClassCollation =client.db('CoderMaster').collection('Class')

    app.post('/jwt',(req,res)=>{
      const user=req.body;
      console.log('useremail',user)
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'4d'})
      res.send({token})
    })



    app.get('/allcoures',async(req,res)=>{
        const qurey ={}
        const result =await allCouresCollation.find(qurey).toArray()
        res.send(result)
    })
    
    app.get('/allcoures/:id',async(req,res)=>{
      const id=req.params.id;
      console.log(id)
        const qurey ={codeid:id}
        const result =await allCouresCollation.findOne(qurey)
        res.send(result)
    })
    app.get('/instactor',async(req,res)=>{
      const qurey={}
      const result= await instactorCollation.find(qurey).toArray()
      res.send(result)
    })
    
    // Payment Data
    const tran_id =new ObjectId().toString()

    app.post('/orders',async(req,res)=>{
      const qurey ={_id: new ObjectId(req.body.OrderID)}
      const product =await allCouresCollation.findOne(qurey)
      const order =req.body
      console.log(product)

      const data = {
        total_amount: product?.price,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/sucess/${tran_id}`,
        fail_url: `http://localhost:3000/payment/fail/${tran_id}`,
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: order?.userName,
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    console.log(data)

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({url:GatewayPageURL})
        console.log('Redirecting to: ', GatewayPageURL)
    });

    const finalOrder={
      userName:order?.userName,
      userEmail:order?. userEmail,
      OrderID:order?.OrderID,
      serialId:order?.serialId,
      name:order?.name,
      price:order?.price,
      paidStatus:false,
      tranId:tran_id

    }  
    const result =await OrderCollation.insertOne(finalOrder)
    
    })

    app.post('/payment/sucess/:tranId',async(req,res)=>{
      console.log(req.params.tranId)
      const qurey ={tranId:req.params.tranId}
      const updatedoc ={
        $set:{
          paidStatus:true
        }
      }
      const result =await OrderCollation.updateOne(qurey,updatedoc)
      if(result.modifiedCount>0){
        res.redirect(`http://localhost:3000/payment/sucess/${req.params.tranId}`)
      }
    })
    
    app.post('/payment/fail/:tranId',async(req,res)=>{
      console.log(req.params.tranId)
      const qurey ={tranId:req.params.tranId}
      
      const result =await OrderCollation.deleteOne(qurey)
      if(result.deletedCount){
        res.redirect(`http://localhost:3000/payment/fail/${req.params.tranId}`)

      }
      
       
      
    })
    

    
   app.get('/orders',async(req,res)=>{
    const email=req.query.email;
    
    console.log(email)
    
    const qurey ={userEmail:email}
    const result = await OrderCollation.find(qurey).toArray()
    // console.log(result.paidStatus)
    res.send(result)
   })

   app.get('/class',async(req,res)=>{
    const myclasss =req.query.myclass;
    console.log()
    const qurey={name:myclasss}
    const result=await ClassCollation.find(qurey).toArray()
    res.send(result)
   })

    
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

