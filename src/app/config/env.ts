import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: string;
  DB_URL: string;
  NODE_ENV: "development" | "production";
  // IP_ADDRESS: string,
  BCRYPT_SALT_ROUND: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  // GOOGLE_CLIENT_SECRET: string;
  // GOOGLE_CLIENT_ID: string;
  // GOOGLE_CALLBACK_URL: string;
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;
  FRONTEND_LOCALHOST_URL: string;
  FRONTEND_DOMAIN_URL: string;
  DASHBOARD_URL: string;
  DASHBOARD_LOCALHOST_URL: string;
  DASHBOARD_DOMAIN_URL: string;
  // CLOUDINARY: {
  //   CLOUDINARY_CLOUD_NAME: string;
  //   CLOUDINARY_API_KEY: string;
  //   CLOUDINARY_API_SECRET: string;
  // };
  EMAIL_SENDER: {
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_PORT: string;
    SMTP_HOST: string;
    SMTP_FROM: string;
  };
  REDIS_HOST: string;
  REDIS_PORT: string;
  // REDIS_USERNAME: string;
  // REDIS_PASSWORD: string;
  S3: {
    S3_ACCESS_KEY: string;
    S3_SECRET_KEY: string;
    S3_REGION: string;
    S3_BUCKET_NAME: string;
    S3_ENDPOINT: string;
  }
  STRIPE: {
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  }
  AI_BASE_URL: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    // "IP_ADDRESS",
    "BCRYPT_SALT_ROUND",
    "JWT_ACCESS_EXPIRES",
    "JWT_ACCESS_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES",
    // "GOOGLE_CLIENT_SECRET",
    // "GOOGLE_CLIENT_ID",
    // "GOOGLE_CALLBACK_URL",
    "EXPRESS_SESSION_SECRET",
    "FRONTEND_URL",
    "FRONTEND_LOCALHOST_URL",
    "FRONTEND_DOMAIN_URL",
    "DASHBOARD_URL",
    "DASHBOARD_LOCALHOST_URL",
    "DASHBOARD_DOMAIN_URL",
    // "CLOUDINARY_CLOUD_NAME",
    // "CLOUDINARY_API_KEY",
    // "CLOUDINARY_API_SECRET",
    "SMTP_PASS",
    "SMTP_PORT",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_FROM",
    "REDIS_HOST",
    "REDIS_PORT",
    // "REDIS_USERNAME",
    // "REDIS_PASSWORD",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_REGION",
    "S3_BUCKET_NAME",
    "S3_ENDPOINT",
    "AI_BASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing require environment variabl ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    DB_URL: process.env.DB_URL!,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    // IP_ADDRESS: process.env.IP_ADDRESS,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    // GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    FRONTEND_LOCALHOST_URL: process.env.FRONTEND_LOCALHOST_URL as string,
    FRONTEND_DOMAIN_URL: process.env.FRONTEND_DOMAIN_URL as string,
    DASHBOARD_URL: process.env.DASHBOARD_URL as string,
    DASHBOARD_LOCALHOST_URL: process.env.DASHBOARD_LOCALHOST_URL as string,
    DASHBOARD_DOMAIN_URL: process.env.DASHBOARD_DOMAIN_URL as string,
    // CLOUDINARY: {
    //   CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
    //   CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    //   CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    // },
    EMAIL_SENDER: {
      SMTP_USER: process.env.SMTP_USER as string,
      SMTP_PASS: process.env.SMTP_PASS as string,
      SMTP_PORT: process.env.SMTP_PORT as string,
      SMTP_HOST: process.env.SMTP_HOST as string,
      SMTP_FROM: process.env.SMTP_FROM as string,
    },
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT as string,
    // REDIS_USERNAME: process.env.REDIS_USERNAME as string,
    // REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    S3: {
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY as string,
      S3_SECRET_KEY: process.env.S3_SECRET_KEY as string,
      S3_REGION: process.env.S3_REGION as string,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME as string,
      S3_ENDPOINT: process.env.S3_ENDPOINT as string,
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY as string,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    },
    AI_BASE_URL: process.env.AI_BASE_URL as string
  };
};

export const envVars = loadEnvVariables();
