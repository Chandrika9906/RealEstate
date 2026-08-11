import mongoose from "mongoose";
import property from "./property.models";
const inquirySchema = new mongoose.Schema({
    property:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Property",
        required:true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    isRead: {
        type:Boolean,
        deafault: false,
    },
},{
    timestamps: true
});
const Inquiry=mongoose.model("Inquiry",inquirySchema);
export default Inquiry;