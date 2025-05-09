import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { ICloudinaryResponse, IFile } from "../interface/file";
import { NextFunction } from "express";

// Load configuration from environment variables
cloudinary.config({
  cloud_name: "diepqypex",
  api_key: "992165345858327",
  api_secret: "cCArBANK5gfIS9u-d36zsQ8TgZI",
});

// Create uploads directory if it doesn't exist
const uploadDirectory = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg and .png formats are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increase to 10MB or appropriate size
  },
});

const uploadToCloudinary = async (
  file: IFile,
): Promise<ICloudinaryResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      file.path,
      {
        folder: "product-review-portal",
        resource_type: "auto",
      },
      (err, result) => {
        // Delete local file after upload
        fs.unlinkSync(file.path);

        if (err || !result) {
          reject(err || new Error("Upload failed"));
        } else {
          resolve(result as unknown as ICloudinaryResponse);
        }
      },
    );
  });
};

const uploadMultipleToCloudinary = async (
  files: IFile[],
): Promise<ICloudinaryResponse[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(
    uploadPromises.filter((promise) => promise !== undefined),
  ) as Promise<ICloudinaryResponse[]>;
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
};
