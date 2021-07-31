

const User=require('./userModel');
const catchAsync=require('./Utils/catchAsync');
const appErr=require('./Utils/AppError');

const factory=require('./handlerFactory');

exports.getAllUsers=catchAsync(async (req,res,next)=>{
    const users=await User.find(); //hashed password not exposed
    res.status(200).json({
        status:'success',
        results: users.length,
        data:{
            users
        }
    });
})

exports.getAllUsers2=factory.getMany(User);


const multer=require('multer'); //uploading images
const multiStorageD=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/img/users');
    },
    filename:(req,file,cb)=>{
        const ext=file.mimetype.split('/')[1];
        cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
    //    cb(null,"user-1.jpg");
    }
});
const multiStorageM=multer.memoryStorage();//this way image wil be stored as a buffer adn will be available @req.file.buffer
const multiFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){cb(null,true);}
    else{cb(new appErr('Not an image! Please upload only images',400),false);}
}
//const upload=multer({dest:'public/img/users'}); //destination option //now updatd as below
//const upload=multer({storage: multiStorageD, fileFilter: multiFilter}); //ok now add sharp for re-sizing images so savefile to memory NOT disk
const upload=multer({storage: multiStorageM, fileFilter: multiFilter});
exports.uploadUserPhoto=upload.single('photo')
//'photo' is th ename of field that will hols the image/file to upload in the form that will upload images
//MW in the stack taking the file (basicall copying it) to the destination we specified, &put some info in req obj; then call updateMe


const sharp=require('sharp');
exports.resizeUserPhoto=catchAsync(async (req,res,next)=>{
    if(!req.file){return next();}
   // sharp(req.file.buffer);//1)write the file to disk then read it here again; 2) keep image in memory and read it  more efficiently
    // /this returns an obj that could be chained
    //const fileName=`user-${req.user.id}-${Date.now()}.${ext}`;
    //but need req.file.filename for filteredBody in updateMe below as req.file.filename not defined as multistorageD->multistorageM
    req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`; 
    console.log('req.file.filename: ',req.file.filename);
    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90})//90% compressed a bit
        //.toFile(`public/img/${fileName}`);//need the entire path
        .toFile(`public/img/users/${req.file.filename}`); //file destination
    next();
})



const filteredObj=(obj, ...allowedFields)=>{ 
    const newObj={};
    Object.keys(obj).forEach(el=>{ 
        if(allowedFields.includes(el)){newObj[el]=obj[el];}
    })
    return newObj;
}
exports.updateMe=catchAsync(async (req,res,next)=>{
    console.log("req.file from multer upload MW: ",req.file);
    console.log("req.body in updateMe: ", req.body);
    console.log("req.user in updateMe: ", req.user);
    if(req.body.password||req.body.passwordConfirm){
        return next(new appErr('This route is not for password updates. Please use /updateMyPassword',400))
    }
    const filteredBody=filteredObj(req.body,'name','email');
    if(req.file) filteredBody.photo=req.file.filename; //!//need filename not file path //.photo is the name of field that holds the photo
    const updatedUser=await User.findByIdAndUpdate(req.user.id,filteredBody,{ 
        new: true,
        runValidators: true
    }); 

    res.status(200).json({
        status:'success',
        data:{
            user:updatedUser
        }
    })
})

exports.getMe=(req,res,next)=>{
    req.params.id=req.user._id;
    next();
}

exports.deleteMe=catchAsync(async (req,res)=>{
    await User.findByIdAndUpdate(req.user.id,{active:false}); 
    res.status(204).json({
        status:'success',
        data:null
    })
})



exports.addAnUser=(req,res)=>{
    res.status(500).json({
        status:'error',
        message:"This route is never defined! Please use sign up instead."
    })
}
exports.getAnUser=factory.getOne(User);
exports.updateAnUser=factory.updateOne(User);
exports.deleteAnUser=factory.deleteOne(User);

