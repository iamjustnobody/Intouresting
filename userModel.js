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
        //validate:[function (){console.log("testing...")},'Testing?!'], //ok
        //    minlength:[30,'A userName must have less or equal than 30 char'],
    },
    email:{
        type:String,
        required:[true,'Please provide your email address'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    photo:{type:String, default:'default.jpg'},
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{ //this only works on SAVE/CREATE (not findNupdate even runvalidator set to true)
            validator:async function (el){
                //console.log("b4 save",this.password,el);
                return el===this.password;
            }, 
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


userSchema.pre('save',async function (next){ //between getting it & saving it to the db
    if(!this.isModified('password')){return next();}
    this.password=await bcrypt.hash(this.password,12); 
    this.passwordConfirm=undefined; 
});

userSchema.pre('save',async function (next){ 
    if(!this.isModified('password')||this.isNew){console.log('continue2');return next();}
    this.passwordChangedAt=Date.now()-1000;
    next();
});



//an instance method -> availabel on all docs of a certain collection
userSchema.methods.correctPassword= async function (candidatePWD, userPWD){ 
    //return this.password===candidatePWD
    return await bcrypt.compare(candidatePWD,userPWD);
}
userSchema.methods.correctPassword2= async function (candidatePWD){
    return await bcrypt.compare(candidatePWD,this.password);
}
userSchema.methods.changedPwdAft= async function (JWTtimestamp){ 
    //console.log('1st timestamp',this.passwordChangedAt,JWTtimestamp);
    let timestamp;
    if(this.passwordChangedAt){
        timestamp=parseInt(this.passwordChangedAt.getTime()/1000,10);//this refers to current doc
        //console.log('2nd timestamp',this.passwordChangedAt.getTime(),timestamp);
    }
    if(this.passwordChangedAt){return timestamp>JWTtimestamp;}
    return false; //no change
}

userSchema.methods.createPwdResetToken=function(){
    const resetToken=crypto.randomBytes(32).toString('hex');
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires=Date.now()+30*60*1000;
   
    //console.log("userMOdel",{resetToken},this.passwordResetToken);
    return resetToken; 
}


const User=mongoose.model('SampleUsers',userSchema);
//const User=mongoose.model('User',userSchema);
module.exports=User;
