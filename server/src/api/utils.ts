import { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof Error) {
    res.status(400).send({ message: err.message });
  } else {
    res.status(500).send({ message: "Internal Server Error" });
  }
  next();
};

export { errorHandler };
