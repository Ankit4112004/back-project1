import mongoose,{Schema} from "mongoose";
//didnt understood
const subscriptionSchema = new Schema({ //general people joh subscribe kar rhe hai channel ko
    subscriber:{
        type: Schema.Types.ObjectId, //one who is subscribing to the channel
        ref:"User"
    },
    //channel ka malik joh kisi ayr ko subscriber kar rha hai
    channel:{
        type:Schema.Types.ObjectId,
        //one to whom 'subscriber' is subscribing
        ref:"User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription".subscriptionSchema)