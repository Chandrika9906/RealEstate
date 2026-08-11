import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import sendEmail  from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

//Register
export const register = async (req,res) => {
    try{
        const {name,email,password,role} = req.body;
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: role === "seller"? false : true,
            verificationToken: verificationToken
        });
        try{
            await sendEmail({
                email,
                subject: "Verify Your Email - Real Estate Platform",
                message: `<p> Your email verification code is : <strong>${verificationToken}</strong></p>Please enter this code on the verification page to activate your account/p>`
            });
        }
        catch(emailError){
            console.error("Failed to send verification email:",emailError)
        }
        res.status(201).json({
            message: "User registered. Please check your email for the verification code.",
            user:{
                email:user.email,
                name:user.name,
                role:user.role
            }
        });
    }
catch(err){
    res.status(500).json({
        message:err.message
    });
}
}

//Login 
export const login = async (req,res) => {
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                message: "Email and Password are Required."
            });
        }
        const user = await User.findOne({email});
        if(!user.isVerified){
            return res.status(403).json({
                message: "Please Verify your email or contact support"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
               message: "Invalid email or Password" 
            })
        }
        if(user.isBlocked){
            return res.status(403).json({
                message: "Your account has been bloacked by an admin. Please conatact support."
            });
        }
        if (!user) {
    return res.status(404).json({
        message: "User not found"
    });
}
        //token 
        const token = jwt.sign({id : user._id , role: user.role},process.env.JWT_SECRET,{ expiresIn:"7d"});
        res.json({
            message:"Login Successful",
            token,
            user,
        });
    }
    catch(err){
    res.status(500).json({
        message:err.message
    });
    }
} 

//to get profile
export const getMe = async (req,res)=>{
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.json({
            success:true,
            user,
        });
    }
    catch(err){
    res.status(500).json({
        message:err.message
    });
}
}

// to verify the email
export const verifyEmail = async (req,res)=>{
    try{
        const {email, code} = req.body;
        if(!email || !code){
            return res.status(400).json({message:"Email and code are required"})
        }
        const user = await User.findOne({email});
        if(!user){
            res.status(404).json({message: "User NOt Found"});
        }
        if(user.isVerified){
            return res.status(400).json({message:"Email already verified."});
        }
        if(user.verificationToken !== code){
            return res.status(400).json({message: "Invalid Verification code"});
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        return res.status(200).json({
            message: "Email verified Successfully",
            success: true
        });
    }
    catch(err){
    res.status(500).json({
        message:err.message,
        success: false
    });
}
}

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No user found with that email address" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpire = resetPasswordExpire;
        await user.save();

        const clientUrl = "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>This link will expire in 15 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset - Real Estate Platform",
                message,
            });
            res.status(200).json({ message: "Password reset email sent", success: true });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Could not send email", success: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
};

//for the reset password we require the email
//now to rest it(pasword)
export const resetPassword = async (req,res)=>{
    try{
        const {token} = req.params;
        const {password}= req.body;
        const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });
        if(!user){
            return res.status(400).json({
                mmessage: "Invalid"
            })
        }
        user.password = await bcrypt.hash(password,10);
        user.resetpasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({
            message: " password updated Successfully",
            success: true
        })
    }
    catch(err){
    res.status(500).json({
        message:err.message,
        success: false
    });
}
}
