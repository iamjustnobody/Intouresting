const dotenv=require('dotenv'); //before app
dotenv.config({path:'./config.env'}); //be4 app.use and mongoose.connect

const mongoose=require('mongoose');

//sync error for uncaught exception
process.on('uncaughtException',err=>{
    //console.log('UNCAUGHT EXCEPTION. SHUTTING DOWN...');
    //console.log(err.name,err.message);
    process.exit(1);
})

const express=require('express');
const app=express();


//dotenv.config({path:'./config.env'});
//console.log("haha",process.env.NODE_ENV); //after config

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
//console.log(DB,typeof DB, typeof process.env.DATABASE_PASSWORD); //strings no matter if they have no/single/double quotes in config.env
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
 //   console.log("db connection failed",err.message);
});



const path=require('path');
app.set("view engine","pug"); //pug templates are called views
app.set("views",path.join(__dirname,"vision")); //path.join(__dirname,"views")
//app.set("views",`${__dirname}`); //app.set("views","."); //`${__dirname}`
// if create view folder n .pug files inside 'view' folder, then here should be "./view" or `${__dirname}/view` or path.join(__dirname,"view")
//all pug/views templates stored location

app.use(express.static(path.join(__dirname,"public"))); //path.join(__dirname,"Assets")
//all static files located
console.log(__dirname,`${__dirname}`,path.join(__dirname,"public"),path.join(__dirname,"views"));




//MW
/*app.use(express.raw({type:"application/json"}));
app.use(express.json({strict:false}));
app.use(express.urlencoded({extended:false}));*/


app.use(express.json({type:['json','text']}));
//app.use(express.json({type:'*/*'}));//app.use(express.json({type:'text/plain'}));
//app.use(express.json()); //this is default 'application/json'



const cookieParser=require('cookie-parser');
app.use(cookieParser());


//app.use(express.static(`${__dirname}/public`)); //directory where static files are stored //ok but might have slash issue so require build-in path module and lifted up with views-pug

//testing MW
app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    //console.log('req.headers: ',req.headers);
    //console.log('req.cookies: ',req.cookies);
    next();
})



const viewRouter=require('./viewRoutes');
app.use('/',viewRouter) //beginning //ok

//Routes
const tourRouter=require('./tourRouter');
app.use('/api/v1/tours',tourRouter); //app.use('/',tourRouter);
const userRouter=require('./userRouter');
app.use('/api/v1/users',userRouter); //app.use('/',userRouter);

const reviewRouter=require('./reviewRoutes');
app.use('/api/v1/reviews',reviewRouter);

const bookingRouter=require('./bookingRoutes')
app.use('/api/v1/bookings',bookingRouter);

//app.use('/',viewRouter) // end //ok



appError=require('./Utils/AppError');

app.all('*',(req,res,next)=>{  
    next(new appError(`cannot find ${req.originalUrl} on this server routes`,404));

});

errController=require('./errorHandler');
app.use(errController);


const PORT=3001||process.env.PORT;
const server=app.listen(PORT,()=>{console.log(`app running on port: ${PORT}`);});

process.on('unhandledRejection',err=>{ //similar to event listen //unhandledRejection event
 //   console.log(err.name,err.message);
   // console.log('UNHANDLED REJECTION. SHUTTING DOWN...');
   // console.log(err);
    //process.exit(1); ///brute force shut down - need to be graceful
    server.close(()=>{
        process.exit(1); //executed after server.close()
    })
})

