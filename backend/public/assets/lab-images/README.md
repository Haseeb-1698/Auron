# Lab Images Directory

This directory should contain banner images for the various lab environments.

## Required Images

Based on the lab seed data (`backend/src/database/seeds/labs-seed.ts`), the following images are expected:

1. **dvwa.png** - DVWA (Damn Vulnerable Web Application) banner image
2. **juice-shop.png** - OWASP Juice Shop banner image
3. **metasploitable.png** - Metasploitable 2 banner image
4. **wazuh.png** - Wazuh Security Platform banner image

## Image Specifications

- **Format**: PNG (recommended) or JPG
- **Recommended Size**: 800x400 pixels or similar aspect ratio
- **Content**: Should be visually representative of each lab environment

## Adding Images

1. Create or source appropriate banner images for each lab
2. Save them in this directory with the exact filenames listed above
3. Ensure images are optimized for web (compressed)
4. The images will be served at `/assets/lab-images/<filename>`

## Current Status

**Note**: This directory was created to fix 404 errors for lab images. The actual image files need to be added by sourcing or creating appropriate banners for each lab environment.
