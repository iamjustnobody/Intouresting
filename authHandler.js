const User=require('./userModel');
const catchAsync=require('./Utils/catchAsync')
const jwt=require('jsonwebtoken');
const appErr=require('./Utils/AppError')

const util=require('util');//ok
const {promisify}=require('util');
const crypto=require('crypto');

const sendEmail=require('./Utils/email')

const emailSender=require('./Utils/emailClass');//exports class Emailer

const signTOKEN=(id)=>{ console.log(typeof process.env.JWT_EXPIRES_IN);//string
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:`${process.env.JWT_EXPIRES_IN}`});
    //or {expiresIn: process.env.JWT_EXPIRES_IN} 
    //JWT_EXPIRES_IN='999s' or '999'  or 999s  or 999 
}

const createSendCookie=(cookieName,data,res)=>{ 
    const cookieOptions={
        expiresIn:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*1000),
        httpOnly:true,
    }
    if(process.env.NODE_ENV==='production'){cookieOptions.secure=true}
    res.cookie(cookieName,data,cookieOptions)
}

exports.signup=catchAsync(async(req,res,next)=>{
    const newUser=await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
    //    passwordChangedAt:req.body.passwordChangedAt?req.body.passwordChangedAt:null, //Date.now(),
        role:req.body.role
    })

    const url=`${req.protocol}://${req.get('host')}/me`;
    
    await new emailSender(newUser,url).sendWelcome();

     const token=signTOKEN(newUser._id);
    createSendCookie('jwt',token,res);
    newUser.password=undefined; 
    res.status(201).json({
        status:'success',
        token,
        data:{
            user:newUser
        }
    })
});

exports.login=catchAsync(async (req,res,next)=>{
    const {email,password}=req.body;
    console.log('email: ',email," password: ",password);
    if(!email||!password){return next(new appErr("Please provide email & password!",400));}

    const user=await User.findOne({email}).select('+password');
    if(!user){return next(new appErr('user does not exist',401));} 
    const correct_pwd=await user.correctPassword(password,user.password); 
    //bcrypt & correct pwd instance methods
    if(!user||!correct_pwd){return next(new appErr('Incorrect email or password',401));} 

    const token=signTOKEN(user.id); //or const token=signTOKEN(user._id);
    createSendCookie('jwt',token,res);
    res.status(200).json({
        status:'success',
        token
    });
});

exports.protect=catchAsync(async (req,res,next)=>{
    let token='';
    //checking token's still there
if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token=req.headers.authorization.split(' ')[1];
}
else if(req.cookies.jwt){token=req.cookies.jwt}


   // console.log("token: ",token);
if(!token){return next(new appErr("Your NOT logged in. Please log in to get access!",401))} //not authorised 401

    //verify token
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); 

    //check user still exists - token exists but user no longer exits (deleted meanwhile); or token issued followed by user changing his/her password
    const freshUser=await User.findById(decoded.id) 
    if(!freshUser){
        return next(new appErr('The user belonging to this token does no longer exist.', 401));
    }
    if(!freshUser.changedPwdAft(decoded.iat)){return next(new appErr('User recently changed the password. Please log in again!',401))}

    //grant access
    req.user=freshUser;
    res.locals.user=freshUser; //added this line of code so account pug can use user (getAccountMW)// just like isUserLoggedIn MW
    next();
})

exports.restrictTo=(...roles)=>{ //roles is an array
    return (req,res,next)=>{// (req.user=undeinfed then req.user=freshUser)
        
        if(!roles.includes(req.user.role)){
            return next(new appErr('You dont have permission to perform this action',403)); //403 forbidon
        }
        next();
    }
}

exports.forgotPwd=catchAsync(async (req,res,next)=>{
    //get user based on posted email
    const user=await User.findOne({email:req.body.email});
    if(!user){return next(new appErr("There's no user with email address", 404));}

    //generate random token emailed back
    const resetToken=user.createPwdResetToken();  
    await user.save({validateBeforeSave:false}); 

    //send url (with original resetToken) & message in the email to the user
    const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message=`Forgot your password? Submit a PATCH request with your new password & password confirmation to: ${resetUrl}. \nIf you didn't forget your password please ignore this email then!`;

    try {
        await new emailSender(user,resetUrl).sendPasswordReset();

        res.status(200).json({
            status:'success',
            message:'Token sent to email!'
         })
    }catch (err) {
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({validateBeforeSave:false}); 
        return next(new appErr('There was an error sending the email. Please try again!'),500); 
    }
})
exports.resetPwd=catchAsync(async (req,res,next)=>{
    //get user based on the token
    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    //req.params here because /:token in userRouter
    const user=await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});

    //if valid token & user exist  then set new password
    if(!user){return next(new appErr('Token is expired',400))}

    //update changedpasswordAt
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined; 
    await user.save();

    //log user in by sending JWT token
    const token=signTOKEN(user._id);
    createSendCookie('jwt',token,res);
    res.status(200).json({
        status:'success',
        token,
        message:'Password changed!'
    })
})

exports.updatePwd=catchAsync(async (req,res,next)=>{ 
    const user=await User.findById(req.user._id).select('+password'); 
    if(!user){return next(new appErr('No such user exists',401))}
    const correct_pwd=await user.correctPassword(req.body.currentPassword,user.password); 
    //bcrypt & correct pwd instance methods
     if(!correct_pwd){next(new appErr('Your current password is wrong',401))}
else {
         user.password = req.body.password;
         user.passwordConfirm = req.body.passwordConfirm;
         console.log("before user.save() in handler");
         await user.save();

         const token = signTOKEN(user._id);
         createSendCookie('jwt',token,res);
         res.status(200).json({
             status: 'success',
             message: 'Password has been successully reset.'
         })
     }
})








exports.isUserLoggedIn=catchAsync(async (req,res,next)=>{
    if(req.cookies.jwt&&req.cookies.jwt!='loggedout'){
        const token=req.cookies.jwt;
        const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); //cookie data (or 'loggedout') to be verified; throw err
        const freshUser=await User.findById(decoded.id)
        if(!freshUser){return next();}
        if(!freshUser.changedPwdAft(decoded.iat)){return next()}
        res.locals.user=freshUser; 
        return next(); //opt
    }
    next();
})

exports.isUserLoggedIn2=async (req,res,next)=>{
    if(req.cookies.jwt){
        try{
            const token=req.cookies.jwt;
            const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); 
            const freshUser=await User.findById(decoded.id)
            if(!freshUser){return next();}
            if(!freshUser.changedPwdAft(decoded.iat)){return next()}
            res.locals.user=freshUser;
            return next(); //opt
        }catch(err){
            return next(); //no errors that jump to error handling mW; go to next MW instead
        }
    }
    next();
}

exports.logOut=catchAsync(async (req,res,next)=>{ //similar to createSendCookie
    res.cookie('jwt','loggedout',{ 
        expires:new Date(Date.now()+10*1000),
        httpOnly:true
    });
    res.status(200).json({status:'success'})
})


