module.exports = (err, req, res, next) => {
  console.error(`ERROR: ${req.method} ${req.url}`, {
    body: req.body,
    error: err.stack,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};