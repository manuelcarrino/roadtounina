const notFoundHandler = (_req, _res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || (err.message === "Not allowed by CORS" ? 403 : 500);
  const message = err.message || "Internal server error";
  const payload = { message, status };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
