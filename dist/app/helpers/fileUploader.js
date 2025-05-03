"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploader = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("cloudinary");
// Load configuration from environment variables
cloudinary_1.v2.config({
    cloud_name: 'diepqypex',
    api_key: '992165345858327',
    api_secret: 'cCArBANK5gfIS9u-d36zsQ8TgZI'
});
// Create uploads directory if it doesn't exist
const uploadDirectory = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDirectory)) {
    fs_1.default.mkdirSync(uploadDirectory, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg') {
        cb(null, true);
    }
    else {
        cb(new Error('Only .jpg, .jpeg and .png formats are allowed!'), false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Increase to 10MB or appropriate size
    },
});
const uploadToCloudinary = (file) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(file.path, {
            folder: 'product-review-portal',
            resource_type: 'auto'
        }, (err, result) => {
            // Delete local file after upload
            fs_1.default.unlinkSync(file.path);
            if (err || !result) {
                reject(err || new Error('Upload failed'));
            }
            else {
                resolve(result);
            }
        });
    });
});
const uploadMultipleToCloudinary = (files) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadPromises = files.map(file => uploadToCloudinary(file));
    return Promise.all(uploadPromises.filter(promise => promise !== undefined));
});
exports.fileUploader = {
    upload,
    uploadToCloudinary,
    uploadMultipleToCloudinary
};
