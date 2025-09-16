const { S3Client, CreateBucketCommand, PutObjectCommand, PutBucketWebsiteCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const AWS_REGION = 'us-west-1';
const BUCKET_NAME = `ab-holistic-portal-frontend-${Date.now()}`;

const s3Client = new S3Client({ region: AWS_REGION });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global

async function uploadDirectory(bucketName, directoryPath, keyPrefix = '') {
  const files = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directoryPath, file.name);
    const key = keyPrefix ? `${keyPrefix}/${file.name}` : file.name;

    if (file.isDirectory()) {
      await uploadDirectory(bucketName, filePath, key);
    } else {
      const fileContent = fs.readFileSync(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      };

      try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Uploaded: ${key}`);
      } catch (error) {
        console.error(`Error uploading ${key}:`, error);
      }
    }
  }
}

async function deployFrontend() {
  try {
    // Create S3 bucket
    console.log('Creating S3 bucket...');
    await s3Client.send(new CreateBucketCommand({
      Bucket: BUCKET_NAME,
      CreateBucketConfiguration: {
        LocationConstraint: AWS_REGION
      }
    }));

    // Configure bucket for website hosting
    console.log('Configuring bucket for website hosting...');
    await s3Client.send(new PutBucketWebsiteCommand({
      Bucket: BUCKET_NAME,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: '404.html' }
      }
    }));

    // Upload build files
    console.log('Uploading build files...');
    const buildPath = path.join(__dirname, 'out');
    if (fs.existsSync(buildPath)) {
      await uploadDirectory(BUCKET_NAME, buildPath);
    } else {
      console.error('Build directory not found. Run "npm run build" first.');
      return;
    }

    const websiteUrl = `http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com`;
    console.log(`Frontend deployed successfully!`);
    console.log(`Website URL: ${websiteUrl}`);

  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

deployFrontend();