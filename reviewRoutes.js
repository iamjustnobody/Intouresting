const reviewController=require('./reviewHandler');
const express=require('express');
//const router=express.Router(); //need mergeparams here
const authController=require('./authHandler');

const router=express.Router({mergeParams:true}); //previous router
//post or get /tour/:tourId/reviews/ with logged in user id
//get /tour/:tourId/reviews/:reviewID with logged in user id
// '/tour/:tourId/reviews' from tourRoutes

router.use(authController.protect);

router.route('/')
//    .get(reviewController.getAllReviews)
    .get(reviewController.getAllReviews2)
//    .post(authController.protect,authController.restrictTo('user'),reviewController.createReview) //needs updating after factory
    .post(authController.protect,authController.restrictTo('user'),reviewController.setTourUserIds,reviewController.createReview2)

router.route('/:id') //revwId
    .delete(authController.restrictTo('user','admin'),reviewController.deleteReview)
    .patch(authController.restrictTo('user','admin'),reviewController.updateReview)
    .get(reviewController.getReview)


module.exports=router;