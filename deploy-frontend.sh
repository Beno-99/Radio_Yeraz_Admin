#!/bin/bash
cd ~/public_html/radioyeraz/player/frontend
npm run build
rm -rf ~/public_html/radioyeraz/player/_next/static
mkdir -p ~/public_html/radioyeraz/player/_next
cp -r ~/public_html/radioyeraz/player/frontend/.next/static ~/public_html/radioyeraz/player/_next/static
echo "✅ Frontend deployed successfully!"
