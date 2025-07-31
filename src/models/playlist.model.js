import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema({
    name:{
        type:String,
        required: true
    },
    descripiton:{
        type:String,
        required: true
    },
    video:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ]
},{timestamps: true})

export const Playlist = mongoose.model("Playlist","playListSchema")

