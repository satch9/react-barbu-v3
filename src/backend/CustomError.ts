class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;

        // Gardez la trace de la classe CustomError lors de l'empilement de la trace de la pile
        Error.captureStackTrace(this, this.constructor);
    }
}

export default CustomError;
