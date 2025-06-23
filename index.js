//import dotenv to loard environment variable
require ('dotenv').config()

//import express
const express=require('express')

//import cors
const cors=require('cors')

//import router
const router=require('./routes')


//import connection.js
require('./connection')


//Create a express server 
//create an express application .the  express() function is a top-level function exported by the express module
const MyntraServer=express()

//use of cors -to communicate with view
MyntraServer.use(cors())

//use json method -return a middleware which can parse json formate
MyntraServer.use(express.json())

//use router
MyntraServer.use(router)
//set port for the server
PORT = 4000 || process.env.PORT

//listen to the port -to resolve the request
MyntraServer.listen(PORT,()=>{
    console.log(`Server running successfully at port number: ${PORT}`);
})