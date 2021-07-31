const express=require('express');

const router=express.Router();



const viewsHandler=require('./viewsController');  const authController=require('./authHandler');


router.get('/me',authController.protect,viewsHandler.getAccount);

router.get('/my-tours',authController.protect,viewsHandler.getMyTours);


const bookingHandler=require('./bookingController');
router.get('/',bookingHandler.createBookingCheckout,authController.isUserLoggedIn2,viewsHandler.getOverview)


router.use(authController.isUserLoggedIn2); //router.use(authController.isUserLoggedIn);


router.get('/overview',viewsHandler.getOverview); router.get('/tours',viewsHandler.getOverview); //opt
router.get('/tours/:id',viewsHandler.getTour); 
router.get('/tour/:tourName', viewsHandler.getTour); //:slug
router.get('/',viewsHandler.getOverview) //end ok


//login Routes
router.get('/login',viewsHandler.getLoginForm)

module.exports=router;
