// errors/handlePrismaError.ts
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default function handlePrismaError(err: PrismaClientKnownRequestError) {
  let statusCode = 400;
  let message = "Database request error";
  const errorSources = [];

  if (err.code === "P2002") {
    // Unique constraint failed
    message = "A record with this value already exists.";
    errorSources.push({
      path: err.meta?.target?.toString() || "",
      message,
    });
  } else {
    errorSources.push({
      path: "",
      message: err.message,
    });
  }

  return {
    statusCode,
    message,
    errorSources,
  };
}
