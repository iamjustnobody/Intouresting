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
    }, //trim lengths are validator for posting a new tour or update an existing tour (updating in tourhandler set runValidator as true so will check
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
    //    enum:['easy','medium','difficult'] //but no space for err message //enum only for strings NOT number
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
   // priceDiscount:Number, //now build our own validator
    priceDiscount:{
        type: Number,
      //  validate:function(val){return this.price>val;}//must use validate keyword //but now need to custum error message too
        validate:{ //on create or save (not findnupdate even runvalidator set to true)
            validator: function(val){console.log('be pre',this.price,val);return this.price>val;}, //'this' is current doc when we create a new doc //must also use validator keyword
            message:"Discount price ({VALUE}) should be below regular price" //({VALUE}) INTERNAL MONGOOSE nothign to do JS
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
        select:false // so limiting fields in getalltours fn in tourhandler.js
    },
    startDates:[Date],

    secretTour:{type:Boolean}, //query MW
    slug:String, //doc MW

    startLocation:{ //obj
        //geospatial needs type & coordinates subfields
        type:{ //subfield (type) has its own schema definition
            type: String,
            default:'Point',
            enum:['Point']
        },
        coordinates:[Number], //subfield (type) has its own schema definition//array of Number/coordinates
        address:String,
        description:String //none of subfields required as startLocation allowed to be blank
    },
    locations:[{ //just like startLocation & set day to 0
        type: { //subfield (type) has its own schema definition
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], //subfield (type) has its own schema type options//array of Number/coordinates
        address: String,
        description: String,
        day: Number
    }], //by specifying an array of object this will then create a brandnew document inside parent document (tour)
  //  guides: Array //for embedding
    guides:[
        { //each element's schema definition
            type:mongoose.Schema.ObjectId,
            ref:'SampleUsers'//'User'
        }
    ], //tour -user relationship
 /*   reviews:[{
        type: mongoose.Schema.ObjectId,
        ref:"Review"
    }] */ //this is how we do child referencing; but we will do virtual populate instead, see below //review - tour & user -> tour - review
},{ //object with schema definition + object for the schema option (to show virtuals as part of o/p obj)
    toJSON:{ virtuals:true},
    toObject:{ virtuals:true},
});


tourSchema.index({startLocation:'2dsphere'}) //use startLocation field to calc distances (geoNear)



tourSchema.virtual('durationweeks').get(function(){//name of virtual property //created each time that we get some data from db so get func here is a getter
    return this.duration/7; //'this' points to the curretn doc
}) //virtual properties not persisted to db so cannot be queried; but needs showing in o/p so need schema options
//cannot use virtual property in query as its not in db


//virtual populate // review - tour & user relationship; tour - review virtual relationship
tourSchema.virtual('reviews',{
    ref:"SampleReviews", ///"Review",//name of model we want to reference then name of fields to connect two models/datasets
    foreignField:"tour",
    localField:"_id"

}) //name of virtual field then object of some options



//const Tour=mongoose.model("Tour",tourSchema);
//virtual
//doc-MW .save() .create() NOT .insertMany()
tourSchema.pre('save',function(next){
   console.log(this.summary);
   next(); //must have - before next(): hook 1; be pre 597 397; summary;
});
//tourSchema.pre('save',function(next){console.log('for testing (purpose) only1');}); //must have next(); before next(): hook 1; be pre 597 397; summary; only 1;o/p keeps loading
tourSchema.post('save',function(doc,next){
    console.log(this.description);
    next(); //must have: before next(): hook 1; be pre 597 397; summary; doc...lala, doc...haha; description; (finally hook2 after next())
//if no next(), no hook2 no output but everything prior to hook2 executed & data in db (not outputted) outout keeps loading but none displayed
}); //hook1 xx xx hook2 //b4 section 11
/*
//doc MW added after Section 10
//tourSchema.pre('save',function(next){console.log('for testing (purpose) only2');});//must have next(); before next(): hook 1; be pre 597 397; summary; only 1; only2; o/p keeps loading
tourSchema.pre('save',async function(next){
    console.log('doc save MW for full tours lala');
    const guidesPromise = this.guides.map(async id=> await User.findById(id));
    //async func returns a promise and now guidesPromise is an array full of promises // all promisses need to run at the same time
    this.guides=await Promise.all(guidesPromise);//all run in parallel so await here so async func; then assigned to this.guides
    //overwrite temple array of ids with an array of user documents
    console.log('doc save MW for full tours haha');
    next(); //optional here (as async func)  better to have
})
//when create/add/post a new tour -> hook 1; be pre 597 397; summary; doc...lala, doc...haha; description
//tourSchema.pre('save',function(next){console.log('for testing (purpose) only3')});////must have next(); before next(): hook 1; be pre 597 397; summary; only 1; only 2; doc...haha doc...lala; only 3
//b4 next(): still save to db but no post-save (description) & o/p keeps loading
*/ //embedding above

tourSchema.post('save',function (doc){ //no this keyword but have doc argument
    console.log(this.slug);
});
tourSchema.pre('save',function (){
    this.slugify=slugify(this.name,{lower:true});
}); //need to add slugify to Tour Schema field/property
//tourSchema.post



//query MW
tourSchema.post(/^find/,function(docs,next){ //for find & findOne etc allstrings start w find
    console.log(`QUery took ${Date.now()-this.start} milliseconds`) //this still points to query obj post query
//    console.log(docs);
 //   console.log(docs.length);//returned docs after awaiting query
//    if(docs.length===1){console.log("em",docs[0].guides[0].name)} if(docs.length===undefined){console.log("ah",docs.reviews[0].tour.name,docs.reviews[0].tour.guides[0].name,docs.reviews[0].user.name)}
    next();
});

tourSchema.pre(/^find/,function(){ //for find & findOne etc allstrings start w find
    console.log("prehook");
 //   next();
});

tourSchema.post(/^find/,function(docs){
    console.log("post-hook");
 //   next();
});
tourSchema.pre(/^find/,function(next){
    console.log("prehook2");
    next();
});

tourSchema.post(/^find/,function(docs,next){
    console.log("post-hook2");
    next();
}); //hook1 hook2 prehook prehook2 posthook posthook2 hook3
//before section 11 above; after section 10 below
//tour - user/guides relationship for all find/get queries in handler.js
tourSchema.pre(/^find/,function(next){ console.log('tour-populate-user1...');
    this.populate({path:'guides',select:'-__v -passwordChangedAt'}); //'this' points to current query
 //   this.populate('guides'); //path to populate is the field 'guides' as defined in tour model schema; guides from user doc/ user model schema; select the fields defined in user schema
    console.log('tour-populate-user2...'); //'populate...'
    next();
})//hook1 hook2 prehook prehook2 populate... posthook posthook2 hook3

tourSchema.pre(/^find/,function(next){ //for find & findOne etc allstrings start w find
    console.log("to choose unsecret tours");
  //  this.find({secretTour:{$ne:true}}); console.log("unsecret tours chose");
    this.start=Date.now();
    next();
});





//aggregate MW
tourSchema.pre('aggregate',function(next){
    console.log(this.pipeline());//array //geo
 /*   this.pipeline().unshift({ //end of array - unshift; beginning of array - shift
        $match:{secretTour:{$ne:true}}
    })*/
    console.log(this.pipeline());//now array becomes [match, geo]
    next();//opt if no argument next
})





//const Tour=mongoose.model("Tour",tourSchema);//b4 section 11
//const Tour=mongoose.model("FullTour",tourSchema);//after section 10
const Tour=mongoose.model("SampleTours",tourSchema);//section12
module.exports=Tour;