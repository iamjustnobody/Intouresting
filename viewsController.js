const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync')

const appErr=require('./Utils/AppError')

const User=require('./userModel')

const Booking=require('./bookingModel')

exports.getOverview=catchAsync(async (req,res)=>{
    const tours=await Tour.find();
    res.status(200).render('toursoverview',{ //title & tours will be passed onto overview template/pug (from db)
        title:'All Tours',
        tours //this is an array containing multiple documents
    })
})

exports.getTour=catchAsync(async (req,res,next)=>{ // /tours/:slug //just like getATour API following /tours/:id path in tourHandler &tourRouter
    //const tour=await Tour.findOne({slug:req.params.slug}).populate({
    const tour=await Tour.findById({_id:req.params.id}).populate({
            path:'reviews',//virtual field name reviews
            fields:'review rating user' //fields of Review (model) we need
        })

    if(!tour){return next(new appErr("There exists no such tour",404))} //for rendering error page S192

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

exports.getAccount=(req,res)=>{ //just render the page; no need to query the user as this has been done by auth protect MW
    res.status(200).render('account',{
        title: 'Your account'
    })
} // '/me' render account page

exports.updateUserData=catchAsync(async (req,res)=>{ console.log('id- ',req.user.id,'req.body - ',req.body);
    console.log('UPDATING DATA...');
    const updatedUser=await User.findByIdAndUpdate(req.user.id,{ //name attributes in html in account.pug
        name:req.body.name,
        email:req.body.email
    }, {
        new:true,
        runValidators:true
    }); //find&update (default no checks) now check validators (both built-in 'require' and custum validator) for name&email(User model fields) - not for other fields; //not run pre-save MW etc
    res.status(200).render('account',{ //re-render account page using new updatedUser page (instead of using auth protect req.user data)
        title: 'Your account',
        user:updatedUser
    })
}) //'/submit-user-data' render account page with new user data #{user} in html/pug


exports.getMyTours=catchAsync(async (req,res,next)=>{// or using virtual pop?
    //find all the bookingsfor the cur users -> gives tour iDs
    const bookings=await Booking.find({user:req.user.id}); //._id
    //all bookings docs with cur users // all docs containing tour IDs? not populate tour?

    //find tours with those returned IDs
    const tourIDs=bookings.map(el=>el.tour);//create new array based on cb fn// el.tour.id? //el.tour._id? //tour itself is tourId; tour populated when query find?
    const tours=await Tour.find({_id:{$in:tourIDs}}); // select/find tours with Ids in tourIDs array

    res.status(200).render('toursoverview',{
        title:'My Tours',
        tours
    })
})