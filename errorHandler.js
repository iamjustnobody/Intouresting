/*module.exports=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    console.log(err.stack);
    res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    })
};//this code is ok but now we need to think about errors during development vs production
*/

//global error last error in app.js
//apperror (from mongodb id/tour existence error from tourhandler or from appjs for invalid route path); or try catch async error
//operational error isOperational -> wrong route path (AppError or user input /:id req) or user input invalid data (validator error)
//need to make some more errors isoperational (other than those created from new appError())
//3 types of operational errors from mongoose: invalid id; duplicate key error, validation error

//the above code is ok but now we need to think about errors during development vs production
const appErr=require('./Utils/AppError');
const sendErrDev=(res, err)=>{  //API
     res.status(err.statusCode).json({
        status:err.status,
        error:err,
        message:err.message,
        stack:err.stack
    })
}
const sendErrDevWeb=(res,err)=>{
     res.status(err.statusCode).render('error',{ //return opt
        title:'Something went wrong',
        msg:err.message
    })
}
const sendErrDev2=(req,res, err)=>{
    //API
    if(req.originalUrl.startsWith('/api')){
        return res.status(err.statusCode).json({
            status:err.status,
            error:err,
            message:err.message,
            stack:err.stack
        })
    }//else { //above if already returned
        //RENDERED WEBSITE
        res.status(err.statusCode).render('error',{ //could return here as well
            title:'Something went wrong',
            msg:err.message
        })
   // }
}
//original code sendErrProd (b4 section 12) for API
const sendErrProd=(err,res)=>{
    if(err.isOperational){ //error we created/marked
        res.status(err.statusCode).json({
            status:err.status,
            message:err.message,
        });
    }else{
        console.error('ERROR',err); //for developer
        res.status(500).json({ //for public
            status:'error',
            message:'Something went very wrong'
        });
    }

}
//section 12 RENDERED WWEBSITE
const sendErrProd2=(err,res)=>{
    if(err.isOperational){ //error we created/marked
        console.log(err.message);
        return res.status(err.statusCode).render('error',{
            title:'Something went wrong',
            msg:err.message
        })
    }//else{ //above if already returned
        console.error('ERROR',err); //for developer
        res.status(err.statusCode).render('error',{  //could return here
            title:'Something went wrong',
            msg:"Please try again later"
        })
    //}

}

const handleCastErrDB=(err)=>{ console.log('CASTERR',err);
    const message=`Invalid ${err.path}:${err.value}.`;
    return new appErr(message,400);
}
const handleDupFieldsErrDB=(err)=>{ console.log('DUPERR',err);
 //   const value=err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]; //errmsg undefined
    const KVpairObj=err.keyValue;
    console.log("dup obj= ",KVpairObj);
    const keys=Object.keys(KVpairObj)
    const message=`Duplicate field value: ${keys}. Please use another value.`;
    return new appErr(message,400);
}
const handleValidationErrDB=(err)=>{ console.log('VADERR',err);
    const errMsgArray = Object.values(err.errors).map(el=>el.message);
    console.log('errMsgArray - ',errMsgArray)
    const message=`Invalid input data: ${errMsgArray.join('. ')}.`;
    return new appErr(message,400);
}

const handleJWTErr = () => new appErr("Invalid token. Please log in again",401); //401 unauthorised
const handleTokenExpErr = () => new appErr("Token expired. Please log in again",401);

module.exports=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    console.log('we are in the mode of ',process.env.NODE_ENV, typeof process.env.NODE_ENV);
    console.log(err.stack);
    if(process.env.NODE_ENV.trim()==='development'){ console.log("we are in the development mode now");
        sendErrDev2(req,res,err); //or return sendErrDev2(req,res,err); //sendErrDev(res,err);//original api
       // if(req.originalUrl.startsWith('/api')){return sendErrDev(res,err);}  sendErrDev2(req,res,err);  //ok
        // if(req.originalUrl.startsWith('/api')){return sendErrDev(res,err);}  return sendErrDev2(req,res,err); //ok
    }else if (process.env.NODE_ENV.trim()==='production'){ console.log("we are in the production mode now");
      //  sendErrProd(err,res);//ok but also need to make more mongo errors operational as shown below
        let error={...err};

        console.log("original err message ", err.message," copied error message ", error.message);
        error.message=err.message;

        if(err.name==='CastError'){error=handleCastErrDB(error);} //or error.name or handleCastErrDB(err); but needs error as left assignee and argument for sendErrProd below
        if(err.code===11000){error=handleDupFieldsErrDB(error);}
        if(err.name==='ValidationError'){error=handleValidationErrDB(error);}//ok
       // if(err.message.substr(13,23)==='Validation'){error=handleValidationErrDB(error);}//not 100% correct & substr index too dependable/ may vary

        if(err.name==='JsonWebTokenError') error=handleJWTErr();
        if(err.name==='TokenExpiredError') error=handleTokenExpErr();
        //above making/marking more operational errors
        if(req.originalUrl.startsWith('/api')){sendErrProd(error,res);} else {sendErrProd2(error,res);}//sendErrProd(error,res); //original api
        //if(req.originalUrl.startsWith('/api')){return sendErrProd(error,res);}  sendErrProd2(error,res); //?
    } //somehow NODE_ENV not working? (cannot switch to production) why?
   // sendErrDev(res,err);
};
