
const Tour=require('./tourModel');
const catchAsync=require('./Utils/catchAsync');
const appError=require('./Utils/AppError');

const factory=require('./handlerFactory');

const multer=require('multer');
const sharp=require('sharp');
const multiStorageM=multer.memoryStorage();
const multiFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){cb(null,true);}
    else{cb(new appErr('Not an image! Please upload only images',400),false);}
}
const upload=multer({storage: multiStorageM, fileFilter: multiFilter});
exports.uploadTourImages=upload.fields([
    {name:'imageCover',maxCount:1},
    {name:'images',maxCount:3}
]);
exports.resizeTourImages=catchAsync(async (req,res,next)=>{
   
    if(!req.files.imageCover||!req.files.images){return next();}

    //imageCover
    //req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`;
    const imageCoverFilename=`tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90})//90% compressed a bit
        //.toFile(`public/img/${fileName}`);//need the entire path
        .toFile(`public/img/tours/${imageCoverFilename}`); 
    req.body.imageCover=imageCoverFilename;
    
    //imgeas
    req.body.images=[]
    await Promise.all(
        req.files.images.map(async(image,index)=>{
            const imgfilename=`tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
            await sharp(req.files.images[index].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quality:90})
                .toFile(`public/img/tours/${imgfilename}`);
            req.body.images.push(imgfilename);
        })
    );

    next();
})


exports.aliasTopTours=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='-ratingsAverage,price';
    req.query.fields='name,price,ratingsAverage,summary,difficulty';
    next();
}





const APIFeatures=require('./Utils/apiFeatures');




exports.bodyValidateMW=(req,res,next)=>{
    if(!req.body.name||!req.body.price){
        return res.status(404).json({
            status:'fail',
            message:'Missing name or price'
        })
    }
    next();
}

exports.getTours=async (req,res)=>{
    try{
        const featuresObj=new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate(); 
        const tours=await featuresObj.query; 

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
    
    const featuresObj=new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();

    const tours=await featuresObj.query;

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data:{tours}

    });
});


exports.getTours3=factory.getMany(Tour);



exports.addATour=async (req,res)=>{
    
    try{ 
        const newTour=await Tour.create(req.body); 
        res.status(201).json({
            status:'success',
            message:"ready",
            data:{tours:newTour}
        });
    }catch(error){ 
        res.status(400).json({
            status:'fail',
            message:error.message
        });
    }
}

exports.addATour2 = catchAsync(async (req,res,next)=>{ 

    const newTour=await Tour.create(req.body);

    res.status(201).json({
        status:'success',
        message:"ready",
        data:{tours:newTour}
    });
}) 

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
        });
    }
    next();
}

exports.getATour=async (req,res)=>{
    try{
        const tour=await Tour.findById(req.params.id);
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
exports.getATour2=catchAsync(async(req,res,next)=>{ 
    const tour=await Tour.findById(req.params.id).populate('reviews'); 

    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );} 

    res.status(200).json({
        status:'success',
        data:{tour}
    });
});

exports.getATour3=factory.getOne(Tour,{path:'reviews'}); 



exports.updateATour= async (req,res)=>{
    try{
        const tour= await Tour.findByIdAndUpdate(req.params.id,req.body,{
            new:true, 
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
        new:true,
        runValidators:true
    });
    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );}
    res.status(200).json({
        status:'success',
        data:{tour}
    });
});


exports.updateATour3=factory.updateOne(Tour);




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
    const tour=await Tour.findByIdAndDelete(req.params.id);
    if(!tour){return next(new appError("No tour found with that ID in MongoDB",404) );}
    res.status(200).json({
        status:'success',
        data:null
    });
}))


exports.deleteATour3=factory.deleteOne(Tour);

exports.getStats = async (req,res) => {
    try{  
        const stats = await Tour.aggregate([ 
            {
                $match: { ratingAverage: { $gte: 4.5 } } 
            },
            {
                $group: { 
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
                $unwind:"$startDates" 
            }, {
                $match:{
                    startDates:{
                        $gte:new Date(`${year}-01-01`),
                        $lte:new Date(`${year}-12-31`),
                    }
                }
            }, {
                $group:{ 
                    _id:{$month:"$startDates"}, 
                    numTourStarts:{$sum:1},
                    tours:{$push:"$name"}
                }
            }, {
                $addFields:{month:"$_id"}
            }, {
                $project:{_id:0}
            },{
                $sort:{numTourStarts: -1} 
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
            $geoNear: { 
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

