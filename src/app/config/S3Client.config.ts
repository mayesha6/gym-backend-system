import { S3Client } from "@aws-sdk/client-s3";
import { envVars } from "./env"
import multer from "multer";
import multerS3 from "multer-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: envVars.S3.S3_REGION,
  credentials: {
    accessKeyId: envVars.S3.S3_ACCESS_KEY as string,
    secretAccessKey: envVars.S3.S3_SECRET_KEY as string,
  },
});

const mimeMap: Record<FileType, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/mpeg"],
  audio: ["audio/mpeg", "audio/mp3"],
  pdf: ["application/pdf"],
  any: [],
};

export const upload = ({
  folder,
  fileType = "any",
  maxCount = 1,
}: {
  folder: string;
  fileType?: FileType;
  maxCount?: number;
}) => {
  const storage = multerS3({
    s3: s3Client,
    bucket: envVars.S3.S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, "-");
      const fileName = `${folder}/${Date.now()}-${safeName}`;
      cb(null, fileName);
    },
  });

  const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    if (fileType !== "any" && !mimeMap[fileType].includes(file.mimetype)) {
      cb(new Error(`Invalid ${fileType} file type`));
    } else {
      cb(null, true);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }).array("files", maxCount);
};

export const getFileUrl = (file: Express.MulterS3.File) => {
  return (
    file.location ??
    `https://${envVars.S3.S3_BUCKET_NAME}.s3.${envVars.S3.S3_REGION}.amazonaws.com/${file.key}`
  );
};


export const deleteFileFromS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: envVars.S3.S3_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error("Failed to delete file from S3");
  }
};

export type FileType = "image" | "video" | "pdf" | "any" | "audio";

export enum FileTypes {
  IMAGE = "image",
  VIDEO = "video",
  PDF = "pdf",
  AUDIO = "audio",
}