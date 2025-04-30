import multer from "multer";
import path from "path";
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryResponse, IFile } from "../interface/file";



cloudinary.config({
    cloud_name: 'diepqypex',
    api_key: '992165345858327',
    api_secret: 'cCArBANK5gfIS9u-d36zsQ8TgZI' // Click 'View API Keys' above to copy your API secret
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, path.join(process.cwd(), 'uploads'))
    },
    filename: function (req, file, cb) {

        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage });



const uploadToCloudinary = async (file: IFile): Promise<ICloudinaryResponse | undefined> => {
      // Upload an image
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload(
                file.path,
                (error :Error, result :ICloudinaryResponse)  =>{
                    fs.unlinkSync(file.path)
                    if(error){
                        reject(error)
                    }else{
                        resolve(result)
                    }
                }
            );
    })


}

export const fileUploader = {
    upload,
    uploadToCloudinary
}