import { Prisma } from "@prisma/client";

export default function handlePrismaError(err: Prisma.PrismaClientKnownRequestError) {
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
