# Copy Assets Instructions

To complete the setup, you need to copy the assets folder from the original HTML template to the React project.

## Windows (PowerShell)

```powershell
# Navigate to the project root
cd D:\Work_WIth_Abdul_Rehman\EBizWeb

# Copy assets folder
Copy-Item -Path "nest-frontend\assets" -Destination "nest-react-frontend\public\assets" -Recurse
```

## Windows (Command Prompt)

```cmd
xcopy /E /I nest-frontend\assets nest-react-frontend\public\assets
```

## Linux/Mac

```bash
cp -r nest-frontend/assets nest-react-frontend/public/
```

## What gets copied:

- `/assets/css/` - All CSS files including main.css and plugins
- `/assets/js/` - All JavaScript files including main.js and plugins
- `/assets/imgs/` - All images (banner, blog, shop, theme, vendor, etc.)
- `/assets/fonts/` - All font files
- `/assets/sass/` - SCSS source files (optional, for development)

After copying, your structure should be:
```
nest-react-frontend/
└── public/
    └── assets/
        ├── css/
        ├── js/
        ├── imgs/
        ├── fonts/
        └── sass/
```

