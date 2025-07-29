import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/apError.js"
import { User } from '../models/user.model.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apirespnse.js';

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
    console.log("email", email);
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
        email,
        password,
        username: username.toLowerCase()
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

export {registerUser}