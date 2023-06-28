import express from "express";
import {} from "dotenv/config.js";
import { MarkdownModel, UserModel } from "../Helpers/MongooseValidation.js";
import nodemailer from 'nodemailer';
import { generateToken } from "../Helpers/GenerateToken.js";
import { isAuth } from "../Helpers/isAuth.js";
import { passwordComparing, passwordHashing } from "../Helpers/Hashing.js";

const router = express.Router();

router.get("/",async(req,res)=>{
    res.status(200).json({message:"React Markdown Viewer"})
})
//Creating new account for the user....
router.post('/signup',async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.body.email});
        //Checking... user present or not
        if(user){
            return res.status(403).json({message : "User already exists"});
        }
        const hashedPassword = await passwordHashing(req.body.password);
        const newUser = await UserModel({
            userName:req.body.userName,
            email:req.body.email,
            password:hashedPassword
        }).save();
        //Mail transporter
        let transporter = nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.USER,
                pass:process.env.PASS
            }
        })
        //Message for mail
        let message = {
            from: 'abdulwasimsguvi@gmail.com',
            to: req.body.email,
            subject: "React Markdown Viewer Link", 
            text: "https://url-shortener-eight-sigma.vercel.app/activation", 
            html: "<p>Click the below link to activate your account</P><br/><b>https://url-shortener-eight-sigma.vercel.app/activation</b>", 

        }
        //Sending activation link mail
        let sendMail = await transporter.sendMail(message);
        res.status(200).json({message:"Check your mail for activation link",newUser});
    } catch (error) {
        res.status(500).json({message:"Unable to signup",error})
    }
});

router.put('/activation',async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.body.email});

        //Checking... user present or not
        if(!user){
            return res.status(403).json({message : "No user found"});
        }
        const updatedUser = await UserModel.updateOne({email:req.body.email},{$set:{status:"active"}});
        res.status(200).json({message:"Account activated"})
    } catch (error) {
        res.status(500).json({message:"Unable to activate your account...Try Again later",error});
    }
});

router.post('/login',async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.body.email});
        //Checking... user present or not
        if(!user){
            return res.status(403).json({message : "Invalid credential "});
        }
        const verification = await passwordComparing(req.body.password,user.password);
        if(!verification){
            return res.status(403).json({message : "Invalid credential "});
        }
        const status = user.status;
        if(status==="inactive"){
            return res.status(400).json({message:"Please activate your account...Check your mail for activation link"})
        }
        //token generating
        const token = await generateToken(req.body.email);
        res.status(200).json({message:"login success",token,email:user.email});
        
    } catch (error) {
        res.status(500).json({message:"Unable to login...Try Again later",error});
    }
    
});
//forget password page for the user...
router.put('/forgetpassword',async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.body.email});
        //Checking... user present or not
        if(!user){
            return res.status(403).json({message : "No user found"});
        }
        //token generating
        const token = await generateToken(req.body.email);

        //Mail transporter
        let transporter = nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.USER,
                pass:process.env.PASS
            }
        })
        //Message for mail...
        let message = {
            from: 'abdulwasimsguvi@gmail.com',
            to: req.body.email,
            subject: "password reset", 
            text: "<p>Click the below link to reset password</p><br/><b>https://capstone-backend-abdulwasim-s.vercel.app/resetpassword</b>", 
            html: "<p>Click the below link to reset password</p><br/><b>https://capstone-backend-abdulwasim-s.vercel.app/resetpassword</b>", 

        }
        //Sending password reset link mail...
        let sendMail = await transporter.sendMail(message);

        res.status(200).json({message:"Check you mail for reset link success",token,email:user.email});
        
    } catch (error) {
        res.status(500).json({message:"Unable to login...Try Again later",error});
    }
});

//Password reset code for the user....
router.put('/resetpassword',isAuth,async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.headers.email});
        //Checking... user present or not
        if(!user){
            return res.status(403).json({message : "No user found"});
        }
        const hashedPassword = await passwordHashing(req.body.password);
        const updatedUser = await UserModel.updateOne({email:req.headers.email},{$set:{password:hashedPassword}});
        res.status(200).json({message:"password updated"})
    } catch (error) {
        res.status(500).json({message:"Unable to updated password...Try Again later"});
    }
});
//Getting all the markdowns of the respective user...
router.post('/markdowns',async(req,res)=>{
    const markdowns = await MarkdownModel.find({email:req.headers.email});
    if(markdowns.length===0){
        return res.status(403).json({message:"No markdown found"})
    }
    res.status(200).json({message:"markdowns",markdowns});
});


//Creating new markdown....
router.post('/newmarkdown',isAuth,async(req,res)=>{
    try {
        const user = await UserModel.findOne({email:req.headers.email});
        if(!user){
            return res.status(403).json({message:"User not found"})
        }
        const status = user.status;
        if(status==="inactive"){
            return res.status(400).json({message:"Please activate your account"})
        }
        let newMarkdown = await MarkdownModel({
            email:req.headers.email,
            markdown:req.body.markdown,
            markdownName:req.body.markdownName
        }).save();
        
        res.status(200).json({message:"success",newMarkdown});
    } catch (error) {
        res.status(500).json({message:"Unable to add new makrdown...Try again",error})
    }
});


export const RouterPage = router;