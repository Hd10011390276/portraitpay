/**
 * Installation script — run this to install portrait-specific dependencies
 *
 * npm install ethers@^6 @vladmandic/face-api@^2 jose@^5 @aws-sdk/client-s3@^3 @aws-sdk/s3-request-presigner@^3
 */

# PortraitPay — Required Dependencies

# Blockchain
ethers@^6

# Face Detection (browser-side)
# @vladmandic/face-api — face-api.js with modern ESM support
@vladmandic/face-api@^2

# JWT (Edge-compatible)
jose@^5

# AWS S3 / R2
@aws-sdk/client-s3@^3
@aws-sdk/s3-request-presigner@^3
