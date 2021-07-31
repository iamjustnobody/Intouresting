const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');
//const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)
const stripe=require('stripe')

const Booking=require('./bookingModel')

exports.getCheckoutSession=catchAsync(async (req,res,next)=>{ //createCheckoutSession & return session
    //get current tour
    const tour=await Tour.findById(req.params.tourId); 
    //create checkout session
    const stripeSKey=stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripeSKey.checkout.sessions.create({
        payment_method_types:["card"],
        success_url:`${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,//&user=${req.user.id} //for createBookingCheckout
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.id}`, 
        customer_email:req.user.email,
        client_reference_id: req.params.tourId,
        line_items:[
            {
                name:`${tour.name} Tour`,
                description: tour.summary,
                images:[`https://www.natours.dev/img/tours/${tour.imageCover}.jpg`], //could have multiple images
                amount:tour.price*100,
                currency:'usd',
                quantity:1 //one tour
            }
        ]
    })

    //create session as response - send session back to client
    res.status(200).json({
        status:'success',
        session
    })
})

exports.createBookingCheckout=catchAsync(async(req,res,next)=>{ 
    const {tour,user,price}=req.query;
    if(!tour&&!user&&!price){return next();}
    await Booking.create({tour,user,price}); 
    res.redirect(req.originalUrl.split('?')[0]); 
})

exports.getMyBookings_backend=catchAsync(async (req,res,next)=>{
    //find all the bookingsfor the cur users -> gives tour iDs
    const bookings=await Booking.find({user:req.user.id}); 

    res.status(200).json({
        status:'success',
        data:{bookings}
    })
})
exports.getMyTours_backend=catchAsync(async (req,res,next)=>{
    const bookings=await Booking.find({user:req.user._id}); 

    //find tours with those returned IDs
    const tourIDs=bookings.map(el=>el.tour);
    const tours=await Tour.find({_id:{$in:tourIDs}}); 

    res.status(200).json({
        status:'success',
        data:{tours}
    })
})



const factory=require('./handlerFactory')
exports.createBooking=factory.addOne(Booking);
exports.getBookings=factory.getMany(Booking);
exports.getBooking=factory.getOne(Booking);
exports.updateBooking=factory.updateOne(Booking);
exports.deleteBooking=factory.deleteOne(Booking);
