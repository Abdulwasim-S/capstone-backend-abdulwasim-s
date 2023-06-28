import mongoose from "mongoose";

const userSchema = await mongoose.Schema({
    userName:{
        type : String,
        required : true
    },
    email:{
        type : String,
        required : true
    },
    password:{
        type : String,
        required : true
    },
    status:{
        type : String,
        required : true,
        default : "inactive"
    }
})

const markdownSchema = mongoose.Schema({
    email : {
        type : String,
        required : true,
    },
    markdownName:{
        type : String,
        required : true,
        default : "No name"
    },
    markdown : {
        type : String,
        required : true,
        unique: true
    },
})

export const UserModel = mongoose.model("users",userSchema);
export const MarkdownModel = mongoose.model("markdowns",markdownSchema);