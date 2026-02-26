# Deployment Guide - Optimized Build

## Quick Start

Build the optimized production version:

```bash
npm run build
```

This will create an optimized production build in the `build/` folder.

## Performance Improvements Implemented

✅ **Route-based code splitting** - Only load pages when needed
✅ **Lazy loading images** - Images load as you scroll
✅ **Component memoization** - Prevent unnecessary re-renders
✅ **Production build** - Minified and optimized bundle

## Deploy to Server

### Option 1: Static File Server

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the entire `build/` folder to your server

3. Configure your web server:

   **For Nginx:**
   ```nginx
   server {
     listen 80;
     server_name yoursite.com;
     root /path/to/build;
     index index.html;

     # Enable Gzip compression
     gzip on;
     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

     location / {
       try_files $uri $uri/ /index.html;
     }

     # Cache static assets
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

   **For Apache (.htaccess):**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # Enable Gzip
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
   </IfModule>

   # Cache static assets
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType image/svg+xml "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=build
   ```

### Option 3: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   npm run build
   vercel --prod
   ```

## Analyze Bundle Size

To see what's in your bundle:

```bash
npm run build:analyze
```

This will show you:
- Which files are largest
- What dependencies take up space
- Opportunities for further optimization

## Testing Production Build Locally

Test your production build before deploying:

```bash
npm run build
npx serve -s build
```

Then open http://localhost:3000

## Performance Checklist

Before deploying, ensure:

- ✅ `npm run build` completes without errors
- ✅ All routes load correctly in production build
- ✅ Images load properly
- ✅ API calls work with production backend
- ✅ No console errors in browser
- ✅ Lazy loading works (check Network tab)
- ✅ Gzip/Brotli compression enabled on server
- ✅ Cache headers configured properly

## Environment Variables

If using environment variables, create `.env.production`:

```env
REACT_APP_API_URL=https://your-api.com/api
REACT_APP_API_TIMEOUT=10000
```

These will be embedded at build time.

## CDN Setup (Optional but Recommended)

For better performance, serve static assets from a CDN:

1. Upload `build/static/*` to your CDN
2. Update `package.json`:
   ```json
   "homepage": "https://your-cdn.com"
   ```
3. Rebuild: `npm run build`

## Monitoring

After deployment, monitor with:

1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Target: 90+ score

2. **GTmetrix**
   - https://gtmetrix.com/
   - Check load time and file sizes

3. **Chrome DevTools Lighthouse**
   - Run audit in Chrome
   - Check Performance, Best Practices, SEO

## Troubleshooting

### Issue: Blank page after deployment
**Solution:** Check browser console for errors. Usually routing issue - ensure server redirects all routes to index.html

### Issue: 404 on refresh
**Solution:** Configure server to handle client-side routing (see nginx/apache configs above)

### Issue: Slow loading
**Solutions:**
- Enable Gzip compression
- Check bundle size with `npm run build:analyze`
- Verify lazy loading is working
- Check API response times

### Issue: Images not loading
**Solutions:**
- Check image paths are correct (relative to /public)
- Verify image files are in build folder
- Check CORS if loading from external sources

## Next Steps for Even Better Performance

1. **Image Optimization:**
   - Convert to WebP format
   - Use responsive images (srcset)
   - Compress all images

2. **Service Worker:**
   - Enable PWA features
   - Offline capability
   - Cache API responses

3. **HTTP/2:**
   - Enable on your server
   - Parallel loading
   - Server push

4. **Preload Critical Resources:**
   - Add preload links in index.html
   - Faster initial render

## Support

For issues or questions:
- Check PERFORMANCE_OPTIMIZATIONS.md for details
- Review browser console for errors
- Test with production build locally first
