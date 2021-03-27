import axios from "axios";
import {showAlert} from "./alerts";

const stripe=Stripe('pk_test_51IYy3iIlvhZD3lNp8upep6FLeCQ2i9nW5JsOKgPBhiPkQM1LcjpLRY0aKROwzUQTU5QANAY2QjplS3zYdpLELaJR00G6aeja3b'); //OK//process.env undefined always frontend
//const stripe=Stripe(`${process.env.STRIPE_PUBLIC_KEY}`);//ok (no matter in config.env its xx=xx or xx='xx')//but still undefined
//const stripe=Stripe(process.env.STRIPE_PUBLIC_KEY);//WRONG AS need to be a string (no matter in config.env its xx=xx or xx='xx')//undefined
//data-tour-id=`${tour.id}` from tourdetail.pug; to be used in index.js
export async function bookTour(tourId){ //index.js connecting greent button with this funciton in stripe.js
    console.log("public type ",typeof process.env.STRIPE_PUBLIC_KEY); //undefined always
    try{
        //get the checkout session/res from the server/endpoint/api to the client side -> bookRoutes '/checkout-session'
        const session =await axios(`http://localhost:3001/api/v1/bookings/checkout-session/${tourId}`);

        console.log(session);//res
        //create checkout form & chanrge credit card
        await stripe.redirectToCheckout({sessionId: session.data.session.id});
    }catch (err){
        console.log(err);
        showAlert('error',err)
    }
}