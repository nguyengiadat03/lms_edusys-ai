@echo off
echo ========================================
echo Connecting to GitHub and pushing code
echo ========================================
echo.

echo Step 1: Adding remote repository...
git remote add origin https://github.com/nguyengiadat03/edusys-ai.git

echo.
echo Step 2: Verifying remote...
git remote -v

echo.
echo Step 3: Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Check https://github.com/nguyengiadat03/edusys-ai
echo ========================================
pause
