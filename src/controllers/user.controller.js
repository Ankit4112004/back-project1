import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/apError.js"
import { User } from '../models/user.model.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apirespnse.js';
import jwt  from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Subscription } from '../models/subscription.model.js';

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,error)
    }
}


// for testing
// => http://localhost:8000/api/v1/users/register
const registerUser =asyncHandler(async(req, res)=>{
    console.log("FILES RECEIVED:", req.files);
    console.log("BODY RECEIVED:", req.body);

    //get user details from frontend
    //validation - not empty
    //check if user already exists : username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in  db
    //remoeve password and refresh token field from response
    //check for user creation
    //return res

    const{fullname, email, username, password} = req.body;
    console.log("email : ", email);
    //checking all fields are non empty
    if(
        [fullname, email, username, password].some( field=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    //checking whether username and email id are unique or not
    const existedUser =await User.findOne({
    //checking for usernamename and email id simultaneously
        $or:[{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already existed")
    }
console.log("req.files", req.files);
console.log("req.body", req.body);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImagePath = req.files?.coverImage[0]?.path;

    //hey optional chaining is not working properly so need to do class if-else if we use optional chaining here then we have to fill this coverimage with some data in postman if we leave it blank then it will give error while we do optional chaining
    //therefore we will do classical if else then we can freely leave this coverimage space blank in post req in postman

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log('avatar file',avatarLocalPath)
    console.log('cover image',coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is requires")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    //since we have made the coverimage field optional therefore we if we give a data then cloudinary will give a data to the coverImage else cloudinary will return a empty string
    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email.toLowerCase().trim(),
        password,
        username: username.toLowerCase().trim()
    })

    //if the user is created then a new field ._id will be created and automatically attached to user and moreover now we want the user didnt contains password and refreshtoken info fow which we have a syntax .select("-field1 -field2") write field which u dont wan to add with a minus sign
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while regisering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
    //for testing registration of user go to postman and do http://localhost:8000/api/v1/users/register
    //go to form data
})

const  loginUser = asyncHandler(async(req,res)=>{
    //req->body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookies
    //to see thw users in db =>
const allUsers = await User.find({});
console.log("All users in DB:");
console.log(allUsers.map(u => u.email));
// <=
    console.log("Login Email:", req.body.email);
    console.log("Login password:", req.body.password);
    const { username, password} = req.body
    const email = req.body.email?.toLowerCase().trim();
    if(!username && !email) {
        throw new ApiError(400, "username or email is required");
    }
    //user ->our created user
    //User ->mongoose wala imported user
    const user = await User.findOne({
        $or:[{username},{email}]
    })



    if(!user){
        throw new ApiError(404,"User does  not exist");
    }

    const isPasswordValid = user.isPasswordCorrect(password);
    
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    //before sending cookies we need to design some options for them options is in object form
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User loggedin successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from the document
            }
        },{
            //for refresh
            new : true
        }
     )
     
     const options = {
         httpsOnly : true,
         secure: true
        }
        
        return res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {},"User logged Out"));
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options ={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
}
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =  user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});  
    
    return res.status(200)
    .json(new ApiResponse(200,{},"Password changes successfully"))
})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200, req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email: email
            }
        },
        {new : true}    
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    //since this time we are only changing one file
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploadding on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user, "avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    //since this time we are only changing one file
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing");
    }

    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploadding on cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200, user,"cover image updated successfully")
    )
})

const getUserChannnelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    } 

    // User.find({username})
    //this can be use to find user with this username but this consume lots of time, so we will use aggreate pipelines

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase(),
            }
        },
        {
           $lookup:{
            // from:"Subscription"
            //this is wrong becz in model the name becom plural and lowercase
            // so Subscription will become subscriptions
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
           } 
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size: "subscribers"
                },
                channelIsSubscribedToCount:{
                    $size: "subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in : [req.user?._id,"subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },{
        $project:{
            fullname:1,
            username:true,
            subscribersCount:1,
            channelIsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"Iser channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                // _id: req.user._id this is incorrect
                _id: new mongoose.Types.ObjectId(req,user._id)
            }
        },
        {
            $lookup:{
                from:"Videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                    $lookup:{
                        from : "users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                            $project:{
                                fullname:1,
  username: 1,
  avatar: 1                              
                            }
                            }
                        ]    
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                              $first:"$owner"  
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannnelProfile,
    getWatchHistory
}