import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import {
  getContentImages,
  updateContentImage,
} from "../services/image.service";
import {
  imageParamsSchema,
  updateImageParamsSchema,
  updateImageSchema,
} from "../validation/image.validation";

const list: RequestHandler = catchAsync(async (req, res) => {
  const { type, id } = imageParamsSchema.parse(req.params);
  const data = await getContentImages(type, id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Content images retrieved successfully",
    data,
  });
});

const update: RequestHandler = catchAsync(async (req, res) => {
  const { imageId } = updateImageParamsSchema.parse(req.params);
  const input = updateImageSchema.parse(req.body);
  const data = await updateContentImage(imageId, input);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Content image updated successfully",
    data,
  });
});

export const ImageController = { list, update };
