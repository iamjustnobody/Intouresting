/*
exports.catchAsync = ctrFn => {
    return (req,res,next)=>{
        //     ctrFn(req, res, next).catch(err => {next(err);});//ok //or err=> next(err)
        ctrFn(req, res, next).catch(next); //next fn automatically called with the arguments its received //catch err into next fn
    }
} */ //ok
module.exports=ctrFn => {
    return (req,res,next)=>{
        //     ctrFn(req, res, next).catch(err => {next(err);});//ok //or err=> next(err)
        ctrFn(req, res, next).catch(next); //next fn automatically called with the arguments its received //catch err into next fn
    }
}

//exported to tourhandler.js