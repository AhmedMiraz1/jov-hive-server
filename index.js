const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())


//verify jwt middleware

const verifyToken = (req, res, next)=>{
  const token = req.cookies?.token
  if(!token) return res.status(401).send({message:'unauthorized access'})
      if(token){
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
          if(err){
            console.log(err);
             return  res.status(401).send({message:'unauthorized access'})
            
          }
          console.log(decoded);
          req.user= decoded
          next()
        } )
      }
     
 
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6w72r5l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const jobsCollection = client.db("jobHive").collection("jobs");
    const jobApplyCollection = client.db("jobHive").collection("jobData");


    // jwt generate
    app.post('/jwt', async(req, res)=> {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'7d'})
      res.cookie('token', token , {
        httpOnly:true,
        secure: process.env.NODE_ENV=== 'production',
        sameSite: process.env.NODE_ENV=== 'production'? 'none':'strict'
      }).send({success:true})
    })

    //clear token

    app.get('/logout', (req, res)=>{
      res.clearCookie('token', {
        httpOnly:true,
        secure: process.env.NODE_ENV=== 'production',
        sameSite: process.env.NODE_ENV=== 'production'? 'none':'strict',
        maxAge:0,
      }).send({success:true})
    })

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
      // console.log(result);
      // console.log(id);
    });

    app.post("/jobs", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.post('/jobData', async(req, res)=> {
      const jobData = req.body
      const result = await jobApplyCollection.insertOne(jobData)
      res.send(result)
    })

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.delete('/job/:id', async(req, res)=> {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
    })

    app.put('/job/:id', async (req, res)=>{
      const id = req.params.id
      const jobData = req.body
      const query = {_id: new ObjectId(id)}
      const options = { upsert: true }
      const updateDoc = {
          $set:{
            ...jobData
          }
      }
      const result = await jobsCollection.updateOne(query, updateDoc, options)
      res.send(result)
    } )


    app.get('/jobData/:email',verifyToken,  async (req, res) => {
      
      const tokenEmail = req.user.email
      console.log(tokenEmail ,"ghjkl");
      const email = req.params.email
      if(tokenEmail !== email){
        return  res.status(403).send({message:'Forbidden access'})
      }
      const query = { email }
      const result = await jobApplyCollection.find(query).toArray()
      res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job hive making server is running");
});

app.listen(port, () => {
  console.log(`server is running on port : ${port}`);
});

//   console.log(run());
