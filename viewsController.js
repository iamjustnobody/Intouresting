const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync')

const appErr=require('./Utils/AppError')

const User=require('./userModel')

const Booking=require('./bookingModel')

exports.getOverview=catchAsync(async (req,res)=>{
    const tours=await Tour.find();
    res.status(200).render('toursoverview',{ 
        title:'All Tours',
        tours 
    })
})

exports.getTour=catchAsync(async (req,res,next)=>{ 
    const tour=await Tour.findById({_id:req.params.id}).populate({
            path:'reviews',
            fields:'review rating user' 
        })

    if(!tour){return next(new appErr("There exists no such tour",404))} 

    res.status(200).render('tourdetails',{
        title: `${tour.name} Tour`,
        tour
    })
})



exports.getLoginForm=(req,res)=>{
    res.status(200).render('login',{
        title: 'Login into your account'
    })
}

exports.getAccount=(req,res)=>{ 
    res.status(200).render('account',{
        title: 'Your account'
    })
} // '/me' render account page

exports.updateUserData=catchAsync(async (req,res)=>{ 
    const updatedUser=await User.findByIdAndUpdate(req.user.id,{ 
        name:req.body.name,
        email:req.body.email
    }, {
        new:true,
        runValidators:true
    }); 
    res.status(200).render('account',{ 
        title: 'Your account',
        user:updatedUser
    })
}) 


exports.getMyTours=catchAsync(async (req,res,next)=>{
    const bookings=await Booking.find({user:req.user.id}); //._id

    //find tours with those returned IDs
    const tourIDs=bookings.map(el=>el.tour);
    const tours=await Tour.find({_id:{$in:tourIDs}}); 

    res.status(200).render('toursoverview',{
        title:'My Tours',
        tours
    })
})
