const mongoose=require("mongoose");
//const User=require('./userModel');//embedding
const slugify=require('slugify');

const tourSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'A tour must have a name'],
        unique: true,
        trim:true,
        maxlength:[40,'A tour must have less or equal than 40 char'],
        minlength:[10,'A tour must have less or equal than 40 char'],
  //      validator:[validator.isAlpha,'Tour name only contains char'] //need to install const validator=require('validator'); //also install slugify somewhere
    }, 
    duration:{
        type:Number,
        required:[true,'A tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A tour must have a group size']
    },
    difficulty:{
        type:String,
        required:[true,'A tour must have a difficulty level'],
        enum:{
            values:['easy','medium','difficult'],
            message:'Difficulty is either: easy, medium, difficult'
        }  //or enum:[['easy','medium','difficult'],'Difficulty is either: easy, medium, difficult']
    },
    ratingAverage:{
        type:Number,
        default:4.5,
        min: [1,'Rating must be above 1.0'],
        max:[5,"Rating must be below 5"] //min or max for number & dates
    },
    ratingQuantity:{
        type:Number,
        default:0
    },
    price:{
        type:Number,
        required:[true,'A tour must have a price']
    },
    priceDiscount:{
        type: Number,
        validate:{ //on create or save (not findnupdate even runvalidator set to true)
            validator: function(val){return this.price>val;}, //'this' is current doc when we create a new doc //must also use validator keyword
            message:"Discount price ({VALUE}) should be below regular price" 
        }
    },
    summary:{
        type:String,
        trim:true,
        required:[true,'A tour must have a description']
    },
    description:{
        type:String,
        trim:true
    },
    imageCover:{
        type:String,
        required:[true,'A tour must have an image cover']
    },
    images:[String],
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false 
    },
    startDates:[Date],

    secretTour:{type:Boolean}, 
    slug:String, 

    startLocation:{ 
        type:{ 
            type: String,
            default:'Point',
            enum:['Point']
        },
        coordinates:[Number], 
        address:String,
        description:String 
    },
    locations:[{
        type: { 
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], 
        address: String,
        description: String,
        day: Number
    }], 
    guides:[
        { 
            type:mongoose.Schema.ObjectId,
            ref:'SampleUsers'//'User'
        }
    ], 
},{ 
    toJSON:{ virtuals:true},
    toObject:{ virtuals:true},
});


tourSchema.index({startLocation:'2dsphere'}) 



tourSchema.virtual('durationweeks').get(function(){
    return this.duration/7; 
}) 



tourSchema.virtual('reviews',{
    ref:"SampleReviews",
    foreignField:"tour",
    localField:"_id"

}) 


tourSchema.pre('save',function(next){
   console.log(this.summary);
   next(); 
});
tourSchema.post('save',function(doc,next){
    console.log(this.description);
    next(); 
}); 


tourSchema.post('save',function (doc){
    console.log(this.slug);
});
tourSchema.pre('save',function (){
    this.slugify=slugify(this.name,{lower:true});
}); 



//query MW
tourSchema.post(/^find/,function(docs,next){ //for find & findOne etc allstrings start w find
 //   console.log(`QUery took ${Date.now()-this.start} milliseconds`) //this still points to query obj post query
    next();
});


tourSchema.pre(/^find/,function(next){ console.log('tour-populate-user1...');
    this.populate({path:'guides',select:'-__v -passwordChangedAt'}); //'this' points to current query
    next();
})

tourSchema.pre(/^find/,function(next){ //for find & findOne etc allstrings start w find
    this.start=Date.now();
    next();
});





//aggregate MW
tourSchema.pre('aggregate',function(next){
 /*   this.pipeline().unshift({ //end of array - unshift; beginning of array - shift
        $match:{secretTour:{$ne:true}}
    })*/
   // console.log(this.pipeline());//now array becomes [match, geo]
    next();//opt if no argument next
})





//const Tour=mongoose.model("Tour",tourSchema);//b4 s11
//const Tour=mongoose.model("FullTour",tourSchema);//after s10
const Tour=mongoose.model("SampleTours",tourSchema);//s12
module.exports=Tour;
