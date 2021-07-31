const mongoose=require('mongoose');

const Tour=require('./tourModel');//for stats to calculating avgRatings

const reviewSchema=new mongoose.Schema({
    review:{
        type:String,
        required:[true,'Review cannot be empty']
    },
    rating:{
        type:Number,
        min:0,
        max:5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref: 'SampleTours', //'FullTour',  //'Tour', //collection
        required:[true,'Review must belong to a tour']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'SampleUsers', //'User', //collection
        required:[true,'Review must belong to an user']
    } //review - tour & user relationship
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

//review - tour & user relationship for all find/get queries in handler.js
reviewSchema.pre(/^find/,function(next){ 
    this.populate({path:'tour',select:'name'}).populate({path:'user',select:'name photo'}); 
    next();
}) 


reviewSchema.statics.calcAverageRatings= async function(tourID){
    const stats= await this.aggregate([ 
        {
            $match:{tour:tourID} 
        },
        {
            $group:{
                _id: "$tour", 
                nRating: {$sum:1}, 
                aveRating: {$avg:"$rating"}
            }
        }
    ]);

    if(stats.length>0){
        await  Tour.findByIdAndUpdate(tourID,{
            ratingQuantity:stats[0].nRating,
            ratingAverage:stats[0].aveRating
        })
    }else{
        await  Tour.findByIdAndUpdate(tourID,{
            ratingQuantity:0,
            ratingAverage:4.5 //default when no reviews
        })
    }

}

//reviewSchema.pre('save',function (next) {console.log("this@pre-save",this);next();})
reviewSchema.post('save',function (doc,next){
    //this points to current review
    //static function is availabel on the model
this.constructor.calcAverageRatings(this.tour);
next(); 
}) 


//findByIdAndUpdate //findBYid&delete
//these above are shorthands for findOneandUpdate/delete with current ID
reviewSchema.pre(/^findOneAnd/,async function(next){
    const revw=await this.findOne(); //'this' is query; await query is document so revw is document
    this.revw=revw;
})
reviewSchema.post(/^findOneAnd/,async function(doc){//at this stage no access to query as query already executed
  //  console.log("this@post-query",this)
        console.log("this.revw@post-query",this.revw);
    console.log("doc@post-query",doc,"doc.revw@post-query",doc.revw);

   // await this.revw.constructor.calcAverageRatings(doc.tour._id); //ok//not .id
   //  await this.revw.constructor.calcAverageRatings(this.revw.tour._id);//ok //not .id
    //await doc.constructor.calcAverageRatings(this.revw.tour._id);//ok
    await doc.constructor.calcAverageRatings(doc.tour._id);//ok
}) //this.revw passed from pre-query to post-query


const Review=mongoose.model('SampleReviews',reviewSchema);
//const Review=mongoose.model('Review',reviewSchema);
module.exports=Review;
