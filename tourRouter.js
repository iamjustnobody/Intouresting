const express=require('express');
const router=express.Router();

const tourController=require('./tourHandler');
const {getTours,addATour,getATour,updateATour,deleteATour,paramsValidateMW,bodyValidateMW}=require('./tourHandler');
const authController=require('./authHandler');


/*
//router.get('/api/v1/tours/top-5-cheap',tourController.aliasTopTours,tourController.getTours); //ok too
router.get('/api/v1/tours/top-5-cheap',tourController.aliasTopTours,tourController.getTours3);
router.route('/api/v1/tours/getStats').get(tourController.getStats);
*/
router.get('/top-5-cheap',tourController.aliasTopTours,tourController.getTours3); //or tourController.getTours tourController.getTours2
router.route('/getStats').get(tourController.getStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin)
// /tours-distance?distance=233&center=-40,45&unit=mi
// /tours-distance/233/center/-40,45/unit/mi
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)




router.route('/')
    .get(tourController.getTours3)
  //  .post(tourController.addATour3) //authController.protect,authController.restrictTo('admin','lead-guide'),
    .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.addATour3)
router.route('/:id')
    .get(tourController.getATour3)
//    .patch(tourController.updateATour3) //authController.protect,authController.restrictTo('admin','lead-guide'),
//    .delete(tourController.deleteATour3); //authController.protect,authController.restrictTo('admin','lead-guide'),
    .patch(authController.protect,authController.restrictTo('admin','lead-guide'),
        tourController.uploadTourImages,tourController.resizeTourImages,
        tourController.updateATour3)
    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteATour3);

/*
//express.json already in app.use app.js
const {getTours2,addATour2,getATour2,updateATour2,deleteATour2}=require('./tourHandler');
router.route('/')
  //  .get(getTours2) //get(catchAsync(getTours)) or get(catchAsync(tourController.getTours)) //get(tourController.getTours)
    .get(authController.protect,getTours2) //updated advance
    */
 ////   .post(express.json({type:'*/*'}),bodyValidateMW,addATour2);
/*
router.route('/:id')
    .get(getATour2)
    .patch(updateATour2)
//    .delete(deleteATour2)
    .delete(authController.protect,authController.restrictTo('admin','lead guide'),deleteATour2); //improved version
*/







//router.use(express.json({type:'*/*'})); //MW for below all; equivalent to express.json in app.js
// (to be used in userrouter & tourrouter

//router.param('id',(req,res,next,val)=>{next();});
//router.param('id',paramsValidateMW); //MW for all;checks for all
//the above one now no longer needed as mongodb will deal with id for us
////router.route('/api/v1/tours')       ////
 ////   .get(getTours)                  ////
 ////   .post(express.json({type:'*/*'}),bodyValidateMW,addATour);         ////
//MW for post a new Tour on this route - additional express.json() check //already has express.json in app.js
//below correct
//router.post('/api/v1/tours',express.json({type:'*/*'}),(req,res)=>{console.log(req.body);res.json(req.body);})
// above correct
//    .post((req,res)=>{req.headers["Content-Type"]="application/json";console.log(req.body);res.send("Done");});
//req.setHeader("Content-Type","application/json");


/*
//router.param('id',paramsValidateMW); //already has one above; no need a second one; althugh this is where id is actually needed checking
router.route('/api/v1/tours/:id')
    .get(getATour)
    .patch(updateATour)
    .delete(deleteATour);
*/




/*
//post or get /tour/:tourId/reviews/ with logged in user id
//get /tour/:tourId/reviews/:reviewID with logged in user id
const reviewController=require('./reviewHandler');
router
    .route('/:tourId/reviews')
    .post(authController.protect,authController.restrictTo('user'),reviewController.createReview)
*/ //or below move to reviewRoutes& reviewController as /tour/:tourId/reviews/ ==/reviews/ or /tour/:tourId/reviews/:id ==/reviews/:id

const reviewRouter=require('./reviewRoutes');
router.use('/:tourId/reviews',reviewRouter); //need reviewRouter accessed to tourId params so need mergeParams in reviewRoutes.js
//just like app.use MW

module.exports=router;