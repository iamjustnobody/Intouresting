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
reviewSchema.pre(/^find/,function(next){ console.log('review - user & tour 1 ...'); //'populate2...'
  //  this.populate({path:'user',select:'name'}); //'this' points to current query
    //we need reviews on the tour but dont need the tour available on the review - to reduce the chain of populate
    this.populate({path:'tour',select:'name'}).populate({path:'user',select:'name photo'}); //path - review schema fields; select - path's original model schema fields
    console.log('review - user & tour 2 ...');//'populate2b...'
    next();
}) //this creates two more queries behind the scene: populate2..., populate2b...,prehook, prehook2, populate..., post-hook,post-hook2
//if changing only pre to only post (need both docs & next as arguments & keep this order), then o/p: 1) only populate2...,populate2b...,; 2) not being populated


reviewSchema.statics.calcAverageRatings= async function(tourID){
    console.log("starting stats");
    const stats= await this.aggregate([ //just like Review.aggregate in handler/controller function
        {
            $match:{tour:tourID} //pass filterObj to $match ////Review model schema tour field type:mongoose.Schema.ObjectId
        },
        {
            $group:{
                _id: "$tour", //the common field that all of the docs have in common that we wanna group by
                nRating: {$sum:1}, //relevant docs added together
                aveRating: {$avg:"$rating"}
            }
        }
    ]);
    console.log("completing stats...");
    console.log("stats:",stats);

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

reviewSchema.pre('save',function (next) {console.log("this@pre-save",this);next();})
reviewSchema.post('save',function (doc,next){
    //this points to current review
    //static function is availabel on the model
  //  Review.calcAverageRatings(this.tour) //but Review not created yet & cannot move pre-save after mongoose.model as otherwise pre-save MW wont be MW
    console.log("b4Calculating avgRating");
    console.log("this@post-save",this,"doc@post-save",doc);
this.constructor.calcAverageRatings(this.tour);
console.log("this.tour@post-save",this.tour,"doc.tour@post-save",doc.tour);
    console.log("aftCalculating avgRating");
next(); //opt because of async?
}) //at pre-save current review is not really in the collection yet so cannot do $match etc when at $match stage;use post-save when all docs are alread saved in teh database
////sequence createReview - see Notebook


//findByIdAndUpdate //findBYid&delete
//these above are shorthands for findOneandUpdate/delete with current ID
reviewSchema.pre(/^findOneAnd/,async function(next){
    const revw=await this.findOne(); //'this' is query; await query is document so revw is document
    console.log("revw@pre-query",revw);//async one step lag
    this.revw=revw;
//    console.log("this@pre-query",this);
    console.log("this.revw@pre-query",this.revw);
})
reviewSchema.post(/^findOneAnd/,async function(doc){//at this stage no access to query as query already executed
  //  console.log("this@post-query",this)
        console.log("this.revw@post-query",this.revw);
    console.log("doc@post-query",doc,"doc.revw@post-query",doc.revw);
   // await this.revw.constructor.calcAverageRatings(this.revw.tour);
    //await this.revw.constructor.calcAverageRatings(doc.tour);
   // await this.revw.constructor.calcAverageRatings(doc.tour._id); //ok//not .id
   //  await this.revw.constructor.calcAverageRatings(this.revw.tour._id);//ok //not .id
    //await doc.constructor.calcAverageRatings(this.revw.tour._id);//ok
    await doc.constructor.calcAverageRatings(doc.tour._id);//ok
}) //this.revw passed from pre-query to post-query


const Review=mongoose.model('SampleReviews',reviewSchema);
//const Review=mongoose.model('Review',reviewSchema);
module.exports=Review;

//post or get /tour/:tourId/reviews/ with logged in user id
//get /tour/:tourId/reviews/:reviewID with logged in user id
//seee updated tourRouter