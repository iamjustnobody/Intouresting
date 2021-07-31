const express=require('express');
const router=express.Router();

const tourController=require('./tourHandler');
const {getTours,addATour,getATour,updateATour,deleteATour,paramsValidateMW,bodyValidateMW}=require('./tourHandler');
const authController=require('./authHandler');


router.get('/top-5-cheap',tourController.aliasTopTours,tourController.getTours3); 
router.route('/getStats').get(tourController.getStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin)

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)




router.route('/')
    .get(tourController.getTours3)
    .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.addATour3)
router.route('/:id')
    .get(tourController.getATour3)
    .patch(authController.protect,authController.restrictTo('admin','lead-guide'),
        tourController.uploadTourImages,tourController.resizeTourImages,
        tourController.updateATour3)
    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteATour3);



const reviewRouter=require('./reviewRoutes');
router.use('/:tourId/reviews',reviewRouter); 
module.exports=router;
