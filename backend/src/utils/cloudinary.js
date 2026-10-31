import { v2 as cloudinary } from 'cloudinary';

export const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:image/');
export const uploadImage = async (value, folder = 'misc') => {
  if (!isDataUrl(value)) return value;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const result = await cloudinary.uploader.upload(value, {
    folder: `nn-laundromat/${folder}`,
    resource_type: 'image',
    transformation: [{ width: 1600, crop: 'limit' }], 
  });

  return result.secure_url;
};