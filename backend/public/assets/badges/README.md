# Badge Icons Directory

This directory should contain icon images for the gamification badge system.

## Required Badge Icons

Based on the badge seed data (`backend/src/database/seeds/badges-seed.ts`), the following badge icons are expected:

### Achievement Badges
1. **first-steps.png** - First Lab Completion badge
2. **enthusiast.png** - 10 Labs Completed badge
3. **lab-master.png** - 50 Labs Completed badge

### Points Badges
4. **point-hunter.png** - 1,000 Points Earned badge
5. **point-collector.png** - 5,000 Points Earned badge
6. **point-master.png** - 10,000 Points Earned badge
7. **legend.png** - 50,000 Points Earned badge

### Category Badges
8. **web-security.png** - Web Security Specialist badge
9. **api-security.png** - API Security Expert badge
10. **network-pentester.png** - Network Penetration Tester badge
11. **blue-team.png** - Blue Team Defender badge

## Image Specifications

- **Format**: PNG (recommended for transparency)
- **Recommended Size**: 128x128 pixels or 256x256 pixels
- **Background**: Transparent or matching theme
- **Style**: Consistent design language across all badges

## Adding Icons

1. Create or source appropriate badge icons
2. Save them in this directory with the exact filenames listed above
3. Ensure images have transparent backgrounds (PNG format)
4. The icons will be served at `/assets/badges/<filename>`

## Current Status

**Note**: This directory was created as part of the asset serving infrastructure. The actual badge icon files need to be created with appropriate designs for each achievement.
