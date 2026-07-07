@echo off
echo ====================================================
echo MyKalakar Platform Dependency Purge ^& Clean Reinstall
echo ====================================================
echo.

echo [1/4] Purging npm cache...
call npm cache clean --force

echo [2/4] Removing build caches and temporary dist files...
if exist ".vite" rmdir /s /q ".vite"
if exist "dist" rmdir /s /q "dist"

echo [3/4] Destroying existing node_modules to eliminate path corruption...
if exist "node_modules" rmdir /s /q "node_modules"

echo [4/4] Executing native clean install...
call npm install

echo ====================================================
echo Rebuild Completed Successfully!
echo ====================================================
