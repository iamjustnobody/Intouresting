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
