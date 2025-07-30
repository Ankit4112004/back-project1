import { ApiError } from "../utils/apError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async(req, res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?. replace("Bearer", "")
    //the auth msg comes like Auth : bearer ccjdkls so we need to remove bearer
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
        }
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
}) 