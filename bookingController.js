const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');
//const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)
const stripe=require('stripe')

const Booking=require('./bookingModel')

exports.getCheckoutSession=catchAsync(async (req,res,next)=>{
    //get current tour
    const tour=await Tour.findById(req.params.tourId); //bookingRoutes router path '/checkout-session/:tourId'
    console.log('secret type ',typeof process.env.STRIPE_SECRET_KEY);//string //STRIPE_SECRET_KEY=xx or 'xx' both ok string
    //create checkout session
    const stripeSKey=stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripeSKey.checkout.sessions.create({
        payment_method_types:["card"],
    //    success_url:`${req.protocol}://${req.get('host')}/`,
        success_url:`${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,//&user=${req.user.id} //for createBookingCheckout
        cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.id}`, //or /${tour.id} ok or ${req.params.tourId}
        // `${req.protocol}//:${req.get('host')}/tour/${tour.name}`, //should be ok as shown in viewRoutes.js & touroverview.pug //or ${tour.slug}
        customer_email:req.user.email,
        client_reference_id: req.params.tourId,
        //once purchase is successful we'll get access to the session obj again adn then we'll create a new booking in our db -> need user's id, tour's id, & price to create booking
        line_items:[//an array of objects about the product/tour; one obj per item/product/tour; one tour/product here the user's going to purchase
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

    //once deploed on server & the purchase's completed, we'll get access to the session object using stripe wehbook to create a new booking
    //wrokaround in the devleopment mode: put the data we need in the success url as a query string
    //& strip will just make GET request to success url


    //create session as response - send session back to client
    res.status(200).json({
        status:'success',
        session
    })
})

exports.createBookingCheckout=catchAsync(async(req,res,next)=>{ //temperory everyone can book without paying if knowing query string
    const {tour,user,price}=req.query;//not req.params
    if(!tour&&!user&&!price){return next();}//create booking on success url (home page); success url is called when purchase is successful with stripe
    //so add this MW to MW stack get('/') in bookigroutes //must return next here or use else below
    console.log('to create a new booking doc')
    await Booking.create({tour,user,price}); //checks type/required/validate/pre/post-save MW
    console.log('complete creating a new booking doc')
    //next(); //but next next on MW stack is getOverview in viewsController -> render page with success url with all query data
    //so need to re-move query from the success url
    res.redirect(req.originalUrl.split('?')[0]); //home page route url '/'  //viewRoutes
    // redirect creates a new request to the new url (success url without query) `${req.protocol}://${req.get('host')}/`
})
//suppose this above function could also be placed in viewsController.js then exported to viewRoutes.js

exports.getMyBookings_backend=catchAsync(async (req,res,next)=>{// or using virtual pop?
    //find all the bookingsfor the cur users -> gives tour iDs
    const bookings=await Booking.find({user:req.user.id}); //._id or id both ok
    //all bookings docs with cur users // all docs containing tour IDs? not populate tour?

    res.status(200).json({
        status:'success',
        data:{bookings}
    })
})
exports.getMyTours_backend=catchAsync(async (req,res,next)=>{// or using virtual pop?
    //find all the bookingsfor the cur users -> gives tour iDs
    const bookings=await Booking.find({user:req.user._id}); //._id or .id both ok
    //all bookings docs with cur users // all docs containing tour IDs? not populate tour?

    //find tours with those returned IDs
    const tourIDs=bookings.map(el=>el.tour);//create new array based on cb fn// el.tour.id? //el.tour._id? //tour itself is tourId; tour populated when query find?
    console.log(tourIDs);//el=>el.tour o/p: complete POPULATED tour [{xx},{yy},{ww}]
    //el=>el.tour._id o/p: [xxid,yyid,wwid]; //el=>el.tour.id o/p:['xxid','yyid','wwid']
    //all above three ok
    const tours=await Tour.find({_id:{$in:tourIDs}}); // select/find tours with Ids in tourIDs array

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