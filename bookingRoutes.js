const express=require('express');
const authController=require('./authHandler');
const bookingHandler=require('./bookingController')

const router=express.Router();

router.get('/checkout-session/:tourId',authController.protect,bookingHandler.getCheckoutSession)

router.get('/myBookings',authController.protect,bookingHandler.getMyBookings_backend)
router.get('/myTours',authController.protect,bookingHandler.getMyTours_backend)


router.use(authController.protect,authController.restrictTo('admin','lead-guide'))
router.route('/')
    .get(bookingHandler.getBookings)
    .post(bookingHandler.createBooking);
router.route('/:id')
    .get(bookingHandler.getBooking)
    .patch(bookingHandler.updateBooking)
    .delete(bookingHandler.deleteBooking);

module.exports=router