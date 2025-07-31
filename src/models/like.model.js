import mongoose,{Schema} from "mongoose";
import { type } from "os";

const likeSchema = new Schema({
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const like = mongoose.model("like",likeSchema)