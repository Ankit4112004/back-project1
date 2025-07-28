import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connected!! Db HOST:  ${connectionInstance.connection.host}`);
    }catch(e){
        console.log("mongo connection error", e);
        process.exit(1);
    }
}

export default connectDB;