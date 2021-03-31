const express=require('express');

const router=express.Router();


/*
router.get('/',(req,res)=>{
    res.status(200).render("base",{ //browser render base template - looking for base(.pug) template in __dirname (defined views/pug location in app.js)
        //can also send (local) data to base template
        tour: "forest hiker",
        user:"jonas"
    });
}) //looking for the base.pug in app.set("views",`${__dirname}`); or app.set("views",".");

router.get('/overview',(req,res)=>{
    res.status(200).render('toursoverview',{title:'All Tours'})
})
router.get('/tour',(req,res)=>{
    res.status(200).render('tourdetails',{title:'the forest hiker tour'})
})
 */ //move to viewsController.js

const viewsHandler=require('./viewsController');  const authController=require('./authHandler');

//router.post('/submit-user-data',authController.protect,viewsHandler.updateUserData); //WITHOUT API CALL

router.get('/me',authController.protect,viewsHandler.getAccount);

router.get('/my-tours',authController.protect,viewsHandler.getMyTours);
//same as getMyTours_backend in bookingController & get '/myTours' in bookingRoutes


const bookingHandler=require('./bookingController');
router.get('/',bookingHandler.createBookingCheckout,authController.isUserLoggedIn2,viewsHandler.getOverview)
//for testing temperory createBookingCheckout


router.use(authController.isUserLoggedIn2); //router.use(authController.isUserLoggedIn);

//router.get('/',viewsHandler.getOverview) //beginning //ok
router.get('/overview',viewsHandler.getOverview); router.get('/tours',viewsHandler.getOverview); //opt
router.get('/tours/:id',viewsHandler.getTour); //now isUserLoggedIn rather than auth.protect; //router.get('/tours/:id',authController.protect,viewsHandler.getTour)
//isUserLoggedIn MW for rendering pages only; whilst auth.protect for specific routes that need protecting
//router.get('/tours/:id',viewsHandler.getTour) //router.get('/tours/:slug',viewsHandler.getTour) //router.get('/tour/:slug',viewsHandler.getTour) //router.get('/tour',viewsHandler.getTour)
router.get('/tour/:tourName', viewsHandler.getTour); //:slug
router.get('/',viewsHandler.getOverview) //end ok


//login Routes
router.get('/login',viewsHandler.getLoginForm)

module.exports=router;