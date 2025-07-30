import mongoose,{Schema} from "mongoose"
import jwt from "jsonwebtoken"
// import bcrypt from "bcrypt"
import bcrypt from "bcryptjs"
//we are using {Schema} so will be not required to write mongoose.Schema we can directly write Schema 

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        //index for search but it inc time complexity
        index: true
    },
    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        //avatar mean profile pic
        type: String,  //we will use cloudianry database it like a aws data base we dont store the pics in file with us we store them in database
        //the cloudiarny database will give url which is a string
        required: true,
    },
    coverImage:{
        type: String //cloudinary url
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        // required: true,
        //or
        required: [true, 'password is required']
        // this will send a custom msg with true 
    },
    refreshToken:{
        type:String,
    }
},{timestamps: true})

//idhar pre wagera meh arrow fn ka use nhi karte idhar direct fn ka use karte hai
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    //if we dont write this if condition then for any change whether it is in password username or avatar or else it will refersh it so we write this if condition so it will only refresh when password is modified
    this.password =await bcrypt.hash(this.password,10);
    next();
})

// userSchema.methods.isPassword = async function (candidatepassword) {
//     return await bcrypt.compare(candidatepassword, this.password)
//     //this.password => encrypted wala password
// }
userSchema.methods.isPasswordCorrect = function (candidatePassword) {
 return bcrypt.compare(candidatePassword, this.password);
 };

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User", userSchema);