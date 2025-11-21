# Public Assets

This directory contains static assets served at the root of the application.

## Required Files

### og-image.jpg
**Open Graph preview image for social media sharing**

- **Dimensions**: 1200x630 pixels (required)
- **Format**: JPG (recommended) or PNG
- **Size**: < 5MB
- **Usage**: Social media link previews (Facebook, Twitter, LinkedIn)

**To add:**
1. Create or download a 1200x630px image showcasing PixelForge
2. Save as `og-image.jpg` in this directory
3. Redeploy

**Temporary Solution:**
You can use a free tool like [Canva](https://www.canva.com/) or [Figma](https://www.figma.com/) to create an Open Graph image, or use a placeholder from [Unsplash](https://unsplash.com/s/photos/image-processing) until you create a custom one.

**Quick placeholder:**
```bash
# Download a temporary placeholder (run in this directory)
curl -o og-image.jpg https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop
```
