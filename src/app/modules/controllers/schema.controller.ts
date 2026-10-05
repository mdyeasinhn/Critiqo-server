import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import { generateSchema, saveSchema } from "../services/schema.service";
import {
  schemaContentParamsSchema,
  schemaTypeQuerySchema,
  updateSchemaBodySchema,
} from "../validation/schema.validation";

const generate: RequestHandler = catchAsync(async (req, res) => {
  const { type, id } = schemaContentParamsSchema.parse(req.params);
  const { schemaType } = schemaTypeQuerySchema.parse(req.query);
  const data = await generateSchema(type, id, schemaType);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "JSON-LD schema generated successfully",
    data: { schemaType, json: data },
  });
});

const update: RequestHandler = catchAsync(async (req, res) => {
  const { type, id } = schemaContentParamsSchema.parse(req.params);
  const { schemaType, json } = updateSchemaBodySchema.parse(req.body);
  const data = await saveSchema(type, id, schemaType, json);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "JSON-LD schema saved successfully",
    data: {
      ...data,
      scriptJson: JSON.stringify(data.json).replace(/</g, "\\u003c"),
    },
  });
});

export const SchemaController = { generate, update };
