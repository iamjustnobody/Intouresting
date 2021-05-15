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
    //{expiresIn:`${process.env.JWT_EXPIRES_IN}`} or {expiresIn: process.env.JWT_EXPIRES_IN} //both are ok too
    //JWT_EXPIRES_IN='999s' or '999'   //JWT_EXPIRES_IN=999s  or 999 //all ok all typr string
}

const createSendCookie=(cookieName,data,res)=>{ //createSendCookie=('jwt',token,res)=>{
    //calling name of cookie JSON web token 'jwt' //data that we wanna send in the cookie (basically token)
    const cookieOptions={
        expiresIn:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*1000),
        httpOnly:true,
    }
    if(process.env.NODE_ENV==='production'){cookieOptions.secure=true}
    res.cookie(cookieName,data,cookieOptions)
}

exports.signup=catchAsync(async(req,res,next)=>{
//    const newUser=await User.create(req.body);
// User.save() for create & update
    console.log("before signup");
    const newUser=await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
    //    passwordChangedAt:req.body.passwordChangedAt?req.body.passwordChangedAt:null, //Date.now(),
        role:req.body.role
    });
    console.log("after signup");

    const url=`${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new emailSender(newUser,url).sendWelcome();

 //   const token=jwt.sign({id:newUser._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES}); //ok
    const token=signTOKEN(newUser._id);
    createSendCookie('jwt',token,res);
    newUser.password=undefined; //not showing hashed (by MW) password in postman o/p below (for when creating pwd for new user signup)
    // (hashedPwd in db; when query not showing pwd in o/p as password select false in model schema)
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

    const user=await User.findOne({email}).select('+password');//findOne not expose hashed-password
    // but now need checking password so explicitly making password exposed (by selecting/gettting/finding to be true)
    if(!user){return next(new appErr('user does not exist',401));} //including invalid email address
    console.log(user); //show password //show user.password as undefined if no select('+password')
    //user is the doc - the result of quering User model
    const correct_pwd=await user.correctPassword(password,user.password); //user is this //need await as correctPassword is async func
  //  const correct_pwd=await user.correctPassword2(password); //seems ok too
    //bcrypt & correct pwd instance methods
    if(!user||!correct_pwd){return next(new appErr('Incorrect email or password',401));} //keep message vague to attacker

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


    console.log("token: ",token);
if(!token){return next(new appErr("Your NOT logged in. Please log in to get access!",401))} //not authorised 401

    //verify token
    //jwt.verify(token,process.env.JWT_SECRET,callback)//async -> after verify then callback
    //promisify above func to make it return a promise so can use async & await (like other promise)
    //promisify(jwt.verify) returns a promise ///call promisify then pass func (i.e. jwt.verify) into promisify -> this return a func which needs to be called to return a promise

    console.log('to decode jwt json web token'); //below token expired error could occur -> err handling MW prod
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); //executing promisify(jwt.verify) returns a promise (async fn) that can be await
    console.log('decoded jwt json web token: ',decoded); //correct user id
//very token could incur two types of errors: jsonwebtokenerror (invalid signiture) or TokenExpiredError (jwt expired)
    //so need to handle these errors making them operational in global error handling via apperror (for node-env production showing messages to clients)
    //or error handling in this MW using try catch block (promisify async)

    //check user still exists - token exists but user no longer exits (deleted meanwhile); or token issued followed by user changing his/her password
    const freshUser=await User.findById(decoded.id) //thats why store _id as obj in payload //also means above decoded is not null //also key is that id in payload (or decoded.id) has not been altered
    if(!freshUser){
        return next(new appErr('The user belonging to this token does no longer exist.', 401));
    } //this was intended for checking 1st error but kept awaiting responses

    //for 2nd error - build instance method which will be available for all docs
    //docs are instances of a model; see User model
    //check if user changes password after jwt/token's issued
    if(!freshUser.changedPwdAft(decoded.iat)){return next(new appErr('User recently changed the password. Please log in again!',401))}

    //grant access
    console.log("req.body @auth protect",req.body);
    console.log('req.user before ',req.user);
    req.user=freshUser; //not midified the one in db //just store/update/modify the req.
    console.log('req.user after ',req.user);
    console.log('user.id= ',typeof req.user.id,req.user.id);
    console.log('user._id ',typeof req.user._id,req.user._id);
    res.locals.user=freshUser; //added this line of code so account pug can use user (getAccountMW)// just like isUserLoggedIn MW
    next();
})

exports.restrictTo=(...roles)=>{ //roles is an array
    return (req,res,next)=>{//MW & can access/use argument roles
        //where's role of current user stored //first protect then restrictTo then deleteusers in userRouter.js
        //so stord in req.user (as req.user=undeinfed then req.user=freshUser)
        console.log("role:",req.user.role);
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
    const resetToken=user.createPwdResetToken();  //await user.save();//incorrect
    await user.save({validateBeforeSave:false}); //need saving as modified in createPwdResetToken (this.xxx=) in methods in usermodel
   //so although not output in User.create when user signup -> after user.save() will display resetpassword fields in mongodb
    //update patch
    //and auto validate all fields' required & validator (from top down in user model schema) if not set to false to validate b4 save
    console.log("authhandler",resetToken,user.passwordResetToken);

    //send url (with original resetToken) & message in the email to the user
    const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message=`Forgot your password? Submit a PATCH request with your new password & password confirmation to: ${resetUrl}. \nIf you didn't forget your password please ignore this email then!`;

    try {
    /*    await sendEmail({ //could incur error when sendEmail & when err, need to set back the password resettoken & password reset expires
            email:user.email,
            message,
            subject:'Your password reset token (valid for 10min)'
        });
     //sendEmail is async  func // or req.body.email (or user.email)
*/ //ok too or updated to new Emailer/emailSender as below
        //can move resetUrl above await new(below) inside try block //unused message here (actually copied to passwordReset.pug
        await new emailSender(user,resetUrl).sendPasswordReset();

        res.status(200).json({
            status:'success',
            message:'Token sent to email!'
         })
    }catch (err) {
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({validateBeforeSave:false}); //as we've modified user.passwordXxx //update patch
        return next(new appErr('There was an error sending the email. Please try again!'),500); //server error
        // no need return here
    }
})
exports.resetPwd=catchAsync(async (req,res,next)=>{
    //get user based on the token
    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    //req.params here because /:token in userRouter
    const user=await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});

    //if valid token & user exist  then set new password
    if(!user){return next(new appErr('Token is expired',400))}

    //update passwordChangedAt
