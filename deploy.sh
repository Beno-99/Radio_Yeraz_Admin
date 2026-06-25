#!/bin/bash
echo "Building frontend..."
cd ~/public_html/radioyeraz/player/frontend
npm run build

echo "Copying static files..."
rm -rf ~/public_html/radioyeraz/player/_next/static
mkdir -p ~/public_html/radioyeraz/player/_next
cp -r ~/public_html/radioyeraz/player/frontend/.next/static ~/public_html/radioyeraz/player/_next/static

echo "✅ Done! Go to cPanel Node.js and click RESTART"
