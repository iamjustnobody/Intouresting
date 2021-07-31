const mongoose=require('mongoose');

const Tour=require('./tourModel');//for stats to calculating avgRatings

const bookingSchema=new mongoose.Schema({
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'SampleTours',
        required:[true,'Booking must belong to a Tour!']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'SampleUsers',
        required:[true,'Booking must belong to an User!']
    },
    price:{
        type:Number,
        required:[true,'Booking must belong to a price!']
    },
    createAt:{
        type:Date,
        default:Date.now()
    },
    paid:{
        type:Boolean,
        default:true
    }
});

bookingSchema.pre(/^find/,function(next){ 
    this.populate('user').populate('tour');
    next();
})
bookingSchema.post('save',function(doc,next){
    //console.log('booking post save - booking doc: ',doc)
    next();
})
bookingSchema.pre('save',function(next){
    //console.log('booking pre save')
    next();
})
const Booking=mongoose.model('Booking',bookingSchema);
module.exports=Booking
