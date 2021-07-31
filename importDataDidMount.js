const dotenv=require('dotenv'); //before app
dotenv.config({path:'./config.env'});

const fs=require('fs');
const mongoose=require('mongoose');
const Tour=require('./tourModel');
const User=require('./userModel');
const Review=require('./reviewModel');

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(DB,{  //after config
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(con=>{
        //  console.log(con.connections);
        //console.log("DB connection succeed");
    }
).catch(err=>{
    //console.log("db connection failed",err.message);
});

//const tours=fs.readFileSync(`${__dirname}/data/tour-simple.json`,'utf-8'); // b4 S11
const tours=fs.readFileSync(`${__dirname}/data/tours.json`,'utf-8'); //aftter S10
const users=fs.readFileSync(`${__dirname}/data/users.json`,'utf-8'); //S11
const reviews=fs.readFileSync(`${__dirname}/data/reviews.json`,'utf-8');//S11


//import data from fs (tours) into db (Tour)
const importData=async(req,res)=>{
    try{
        await Tour.create(JSON.parse(tours));
        await User.create(JSON.parse(users),{validateBeforeSave:false});
        await Review.create(JSON.parse(reviews));
        //console.log("inital data loaded successfully");
        process.exit();
    }catch(e){
        res.status(400).json({
            status:"fail",
            message:e.message
        })
    }
}


const deleteData=async(req,res)=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        //console.log("all data deleted successfully");
        process.exit();
    }catch(e){
        res.status(400).json({
            status:"fail",
            message:e.message
        })
    }
}

//console.log(process.argv);

if(process.argv[2]==='--import'){
importData();
}else if(process.argv[2]==='--delete'){
deleteData();
}
