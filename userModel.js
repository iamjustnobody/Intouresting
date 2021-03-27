const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please tell us your name!'],
     //   minlength:[40,'A userName must have less or equal than 40 char'],
    //    validate:{validator:function (){console.log("testing...")}, message:'Testing?!'} //ok
        validate:[function (){console.log("testing...")},'Testing?!'], //ok
    //    minlength:[30,'A userName must have less or equal than 30 char'],
    },
    email:{
        type:String,
        required:[true,'Please provide your email address'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    //photo:String,//ok now updated to below
    photo:{type:String, default:'default.jpg'},
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:8,
        select:false //select=find=get (login) show no password unless delibrarly selected but when create hased-password will still be exposed (signup)
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{ //this only works on SAVE/CREATE (not findNupdate even runvalidator set to true)
            validator:async function (el){
                console.log("b4 save",this.password,el);
                //return await bcrypt.compare(el,this.password);//not awaited b4 message below shows; how to fix?
                return el===this.password;
                }, //this so function not arrow
            message:'Passwords are not matched!'
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
     //   validate:{validator:function (){console.log("testing2...")}, message:'Testing2?!'}
    },
    passwordResetToken:String,
    passwordResetExpires:Date,

    active:{  //userDeleteMe
        type:Boolean,
        default: false,
        select: false
    }
});
/*
userSchema.post('save', function() {
    console.log('this gets started after saving to db');
})

userSchema.pre('save', function() {
    console.log('this gets started before saving to db');
})
userSchema.post('validate', function() {
    console.log('this gets printed second -validted but not saved yet');
});
userSchema.pre('validate', function() {
    console.log('this gets printed first');
});*/
/*
userSchema.pre('save', function(error, doc, next) {
    console.log("testing pre error handling MW 1a");
     // next(); console.log("testing pre error handling MW 2");
    //  next(error); console.log("testing pre error handling MW 3");
    //next(); console.log("testing pre error handling MW 2");
   // next(new Error('There was an error')); console.log("testing pre error handling MW 4");
  //  next(error); console.log("testing pre error handling MW 5");
    next();
    console.log("testing pre error handling MW 1b");
   // next(error); console.log("testing pre error handling MW 5");
})*/
userSchema.pre('save',async function (next){ //between getting it & saving it to the db
    console.log("aft validate 1");
    if(!this.isModified('password')){console.log('continue1');return next();}
    this.password=await bcrypt.hash(this.password,12); //async return promise; removing await becomes sync; hash has both async & sync
    this.passwordConfirm=undefined; //required as input but not required to be persisted in db
    console.log('modified1a');
/*  //   next(); //ok here //if return next here then jump to next pre-save-hook MW
    console.log('modified1b');
  // next(new Error(`something's wrong - ${this.password}`));
    console.log('modified1b2');
  ////  next();console.log("modified1b3");
  //  throw new Error(`something went wrong - ${this.password}`);//no o/p modified1c as b4 modified1c (like return next b4 modified1c); following MW o/ps when next b4 throw (but if no next before throw (no next or next after throw) then no following MW)
//error will jump to post-save error handling MW not pre-saving error handling MW
    console.log('modified1c');
   //// next(new Error(`something's wrong - ${this.password}`));// console.log
    next(); //ok here too //opt after throw (w or w/o return)
    console.log('modified1d');*/
});
/*
userSchema.pre('save', function(error, doc, next) { //error in above pre-save MW wont come here -> will come to post-save error handling MW (3 arguments)
    console.log("testing pre error handling MW 1a");
  ///  next();
  //  next(error);
     next(new Error('There was an error')); //next(error);
    //next();
    console.log("testing pre error handling MW 1b");
}) */
userSchema.pre('save',async function (next){ //between getting it & saving it to the db
    console.log("aft validate 2");
    if(!this.isModified('password')||this.isNew){console.log('continue2');return next();}
    this.passwordChangedAt=Date.now()-1000;
    console.log('modified2');
    next();
});
//for create & save func in handler.js
/*
userSchema.post('save',async function (doc,next){ //between getting it & saving it to the db
    console.log("posthook for save");
    next();
}); //sequence when updateMyPassword - see Notebook
//below for testing
userSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});
userSchema.post('save', function() {
    console.log('saving to db already completed');
});
userSchema.post('save',function (doc,next){
    console.log('post-save test error 1');
    next();
    console.log('post-save test error 2');
   //   next(new Error(`something's wrong - ${this.password}`));
    console.log('post-save test error 3');
   //// next();console.log("post-save test error 3a");
    //  throw new Error(`something went wrong - ${this.password}`);
    console.log('post-save test error 4');
    //// next(new Error(`something's wrong - ${this.password}`)); console.log('post-save test error 4b');
    next();
    console.log('post-save test error 5');
}); */
/*
userSchema.post('save', function(error, doc, next) {
  *  if (error.name === 'MongoError' && error.code === 11000) {
  *      console.log("mongo self detect dup err 1a");
  *      next(new Error('There was a duplicate key error'));
   *     console.log("mongo self detect dup err 1b");
  *  } else {
        console.log("mongo self detect dup err 0a");
        next();
        console.log("mongo self detect dup err 0b");
 *   }
});//run before any other post save MW after all pre done (because user enters dup key and initiate so jump to this error func first otherwise post-save MW in order)
//if no error then above post not executed; if error first executed; unlike pre-save with 3 arguments incl error where execute in order with other pre-save MW
*/
/*
userSchema.post('save', function(doc, next) {
    setTimeout(function() {
      next() ; //here ok
        // return  next(); //using return will not o/p post1 but will continue to o/p post2
        console.log('post1');
        // Kick off the second post hook
       // next(); //or here ok too
    }, 10);
});
// Will not execute until the first middleware calls `next()`
userSchema.post('save', function(doc, next) {
    console.log('post2');
    next();
}); //return next() if sth after next() //errhandling MW &async
*/


//an instance method -> availabel on all docs of a certain collection
userSchema.methods.correctPassword= async function (candidatePWD, userPWD){ //function name called correctPassword
    //return this.password===candidatePWD
    console.log("user.password",userPWD);
    return await bcrypt.compare(candidatePWD,userPWD);
}
userSchema.methods.correctPassword2= async function (candidatePWD){
    console.log("this.password",this.password);
    return await bcrypt.compare(candidatePWD,this.password);
}
userSchema.methods.changedPwdAft= async function (JWTtimestamp){ //function name called changedPwdAft
    console.log('1st timestamp',this.passwordChangedAt,JWTtimestamp);
    let timestamp;
    if(this.passwordChangedAt){
        timestamp=parseInt(this.passwordChangedAt.getTime()/1000,10);//this refers to current doc
        console.log('2nd timestamp',this.passwordChangedAt.getTime(),timestamp);
    }
    if(this.passwordChangedAt){return timestamp>JWTtimestamp;}
    return false; //no change
}

userSchema.methods.createPwdResetToken=function(){
    const resetToken=crypto.randomBytes(32).toString('hex');//just like pwd but need encrypted in db
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires=Date.now()+30*60*1000;
    //as above twwo assignment (modify) so need to save()
    console.log("userMOdel",{resetToken},this.passwordResetToken);
    return resetToken; //plain original un-encrypted version but save encrypted version in db
}


const User=mongoose.model('SampleUsers',userSchema);
//const User=mongoose.model('User',userSchema);
module.exports=User;