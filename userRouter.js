const express=require('express');
const router=express.Router();

const {getAllUsers,addAnUser,getAnUser,updateAnUser,deleteAnUser}=require('./userHandler');
const authController=require('./authHandler');
const userController=require('./userHandler');

router.get('/logout',authController.logOut);

router.post('/signup',authController.signup); 
router.post('/login',authController.login);
router.post('/forgotPassword',authController.forgotPwd);
router.patch('/resetPassword/:token',authController.resetPwd);

//Me Group below
router.patch('/updateMyPassword',authController.protect,authController.updatePwd);
router.patch('/updateMe',authController.protect,userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);

router.delete('/deleteMe',authController.protect,userController.deleteMe);

router.get('/getMe',authController.protect,userController.getMe,userController.getAnUser);
//Me Group above





router.use(authController.protect); 
router.use(authController.restrictTo('admin'));


router.route('/')
    .get(userController.getAllUsers2)
    .post(addAnUser); 


router.route('/:id')
    .get(getAnUser)
    .patch(updateAnUser)
    .delete(deleteAnUser);

module.exports=router;
