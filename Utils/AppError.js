class AppError extends Error{
    constructor(message,statusCode) {
        super(message); //Error build-in property/field message
        this.statusCode=statusCode;
        this.status=`${this.statusCode}`.startsWith('4')?'fail':'error'; //or `${statusCode}`
        this.isOperational=true;

        Error.captureStackTrace(this,this.constructor); //object class
    }
}

module.exports=AppError;

//exported to tourhandler for mongodb id/tour existence error
//exported to app.js to process other non-existed routes errors
//will be processed in final errorhandler.js; jump to last error in app.use(error4)
//isOperational is for the errors we created -> new appError () for id/tour existence & non-exsited route