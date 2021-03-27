
//const fs=require('fs');
//const tours=JSON.parse(fs.readFileSync(`${__dirname}/data/tour-simple.json`));
//fs no longer required as now introducing mongodb
const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');

const factory=require('./handlerFactory');//move to top here

const multer=require('multer');
const sharp=require('sharp');
const multiStorageM=multer.memoryStorage();//this way image wil be stored as a buffer adn will be available @req.file.buffer
const multiFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){cb(null,true);}
    else{cb(new appErr('Not an image! Please upload only images',400),false);}
}
const upload=multer({storage: multiStorageM, fileFilter: multiFilter});
exports.uploadTourImages=upload.fields([
    {name:'imageCover',maxCount:1},
    {name:'images',maxCount:3}
]);//req.files
//upload.single('image') //req.file
//upload.array('images',5) //req.files
//now process image MW
exports.resizeTourImages=catchAsync(async (req,res,next)=>{
    console.log(req.files);
    if(!req.files.imageCover||!req.files.images){return next();}

    //imageCover
    //req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`;
    const imageCoverFilename=`tour-${req.params.id}-${Date.now()}-cover.jpeg`
    //both req.files.imageCover & .images are arrays with 1 element at most & 3 elements at most respectively
    await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90})//90% compressed a bit
        //.toFile(`public/img/${fileName}`);//need the entire path
        .toFile(`public/img/tours/${imageCoverFilename}`); //file destination //./users/${req.file.filename}
    //for updateTour(patch) using updateOne in handlerFactory, new updated item is called 'req.body' so need to pass filename to it so it can update existing doc property
    req.body.imageCover=imageCoverFilename;//same field name as defined in Tour model schema; just like req.file.filename assigned to .photo field in updateMe in userHandler

    //imgeas
    //req.files.images.forEach(async ()=>{await sharp})
    //not actually await before going to next() as async func is inside forEach as call back function
    //since async it'll return promise -> so if using map, an array of all these promises will be saved & we can use promise.all to await all of them before next()
    //then going to next MW to reall update document otherwise req.body.images will still be empty when calling next so none of the imgfilenames will be persisted into doc in db
    req.body.images=[]// match Tour model schema field (postman form-data now (or even raw previously) input key/field) //req.body.images for later used in updateTour func
    await Promise.all(
        req.files.images.map(async(image,index)=>{
            const imgfilename=`tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
            await sharp(req.files.images[index].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90})
                .toFile(`public/img/tours/${imgfilename}`);
            req.body.images.push(imgfilename);
        })
    );

    console.log("checking uploaded images filenames: ",req.body);
    next();
})


exports.aliasTopTours=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='-ratingsAverage,price';
    req.query.fields='name,price,ratingsAverage,summary,difficulty';
    next();
}


/*
class APIFeatures{
    constructor(query,queryString) {
        this.query=query;
        this.queryString=queryString;
    }
    filter(){
        const queryObj={...this.queryString}; //new obj with key value pair
        const excludedFields=['page','sort','fields','limit'];
        excludedFields.forEach(el=>{delete queryObj[el];});//not queryObj.el
        let queryStr=JSON.stringify(queryObj);
        queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g,matched=>{return `$${matched}`;});
        this.query=this.query.find(JSON.parse(queryStr));
        return this; //not this.query;
    }
    sort(){
        if(this.queryString.sort){
            const sortBy=this.queryString.sort.split(',').join(" ");
            this.query=this.query.sort(sortBy);
        }else{
            this.query=this.query.sort("-createdAt");
        }
        return this; //not this.query; //can access other methods - chaining
    }
    limitFields(){
        if(this.queryString.fields){
            const fields=this.queryString.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }else{
            this.query=this.query.select('-__v'); //- excluding
        }
        return this;
    }
    paginate(){
        const page=this.queryString.page*1||1;
        const limit=this.queryString.limit*1||100;
        const skip=(page-1)*limit;
        this.query=this.query.skip(skip).limit(limit);
        return this;
    }

} */


const APIFeatures=require('./Utils/apiFeatures');




exports.bodyValidateMW=(req,res,next)=>{
    if(!req.body.name||!req.body.price){
        return res.status(404).json({
            status:'fail',
            message:'Missing name or price'
        });//must return
    }
    next();//must next
}
/*
exports.getTours=(req,res)=>{
    res.status(200).json({
        status: 'success',
        data:{tours}

    });
}
 */  //now mongodb
exports.getTours=async (req,res)=>{
    try{
        console.log(req.query);
/*
        //     const tours=await Tour.find(); //all tours no filtration
        //filtering:
        //  const tours=await Tour.find({"duration":5, "difficutlty":easy});
   //     const tours=await Tour.find(req.query); //since {"duration":5, "difficutlty":easy} is readily available in req.query
        //      const tours=await Tours.find().where("duration").equals(5).where('difficulty').equals(easy);

        //    const query=req.query;//just save the ref of the obj to query so if delete query then req.query would be gone too
        //so need a hard copy
        const queryObj={...req.query};//taking all fields out of obj; so new obj containing all key value pairs from req.query
        const excludedFields=['page','sort','fields','limit'];
        excludedFields.forEach(el=>{delete queryObj[el];});//not queryObj.el
        console.log(queryObj);
       // const tours=await Tour.find(queryObj); //find is query.prototype referring to the obj so Tour.find returns query obj so that it can be chained
        //once await query returns all docs that meet query //comment out as we need more advanced filtering see below

     //   {difficulty:'easy',duration:{$gte:5}} //mongo
        //   {difficulty:'easy',duration:{gte:5}}
        let queryStr=JSON.stringify(queryObj);
        queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g,matched=>{return `$${matched}`;});
        // \b for exact match /g for all (not just first) occurrance
        console.log(JSON.parse(queryStr));
      //  const tours=await Tour.find(JSON.parse(queryStr));//find is query.prototype referring to the obj so Tour.find returns query obj so that it can be chained
        //once await query returns all docs that meet query
     //   const query= Tour.find(JSON.parse(queryStr)); const tours=await query;
        //but to implement other features (see below), change const query to let query and move const tours down after all features implemented
        let query=Tour.find(JSON.parse(queryStr)); //Tour.find return query obj so can be chained

        //sorting:
        if(req.query.sort){
        //    query=query.sort(req.query.sort); // query (obj) can be chained
           //what if there's a tie  //sort("price ratingAve"); ',' in url path
            const sortBy=req.query.sort.split(',').join(" ");
            console.log(sortBy);
            query=query.sort(sortBy);
            console.log(query);
        }else{
            query=query.sort("-createdAt");
        }

        //fields limiting
//query.select("price ratingAve"); ',' in url path
        if(req.query.fields){
            const fields=req.query.fields.split(',').join(' ');
            query=query.select(fields);
        }else{
            query=query.select('-__v'); //- excluding
        }

        //pagination & limit
        const page=req.query.page*1||1;
        const limit=req.query.limit*1||100;
        const skip=(page-1)*limit;
        query=query.skip(skip).limit(limit);
        if(req.query.page){
            const numTours=await Tour.countDocuments();
            if(skip>=numTours) throw new Error("This page does not exist"); //try catch error block
        }

        //query.filter().sort().select().skip().limit()
*/

     //   const query=new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
    //    const tours=await query;
        //wrong the above two
  //      console.log("hook1");
        const featuresObj=new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate(); //not await in here
   //     console.log("hook2");
        const tours=await featuresObj.query; //field query of featuresObj // this is where query executed so await here and pre/post query MW between hook2 & hook3
   //     console.log("hook3");

       res.status(200).json({
            status: 'success',
            results: tours.length,
            data:{tours}

        });
    }catch(err){
        res.status(400).json({
            status:'fail',
            message:err.message
        });
    }
}
exports.getTours2=catchAsync(async(req,res,next)=>{
    console.log('hook1');
    const featuresObj=new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
    console.log('hook2');
    const tours=await featuresObj.query;
    console.log('hook3');
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data:{tours}

    });
});
//hook1,hook2, prehook, posthook, hook3

exports.getTours3=factory.getMany(Tour);



exports.addATour=async (req,res)=>{
    //   express.json({type:'*/*'});
    /*
    console.log(req.body);
    //   const newTourId=tours.length+1;
    const newTourId=tours[tours.length-1].id+1;
    const newTourObj=Object.assign({
        id:newTourId
    },req.body);//merging two exsitign objects into one new object
    tours.push(newTourObj);
    fs.writeFile(`${__dirname}/data/tour-simple.json`,JSON.stringify(tours),err=>{
        res.status(201).json({
            status:'success',
            data:{tours:newTourObj}
        });
    })
    //   res.send("Done"); //already send back json
    */
    //now mongodb
 //   const newTour=new Tour({});  newTour.save(); //newTour is new doc //ok
 //   Tour.create({}).then() //now use async/await so add async to (req,res) and wrap in try catch
    //and then save values of promise to const
    try{ //console.log("between pre&post hook1") //then pre-hook
        const newTour=await Tour.create(req.body); //without await here data.tours below would be empty/null
       // console.log("between pre&post hook2") //after post-hook
        res.status(201).json({
            status:'success',
            message:"ready",
            data:{tours:newTour}
        });
    }catch(error){ //produced while dbmodel creating as we may create an obj without required field as shown in schema
        res.status(400).json({
            status:'fail',
            message:error.message
        });
    }
}
//alternatively
//const catchAsync = ctrFn =>{ctrFn(req,res,next).catch(err=>{next(err);});}
// but ctrfn not knowing where its arguments from (and addatour2 returns executed catchasync)
//const catchAsync = (ctrFn,req,res,next) =>{} //but addatour2 returns executed catchasync
/*
const catchAsync = ctrFn => {
    return (req,res,next)=>{
   //     ctrFn(req, res, next).catch(err => {next(err);});//ok //or err=> next(err)
        ctrFn(req, res, next).catch(next); //next fn automatically called with the arguments its received //catch err into next fn
    }
}*/
exports.addATour2 = catchAsync(async (req,res,next)=>{ ///pass error via catchasync/catch from addtour2 to errorhandler.js
    console.log('hook1');
    const newTour=await Tour.create(req.body);
    console.log('hook2');
    res.status(201).json({
        status:'success',
        message:"ready",
        data:{tours:newTour}
    });//hook1 xx xx hook2
}) //async func returns promise
//now instead of having catchasync locally in tourhandler.js, making catchAsync in Utils and import/required in here

exports.addATour3=factory.addOne(Tour);


const paramsValidate=(req,res)=>{
    console.log(req.params);
    const tour=tours.find(el=>{return el.id===req.params.id*1;});
    if(req.params.id*1>tours.length||!tour){
        return res.status(404).json({
            status:'fail',
            message:'Invalid ID'
        });
    }
}
exports.paramsValidateMW=(req,res,next,val)=>{
    console.log(req.params);
    console.log(`tourID is ${val}`);
    const tour=tours.find(el=>{return el.id===req.params.id*1;});
    if(req.params.id*1>tours.length||!tour) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });//must return
    }
    next();//must next
}
//paramsvalidate (MW) no longer required as mongodb is introduced

/*
exports.getATour=(req,res)=>{ console.log(req.params.id);
 //   paramsValidate(req,res); //for internal use
 //   paramsValidateMW(req,res); //exported not imported ;for external use only
    const tour=tours.find(el=>{return el.id===req.params.id*1;});
    res.status(200).json({
        status:'success',
        data:{tour}
    });
};
 */ //now mongodb
exports.getATour=async (req,res)=>{
    try{
        const tour=await Tour.findById(req.params.id);
     //   Tour.findOne({_id: req.params.id}); //ok
        res.status(200).json({
            status:'success',
            data:{tour}
        });
    }catch(err){
        res.status(400).json({
            status:'fail',
            message:err.message
        });
    }
};
exports.getATour2=catchAsync(async(req,res,next)=>{ console.log('review-tour1...');
    const tour=await Tour.findById(req.params.id).populate('reviews'); //virtual populate ref back to child Review //name of field we wanna populate
    //prehook prehook2 populate... posthook posthook2
    //above review - tour & user ---> tour-review virtual relationship; below tour-user/guides relationship see tourmodel find query pre-hook MW

    //find.populate('guides') //find.populate({path:'guides',select:'-_v -passwordChangedAt'}) //lifted up to Query pre MW in model.js
    console.log('review-tour2...');

    // populate also create a query to create connection btween two model
    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );} //this is mongodb error
    //this will jump to and be caught by apperror //otherwise will return 200 ok
    //must return
    res.status(200).json({
        status:'success',
        data:{tour}
    });
});

exports.getATour3=factory.getOne(Tour,{path:'reviews'}); //select

/*
exports.updateATour=(req,res)=>{
 //   paramsValidate(req,res);
    res.status(200).json({
        status:'success',
        data:"some data"
    });
};*/
//now mongodb
exports.updateATour= async (req,res)=>{
    try{
        const tour= await Tour.findByIdAndUpdate(req.params.id,req.body,{
            new:true, //await query to send a new doc back 
            runValidators:true
        })
        res.status(200).json({
            status:'success',
            data:{tour}
        });
    }catch(error){
        res.status(400).json({
            status:'fail',
            message:error.message
        });
    }
};

exports.updateATour2=catchAsync(async(req,res,next)=>{
    const tour= await Tour.findByIdAndUpdate(req.params.id,req.body,{
        new:true, //await query to send a new doc back
        runValidators:true
    });
    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );} //this is mongodb error
    //this will jump to and be caught by apperror //otherwise will return 200 ok
    //must return
    res.status(200).json({
        status:'success',
        data:{tour}
    });
});

//const factory=require('./handlerFactory');//move to top
exports.updateATour3=factory.updateOne(Tour);



/*
exports.deleteATour=(req,res)=>{
 //   paramsValidate(req,res);
    res.status(200).json({
        status:'success',
        data:null
    });
}
 */ //now mongodb
exports.deleteATour=async (req,res)=>{
    try{
        await Tour.findByIdAndDelete(req.params.id);
        res.status(200).json({
            status:'success',
            data:null
        });
    }catch (e) {
        res.status(400).json({
            status:'fail',
            message:e.message
        });
    }
}

exports.deleteATour2=catchAsync((async(req,res,next)=>{
//    await Tour.findByIdAndDelete(req.params.id); //ok but now we need to check if tour is null so this Tour.find query needs saving to a const/var
    const tour=await Tour.findByIdAndDelete(req.params.id);
    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );} //this is mongodb error
    //this will jump to and be caught by apperror //otherwise will return 200 ok
    //must return
    res.status(200).json({
        status:'success',
        data:null
    });
}))

//const factory=require('./handlerFactory');//move to top
exports.deleteATour3=factory.deleteOne(Tour);

exports.getStats = async (req,res) => {
    try{  //just like query: .query returns query; .aggregate returns aggregate obj; so need to wait for the result/doc/docs
        const stats = await Tour.aggregate([ //each stage is an obj with $name of the stage:
            {
                $match: { ratingAverage: { $gte: 4.5 } } //filter/select
            },
            {
                $group: { //accumulator  //sum avg max min are mongo operators followed by :"$ (name of fields like difficulty etc)"
                    _id: { $toUpper: '$difficulty' },
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingQuantity' },
                    avgRating: { $avg: '$ratingAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 }
            }
        ]); console.log(stats);
        res.status(200).json({
            status:'success',
            data:{stats}
        });
    }catch (e) {
        res.status(400).json({
            status:'fail',
            message:e.message
        });
    }
}

exports.getMonthlyPlan = async (req,res) => {
    try{
        const year=req.params.year*1;
        const plan=await Tour.aggregate([
            {
                $unwind:"$startDates" //array //unwind destruct an array field from a doc & create a doc for each array element //field of Tour schema
                //field of array we'd like to unwind is startDates
            }, {
                $match:{
                    startDates:{ //field of Tour schema
                        $gte:new Date(`${year}-01-01`),
                        $lte:new Date(`${year}-12-31`),
                    }
                }
            }, {
                $group:{ //group by _id (or $month) //group affects plan's presentation/display in o/p postman -> from tour array to _id/month array (_id, numTourstarts,tours are the fields that will be shown in o/p)
                    //apart from _id, $group could also calculate & present these
                    _id:{$month:"$startDates"}, //$month is an operator - the name of the field where we wanna extract the data from
                    numTourStarts:{$sum:1},
                    tours:{$push:"$name"} //tours is an array so use push
                }
            }, {
                $addFields:{month:"$_id"}
            }, {
                $project:{_id:0}
            },{
                $sort:{numTourStarts: -1} //new list of fields presented/defined by $group - fields including numTourStarts
            },{
                $limit:12
            }
        ]);

        res.status(200).json({
            status:'success',
            results:plan.length,
            data:{plan}
        });
    }catch (e) {
        res.status(400).json({
            status:'fail',
            message:e.message
        });
    }
}


exports.getTourWithin=catchAsync(async (req,res,next)=>{
    const {distance,latlng,unit}=req.params
    const [lat,lng]=latlng.split(',');
    if(!lat||!lng){next(new appError('Please provide latitude adn longitude in the format lat,lng',400))}
    const radius= unit==='mi'?distance/3963.2:distance/6378.1; //radians
    console.log(distance,lat,lng,unit,radius);
    const tours=await Tour.find({
        startLocation:{
            $geoWithin:{
                $centerSphere:[[lng,lat],radius]
            }
        }
    });//filter
    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{data:tours}
    })
})


exports.getDistances=catchAsync(async (req,res,next)=>{
    const {latlng,unit}=req.params;
    const [lat,lng]=latlng.split(',');
    if(!lat||!lng){next(new appError('Please provide latitude adn longitude in the format lat,lng',400))}
    const factor= unit==='mi'?0.000621371:0.001;
    console.log(lat,lng,unit);
    const distances=await Tour.aggregate([
        {
            $geoNear: { //geospatial only aggregate pipeline stage and it must be at the first stage of the pipeline; geonear requires at least one of fields containing index
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },//specify point here as geoJson
                distanceField: 'distance',
                distanceMultiplier: factor
            }
        },
        {
            $project:{
                distance:1,
                name:1
            }
        }
    ])
    res.status(200).json({
        status:'success',
        data:{data:distances}
    })
})

