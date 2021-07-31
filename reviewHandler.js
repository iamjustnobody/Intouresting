const Review=require('./reviewModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');
const factory=require('./handlerFactory');

exports.getAllReviews=catchAsync(async(req,res,next)=>{
 //   const reviews=await Review.find();
//post or get /tour/:tourId/reviews/ with logged in user id
//get /tour/:tourId/reviews/:reviewID with logged in user id
    let filterObj={};
    if(req.params.tourId){filterObj={tour:req.params.tourId}}; //Review model schema tour field type:mongoose.Schema.ObjectId,
    const reviews=await  Review.find(filterObj);
    res.status(200).json({
        status:'success',
        results:reviews.length,
        data:{
            reviews
        }
    })
})

exports.getAllReviews2=factory.getMany(Review);


exports.createReview=catchAsync(async(req,res,next)=>{
    //post or get /tour/:tourId/reviews/ with logged in user id
//get /tour/:tourId/reviews/:reviewID with logged in user id
    //with newly added path/route in tourRouter
    if(!req.body.tour){req.body.tour=req.params.tourId;}
    if(!req.body.user){req.body.user=req.user.id;} //req.user from authcontroller protect MW
//req.body.tour or req.body.user are ObjectIDs defined in  tour schema & user schema so .tour & .user are fields in postman raw inputs
//below Review.create(req.body) - so req.body's fields used as input fields to db
    //req.user.id string

    console.log("before createReview...");
    const newReview=await Review.create(req.body); //ignore the fields in the req.body that are not in the Review Schema
    console.log("after createReview...");

    res.status(200).json({
        status:'success',
        data:{
            reviews:newReview
        }
    })
})

exports.setTourUserIds=(req,res,next)=>{
    //with newly added path/route in tourRouter //overwrite the req.body (user-input) if user wanna comment on another tour B under Tour A using other users' name
 //   if(!req.body.tour){console.log("tourId=",req.params.tourId);req.body.tour=req.params.tourId;}
 //   if(!req.body.user){console.log("userId=",req.user.id);req.body.user=req.user.id;} //req.user from authcontroller protect MW

    //still using req.body.tour=req.body.tour
    if(req.params.tourId){console.log("tourId=",req.params.tourId);req.body.tour=Object(req.params.tourId);}
    //or req.body.tour=req.params.tourId string ok too //req.body.tour=Object(req.params.tourId) Object ok
    req.body.user=req.user._id; //Obj //or req.user.id String ok too//req.user from authcontroller protect MW
    console.log("tourId=",req.params.tourId,typeof req.params.tourId,req.body.tour, typeof req.body.tour);
        console.log("userId=",req.user.id, typeof req.user.id,req.user._id,typeof req.user._id,req.body.user, typeof req.body.user);
    console.log("before createReview2...");
    next();
}
//req.body.tour or req.body.user are ObjectIDs defined in  tour schema & user schema so .tour & .user are fields in postman raw inputs
//in handlerfactory addOne fn just use req.body's fields as input fields to db
//req.user.id string
exports.createReview2=factory.addOne(Review);
//createReview=setTourUserIds+createReview2


exports.deleteReview=factory.deleteOne(Review);
exports.updateReview=factory.updateOne(Review);
exports.getReview=factory.getOne(Review);