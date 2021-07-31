import axios from "axios";
import {showAlert} from "./alerts";

const stripe=Stripe('pk_test_51IYy3iIlvhZD3lNp8upep6FLeCQ2i9nW5JsOKgPBhiPkQM1LcjpLRY0aKROwzUQTU5QANAY2QjplS3zYdpLELaJR00G6aeja3b'); 
//data-tour-id=`${tour.id}` from tourdetail.pug; to be used in index.js
export async function bookTour(tourId){ 
    
    try{
        const session =await axios(`http://localhost:3001/api/v1/bookings/checkout-session/${tourId}`);
        //create checkout form & chanrge credit card
        await stripe.redirectToCheckout({sessionId: session.data.session.id});
    }catch (err){
        console.log(err);
        showAlert('error',err)
    }
}
