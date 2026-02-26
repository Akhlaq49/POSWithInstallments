# Server Optimization Checklist

## 1. Test Gzip Compression

### Method 1: Chrome DevTools
1. Open your deployed site
2. Press F12 → Network tab
3. Reload the page
4. Click on main.js file
5. Look at **Response Headers**
6. Should see: `content-encoding: gzip` or `content-encoding: br`

### Method 2: PowerShell Command
```powershell
curl -I -H "Accept-Encoding: gzip,deflate" https://yoursite.com/static/js/main.js
```

**What to look for:**
- `Content-Encoding: gzip` ✅ (Good - Gzip enabled)
- `Content-Encoding: br` ✅ (Better - Brotli enabled)
- No Content-Encoding ❌ (Bad - No compression)

### Method 3: Online Tool
Visit: https://www.giftofspeed.com/gzip-test/

---

## 2. Check Browser Caching Headers

### Using Chrome DevTools
1. F12 → Network tab → Select any JS/CSS/image file
2. Check **Response Headers** section
3. Look for these headers:

**Good caching headers:**
```
Cache-Control: public, max-age=31536000, immutable
Expires: [date 1 year in future]
```

**Bad (no caching):**
```
Cache-Control: no-cache
or no Cache-Control header
```

### Using PowerShell
```powershell
curl -I https://yoursite.com/static/js/main.js
```

**Recommended values:**
- **Static assets** (JS/CSS/images): `max-age=31536000` (1 year)
- **HTML files**: `max-age=3600` (1 hour) or `no-cache`

---

## 3. Server Configuration Examples

### For Nginx (add to your server config)
```nginx
# Enable Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public";
}
```

### For Apache (.htaccess file)
```apache
# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>
```

---

## 4. CDN Setup (Optional)

### Check if CDN is Active
**Method 1: DevTools**
1. F12 → Network tab
2. Look at **Domain** column for assets
3. If loading from different domain → CDN active ✅
   - Example: `cdn.yoursite.com`, `cloudflare.com`, `cloudfront.net`
4. If same domain as main site → No CDN ❌

**Method 2: Check DNS**
```powershell
nslookup yoursite.com
```
If returns Cloudflare/Cloudfront IP → CDN active

### Popular Free CDN Options
1. **Cloudflare** (Recommended)
   - Free plan available
   - Add your domain at cloudflare.com
   - Change nameservers
   - Automatic Gzip + caching

2. **Netlify** 
   - Deploy build folder
   - Automatic CDN + SSL

3. **Vercel**
   - Deploy with `vercel --prod`
   - Global CDN included

---

## 5. Performance Testing Tools

### Test Your Site After Deployment

1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Target score: 90+

2. **GTmetrix**
   - https://gtmetrix.com/
   - Check YSlow scores

3. **WebPageTest**
   - https://www.webpagetest.org/
   - Detailed waterfall analysis

4. **Chrome Lighthouse**
   - F12 → Lighthouse tab → Generate report
   - Check Performance, Best Practices, SEO

---

## 6. Quick Test Script

Save this as `test-performance.ps1`:

```powershell
$url = "https://yoursite.com"

Write-Host "Testing: $url" -ForegroundColor Green

# Test Gzip
Write-Host "`n1. Checking Gzip Compression..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$url/static/js/main.js" -Method Head -Headers @{"Accept-Encoding"="gzip"}
$gzip = $response.Headers["Content-Encoding"]
if ($gzip -eq "gzip") {
    Write-Host "   ✅ Gzip enabled" -ForegroundColor Green
} else {
    Write-Host "   ❌ Gzip NOT enabled" -ForegroundColor Red
}

# Test Caching
Write-Host "`n2. Checking Cache Headers..." -ForegroundColor Yellow
$cache = $response.Headers["Cache-Control"]
if ($cache -and $cache -match "max-age") {
    Write-Host "   ✅ Caching enabled: $cache" -ForegroundColor Green
} else {
    Write-Host "   ❌ Caching NOT properly configured" -ForegroundColor Red
}

# Test CDN
Write-Host "`n3. Checking CDN..." -ForegroundColor Yellow
$server = $response.Headers["Server"]
$cfRay = $response.Headers["CF-Ray"]
if ($cfRay) {
    Write-Host "   ✅ Cloudflare CDN detected" -ForegroundColor Green
} elseif ($server -match "cloudfront") {
    Write-Host "   ✅ CloudFront CDN detected" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No CDN detected (or direct origin)" -ForegroundColor Gray
}

Write-Host "`nDone!" -ForegroundColor Green
```

Run it:
```powershell
.\test-performance.ps1
```

---

## Summary Checklist

After deploying your build folder, verify:

- [ ] Gzip compression enabled (content-encoding: gzip)
- [ ] Cache headers for static assets (max-age=31536000)
- [ ] All assets load from CDN (optional but recommended)
- [ ] PageSpeed score 90+ 
- [ ] Build folder uploaded to server
- [ ] Server configured to serve index.html for all routes (SPA routing)

**Expected Results:**
- Initial load: < 2s (on 3G)
- Main bundle: ~94 KB gzipped
- Total page size: < 500 KB
- Time to Interactive: < 2.5s
