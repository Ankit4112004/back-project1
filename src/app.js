import express from "express";
import cookieParser from "cookie-parser";
import cors from"cors";


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))
//if data is coming from json
app.use(express.json({limit:"16kb"}))
//if data is coming url
app.use(express.urlencoded({
    extented: true,
    limit:"16kb" //it is changable
}))
//if i have some file and i wan to keep them in public
app.use(express.static("public"))
//to work on cookies
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration
// app.use("/users",userRouter)
// or better practice
app.use("/api/v1/users", userRouter)

//http://localhost:8000/users/register
export {app}
// or
// export default app