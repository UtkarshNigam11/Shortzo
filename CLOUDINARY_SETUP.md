# Cloudinary Setup Instructions

## 1. Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign up for free"
3. Create your account (you can use Google/GitHub login)

## 2. Get Your Credentials

After signing up, you'll be redirected to your dashboard where you can find:

- **Cloud Name**: Your unique cloud name (e.g., "your-cloud-name")
- **API Key**: Your API key (e.g., "123456789012345")
- **API Secret**: Your API secret (keep this secure!)

## 3. Configure Environment Variables

Update your `backend/.env` file:

```env
# Replace with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

## 4. Free Tier Limits

Cloudinary free tier includes:
- ✅ **25 GB** storage
- ✅ **25 GB** monthly bandwidth
- ✅ **1000** transformations per month
- ✅ Video uploads up to 350MB each
- ✅ CDN delivery worldwide

## 5. Features Included

With this integration, you get:
- 📹 **Video Upload**: Direct upload to Cloudinary
- 🖼️ **Thumbnail Generation**: Automatic thumbnail creation
- 📱 **Mobile Optimization**: Auto-format for different devices
- 🌐 **Global CDN**: Fast delivery worldwide
- 📊 **Analytics**: Upload and view statistics

## 6. Testing the Integration

1. Update your `.env` file with Cloudinary credentials
2. Restart your backend server
3. You should see: `✅ Cloudinary connected successfully`
4. Try uploading a reel through the UI

## 7. Troubleshooting

**Connection Issues:**
- Verify credentials are correct
- Check internet connection
- Ensure no firewall blocking

**Upload Failures:**
- Check file size limits (350MB for videos)
- Verify file format is supported
- Check Cloudinary dashboard for quota usage

## 8. Production Recommendations

- Use environment-specific folders (`shortzo-prod/`, `shortzo-dev/`)
- Enable auto-moderation for NSFW content
- Set up webhooks for upload notifications
- Monitor usage via Cloudinary dashboard
