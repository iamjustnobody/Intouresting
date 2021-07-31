const Review=require('./reviewModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');
const factory=require('./handlerFactory');

exports.getAllReviews=catchAsync(async(req,res,next)=>{
    let filterObj={};
    if(req.params.tourId){filterObj={tour:req.params.tourId}}; 
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
    if(!req.body.tour){req.body.tour=req.params.tourId;}
    if(!req.body.user){req.body.user=req.user.id;} 
    const newReview=await Review.create(req.body); 

    res.status(200).json({
        status:'success',
        data:{
            reviews:newReview
        }
    })
})

exports.setTourUserIds=(req,res,next)=>{
    if(req.params.tourId){req.body.tour=Object(req.params.tourId);}
    req.body.user=req.user._id;
    next();
}
exports.createReview2=factory.addOne(Review);
//createReview=setTourUserIds+createReview2


exports.deleteReview=factory.deleteOne(Review);
exports.updateReview=factory.updateOne(Review);
exports.getReview=factory.getOne(Review);
