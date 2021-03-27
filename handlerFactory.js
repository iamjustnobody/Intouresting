const catchAsync=require('./Utils/catchAsync');
const appErr=require('./Utils/AppError');
const  ApiFeatures=require('./Utils/apiFeatures');

exports.deleteOne=Model=> catchAsync((async(req,res,next)=>{
    const doc=await Model.findByIdAndDelete(req.params.id);
    if(!doc){return next(new appError("No document found with that ID in MongoDB",404) );}
    res.status(200).json({
        status:'success',
        data:null
    });
}))

exports.updateOne=Model => catchAsync(async(req,res,next)=>{
    const doc= await Model.findByIdAndUpdate(req.params.id,req.body,{
        new:true, //await query to send a new doc back
        runValidators:true
    });
    if(!doc){return next(new appErr("No tour found with that ID in MongoDB",404) );} //this is mongodb error
    //this will jump to and be caught by apperror //otherwise will return 200 ok
    //must return //otherwise use else if or place in the end
    res.status(200).json({
        status:'success',
        data:{data:doc}
    });
});

exports.addOne = Model => catchAsync(async (req,res,next)=>{
    const newDoc=await Model.create(req.body);
    res.status(201).json({
        status:'success',
        message:"ready",
        data:{data:newDoc}
    });
})

exports.getOne= (Model,popOptions) => catchAsync(async(req,res,next)=>{
  //  const doc=await Model.findById(req.params.id).populate('reviews'); //virtual populate ref back to child Review //name of field we wanna populate
    // populate also create a query to create connection btween two model
    let query=Model.findById(req.params.id);
    if(popOptions){query=query.populate(popOptions);}
    const doc=await query; //similar to apiFeatures this is where pre/post hook MW would execute first before this line of code (even if this line of code return none found in db

    if(!doc){return next(new appErr("No document found with that ID in MongoDB",404) );} //this is mongodb error
    //this will jump to and be caught by apperror //otherwise will return 200 ok //must return or elseif
    //console.log(doc);
    res.status(200).json({
        status:'success',
        data:{data:doc}
    });
});

exports.getMany=Model => catchAsync(async(req,res,next)=>{
    //apiFeatures ont only on Tour but also on Review
  //  const featuresObj=new ApiFeatures(Model.find(),req.query).filter().sort().limitFields().paginate(); //now below two lines of code allows for nested GET reviews on tour
    let filterObj={}; console.log(req.params);
    if(req.params.tourId){filterObj={tour:req.params.tourId}}; //tour & user & (generic) review use /:id in routepath params whilst nested tour/:tourId/review use /:tourId
  //  const featuresObj=new ApiFeatures(Model.find(),req.query).filter(filterObj).sort().limitFields().paginate(); //its like no filteration
    const featuresObj=new ApiFeatures(Model.find(filterObj),req.query).filter().sort().limitFields().paginate();

    const docs=await featuresObj.query; //const docs=await featuresObj.query.explain();
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data:{data:docs}

    });
});