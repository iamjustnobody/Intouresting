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
        new:true, 
        runValidators:true
    });
    if(!doc){return next(new appErr("No tour found with that ID in MongoDB",404) );} 
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
    let query=Model.findById(req.params.id);
    if(popOptions){query=query.populate(popOptions);}
    const doc=await query; 
    if(!doc){return next(new appErr("No document found with that ID in MongoDB",404) );} 
    res.status(200).json({
        status:'success',
        data:{data:doc}
    });
});

exports.getMany=Model => catchAsync(async(req,res,next)=>{
     let filterObj={}; 
    if(req.params.tourId){filterObj={tour:req.params.tourId}};
    const featuresObj=new ApiFeatures(Model.find(filterObj),req.query).filter().sort().limitFields().paginate();

    const docs=await featuresObj.query; //const docs=await featuresObj.query.explain();
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data:{data:docs}

    });
});
