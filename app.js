const dotenv=require('dotenv'); //before app
dotenv.config({path:'./config.env'}); //be4 app.use and mongoose.connect

const mongoose=require('mongoose');

//sync error for uncaught exception
process.on('uncaughtException',err=>{
    console.log('UNCAUGHT EXCEPTION. SHUTTING DOWN...');
    console.log(err.name,err.message);
    process.exit(1);
})

const express=require('express');
const app=express();


//dotenv.config({path:'./config.env'});
console.log("haha",process.env.NODE_ENV); //after config

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
console.log(DB,typeof DB, typeof process.env.DATABASE_PASSWORD); //strings no matter if they have no/single/double quotes in config.env
mongoose.connect(DB,{  //after config
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology: true
}).then(con=>{
  //  console.log(con.connections);
    console.log("DB connection succeed");
    }
).catch(err=>{
 //   console.log("db connection failed",err.message);
});

//const tourSchema=new mongoose.Schema({});
//const Tour=mongoose.model("Tour",tourSchema);






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
//app.use(express.json({type:'*/*'}));//important!! //not default to 'application/json'
//app.use(express.json()); //this is default 'application/json'
//app.use(express.json({type:'text/plain'})); //ok same effect as {type:'*/*'}

//app.use(express.urlencoded({extended:true}));//WITHOUT API CALL /submit-user-data
//app.post('/submit-user-data',express.json(),express.urlencoded({extended:true}),(req,res,next)=>{console.log('why',req.body)}); //just for testing not working
/*
const bodyParser=require('body-parser');
//app.use(bodyParser.urlencoded({extended:false}));
//app.use(bodyParser.json());e
app.use(bodyParser.json()); // <--- Here
//app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({extended:false}));
//const cors = require('cors'); app.use(cors())
*/

const cookieParser=require('cookie-parser');
app.use(cookieParser());


//app.use(express.static(`${__dirname}/public`)); //directory where static files are stored //ok but might have slash issue so require build-in path module and lifted up with views-pug

//testing MW
app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    console.log('req.headers: ',req.headers);
    console.log('req.cookies: ',req.cookies);
    next();
})




/*//Routes
app.get('/',(req,res)=>{
    res.status(200).render("base",{ //browser render base template - looking for base(.pug) template in __dirname (defined views/pug location above)
       //can also send (local) data to base template
        tour: "forest hiker",
        user:"jonas"
    });
}) //looking for the base.pug in app.set("views",`${__dirname}`); or app.set("views",".");

app.get('/overview',(req,res)=>{
    res.status(200).render('toursoverview',{title:'All Tours'})
})
app.get('/tour',(req,res)=>{
    res.status(200).render('tourdetails',{title:'the forest hiker tour'})
})*/ //now move to viewRoutes.js
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

app.all('*',(req,res,next)=>{  //app.use??
   // throw new Error(); //jump to app.use(err,r,r,n) unlike promise that will still executing the next then
    //alternative to throw new Error() -> see below one
//    const err=new Error(`cannot find ${req.originalUrl} on this server routes`);
 //   err.status='fail';
//    err.statusCode=404;
//    next(err);
    //alternatively see below one
    next(new appError(`cannot find ${req.originalUrl} on this server routes`,404));

 //  res.status(404).json({ //this format (and format in tourhandler.js (before catch async) is like errhandler
  //      status:'fail',
  //      message:'cannot find this route'
  //  }); //if remains after throw errors, res.xx not be reached
    //throw new Error(); not be reached aftter res.xx

});
//need app.all other routes to pass err to app.use(err4)

//app.use((req,res,next)=>{console.log("not bypassed");next();});//test cmparison with promise //or use app.use('*',(req,res,next)=>{next();};
//app.all('*',(req,res,next)=>{console.log("not bypass");next();});
// all/get/post must have path and not exceeding 3 arguments

//app.use((req,res)=>{res.status(404).json({status:'fail',message:'testing error'});}); //any path any method if this step can be reached//or app.use('*',(req,res)=>{}); any other paths
//app.use can have pathroute or no pathroutes (both for 2 (see above one example) or 3 arguments (see testnode2); app.use can have 2-4 arguments
//testing the above app.use by comment out app.all throwing errors
//all the above after app.all throwing error will be bypassed if app.all throws an error

/*
app.use((err,req,res,next)=>{  //not app.all() (app.all/get/post must have path and 2 or 3 arguments)
    // not app.use('*',(err,req,res,next)=>{}); //nor app.all('*',(err,req,res,next)=>{}) //html err in postman (not showing res.error.status/message
    // if appuse first then app.all// so app.use can use next() but error in (err,r,r,n) in app.use could not pass to app.all res.xx
    //so having new Error first and pass onto .use(err,r,r,n) // so app.all above sounds like MW(normally app.use)  b4 Last.use(err,r,r,n) (normally last is app.all/get/post)
    //or dealing with err is to use 4 arguments (err,r,r,n) use next(err) to pass err to Last app.use(err,r,r,n) where n wont be used
   err.statusCode=err.statusCode||500;
   err.status=err.status||'error';
   console.log(err.stack);
   res.status(err.statusCode).json({ //although next() replaced by res.xx so not using next argument here but can not remove next argument (dealing w errs needs 4 arguments)
       status:err.status,
       message:err.message
   })
  //  res.status(404).json({status:'fail',message:'testing error2'}); //testing app.use('*',(err,req,res,next)=>{}) //so err 4 arguments -> no path? or any path could jump to app.use(error4) if there's an error
});
//the above one may be replaced by the below two
app.use((err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    next(err);
});
app.use((err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    })
}); */
//alternatively the above two can be written as teh below one
errController=require('./errorHandler');
app.use(errController);


const PORT=3001||process.env.PORT;
const server=app.listen(PORT,()=>{console.log(`app running on port: ${PORT}`);});

process.on('unhandledRejection',err=>{ //similar to event listen //unhandledRejection event
 //   console.log(err.name,err.message);
    console.log('UNHANDLED REJECTION. SHUTTING DOWN...');
    console.log(err);
    //process.exit(1); ///brute force shut down - need to be graceful
    server.close(()=>{
        process.exit(1); //executed after server.close()
    })
})

//console.log(x); //x undefined -> sync error uncaught exception
/*process.on('uncaughtException',err=>{
    console.log('UNCAUGHT EXCEPTION. SHUTTING DOWN...');
    console.log(err.name,err.message);
    //process.exit(1); ///brute force shut down - need to be graceful
    server.close(()=>{
        process.exit(1); //executed after server.close()
    })
})*/ //should be b4 console.log x or should be place on the top catching all sync errors