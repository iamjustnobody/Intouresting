const express=require('express');
const router=express.Router();

const {getAllUsers,addAnUser,getAnUser,updateAnUser,deleteAnUser}=require('./userHandler');
const authController=require('./authHandler');
const userController=require('./userHandler');

router.get('/logout',authController.logOut);

router.post('/signup',authController.signup); ////router.route('api/v1/users/signup',authController.signup);
router.post('/login',authController.login);
router.post('/forgotPassword',authController.forgotPwd);
router.patch('/resetPassword/:token',authController.resetPwd);
//router.post('/updateMyPassword',authController.protect,authController.updatePwd);

//Me Group below
router.patch('/updateMyPassword',authController.protect,authController.updatePwd);
//router.patch('/updateMe',authController.protect,userController.updateMe); //ok now need to update image
//above are router.use(express.json('text/plain')); //below back to default 'application/json //but cannot work using router.use(express.json)

/*
//router.use(express.json('application/json')); //router.use(express.json('multipart/form-data')); //all not working
// neither this or put inside patch route stack router.patch('.',express.json) works
const multer=require('multer'); //uploading images
const upload=multer({dest:'public/img/users'}); //destination option
//upload images to file system; put a link in the db to that image; in each user document we'll have the names of allthe loaded files
router.patch('/updateMe',authController.protect,upload.single('photo'),userController.updateMe);
//'photo' is th ename of field that will hols the image/file to upload in the form that will upload images
//MW in the stack taking the file (basicall copying it) to the destination we specified, &put some info in req obj; then call updateMe
*/ //now above moves to userController & treated as a function inside/exported from usercontroller & becomes a MW in below
//router.patch('/updateMe',authController.protect,userController.uploadUserPhoto,userController.updateMe);//ok now add image processing/resizing below
router.patch('/updateMe',authController.protect,userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);

//router.use(express.json('text/plain')); //not working //back to 'text/plain' as specified in app.js

//router.patch('/deleteMe',authController.protect,userController.deleteMe);
//as this user is no longer accessible anywhere
router.delete('/deleteMe',authController.protect,userController.deleteMe);

router.get('/getMe',authController.protect,userController.getMe,userController.getAnUser);
//Me Group above




//router.delete('/:id',deleteAnUser); //testing pre/post-save helper
//router.get('/',userController.getAllUsers2); //testing pre-post-save helper

router.use(authController.protect); //could lifted up to Me Group
router.use(authController.restrictTo('admin'));
//router.use(authController.protect,authController.restrictTo('admin'));//should be ok too

//router.route('api/v1/users')
router.route('/')
   // .get(getAllUsers)
    .get(userController.getAllUsers2)
    .post(addAnUser); //hav aisn up o no need factory

//router.route('api/v1/users/:id')
router.route('/:id')
    .get(getAnUser)
    .patch(updateAnUser)
    .delete(deleteAnUser);

module.exports=router;
