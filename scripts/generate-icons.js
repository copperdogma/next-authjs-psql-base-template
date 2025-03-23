/**
 * This script generates placeholder PWA icons.
 * Run this with Node.js:
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Text for SVG Icon
const createIconSVG = (size, textSize) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4F46E5"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${textSize}px" 
    text-anchor="middle" 
    dominant-baseline="middle" 
    fill="white">
    PWA
  </text>
</svg>
`;

// Define icon sizes and file paths
const icons = [
  { size: 192, filename: 'icon-192x192.png', textSize: 60 },
  { size: 512, filename: 'icon-512x512.png', textSize: 160 },
];

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG icons
for (const icon of icons) {
  const svgContent = createIconSVG(icon.size, icon.textSize);
  const svgFilePath = path.join(publicDir, icon.filename.replace('.png', '.svg'));

  fs.writeFileSync(svgFilePath, svgContent, 'utf8');
  console.log(`Created SVG icon: ${svgFilePath}`);
}

console.log('\nSVG icons created successfully!');
console.log('\nImportant: You need to convert these SVG files to PNG format.');
console.log('You can use online converters, or if you have ImageMagick installed:');
console.log('convert public/icon-192x192.svg public/icon-192x192.png');
console.log('convert public/icon-512x512.svg public/icon-512x512.png');
console.log('\nAlternatively, replace these with your own custom icons for production use.');