//    user.passwordChangedAt=Date.now()-1000; //better to do in pre save MW in user model; just need to save in the end

    //update changedpasswordAt
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined; //no longer in db after setiing to undefined (previously in db due to createPwdResetToken (this.xxtokenxx in methods in userModle) & user.save in forgotPwd func)
    await user.save(); //validator on checking if pwd===pwdConfirmation -> like findandupdate {runvalidator:true}
    //also then perform pre save MW as defined in userModel

    //log user in by sending JWT token
    const token=signTOKEN(user._id);
    createSendCookie('jwt',token,res);
    res.status(200).json({
        status:'success',
        token,
        message:'Password changed!'
    })
})

exports.updatePwd=catchAsync(async (req,res,next)=>{ console.log("updating pwd: req.body->",req.body," user->",req.user);
  //  const user=await User.findOne({email:req.body.email});
    //for user who's already logged in so already have user in req obj -> from protect MW
    const user=await User.findById(req.user._id).select('+password'); //get hashed/encrypted-password from db otherwise user.pwd=undefined
    //or const user = await User.findById(req.user.id).select('+password');
    if(!user){return next(new appErr('No such user exists',401))}
    const correct_pwd=await user.correctPassword(req.body.currentPassword,user.password); //user is this //need await as correctPassword is async func
    //  const correct_pwd=await user.correctPassword2(password); //seems ok too
    //bcrypt & correct pwd instance methods
     if(!correct_pwd){next(new appErr('Your current password is wrong',401))}
   ///// if(!correct_pwd){return next(new appErr('Your current password is wrong',401))}
         /////then remove else
else {
         user.password = req.body.password;
         user.passwordConfirm = req.body.passwordConfirm;
         console.log("before user.save() in handler");
         await user.save();//run validator to check password/confirm //then run pre save MW
         //  await User.findByIdAndUpdate(user._id,user,{runValidators:true}); //no working on validator or pre save MW
         console.log("after user.save() in handler");

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
 //   if(req.cookies.jwt){
        const token=req.cookies.jwt;
        console.log("cookie token: ",token);
        const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); //cookie data (or 'loggedout') to be verified; throw err
        console.log('decoded cookie token: ',decoded);
        const freshUser=await User.findById(decoded.id)
        if(!freshUser){return next();}
        if(!freshUser.changedPwdAft(decoded.iat)){return next()}
        res.locals.user=freshUser; //key so 'user' can be usedin the page that rendered -> topbar displaing login or logout
        return next(); //opt
    }
    next();
})

exports.isUserLoggedIn2=async (req,res,next)=>{
    if(req.cookies.jwt){
        try{
            const token=req.cookies.jwt;
            console.log("cookie token: ",token);
            const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); //cookie data (or 'loggedout') to be verified; throw err
            console.log('decoded cookie token: ',decoded);
            const freshUser=await User.findById(decoded.id)
            if(!freshUser){return next();}
            if(!freshUser.changedPwdAft(decoded.iat)){return next()}
            res.locals.user=freshUser; //key so 'user' can be usedin the page that rendered -> topbar displaing login or logout
            return next(); //opt
        }catch(err){
            return next(); //no errors that jump to error handling mW; go to next MW instead
        }
    }
    next();
}
//viewsRoutes close2front end; except removing apperror pretty much the same as auth.protect MW (more secure, backend+ closed2frontend personal page)

exports.logOut=catchAsync(async (req,res,next)=>{ //similar to createSendCookie
    res.cookie('jwt','loggedout',{ //random data and no last long //'jwt' 'loggedout' -> isUserLoggedIn(2) in overviewRoutes.js
        expires:new Date(Date.now()+10*1000),
        httpOnly:true
    });
    res.status(200).json({status:'success'})
})


