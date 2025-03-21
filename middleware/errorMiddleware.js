// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if no status code set
    res.status(statusCode);

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Show stack only in development
    });
};

module.exports = { errorHandler };