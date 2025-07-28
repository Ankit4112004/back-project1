import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config();

connectDB();
console.log('PORT:', process.env.PORT);





// method - 1 for using express -> using it directly in the same file 
/*
import express from "express"
const app = express();
//using IIFE as it returns te fn immediately 
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URL},/${DB_NAME}`)
        app.on("error",(e)=>{
            log("ERR :", e);
            throw e
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on ${process.env.PORT}`)
        })
    }
    catch(e){
        console.error("Error :", e)
    }
})()
*/