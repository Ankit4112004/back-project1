import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 


const commnentSchema= new Schema(
    {
        content:{
            type:String,
            required: true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Type.ObjectId,
            ref:"User"
        }
},{timestamps: true})

commnentSchema.plugin(mongooseAggregatePaginate);

export const comment = mongoose.model("comment",commnentSchema)