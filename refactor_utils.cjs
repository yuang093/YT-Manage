const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add import statements for utils
const oldImports = `import React, { useState, useEffect, useRef } from 'react';`;
const newImports = `import React, { useState, useEffect, useRef } from 'react';
import { getYouTubeID, getYouTubeThumbnail, getVideoUrl, getVideoTitle } from './utils/youtube';
import { formatDate, formatDuration } from './utils/format';
import { arrayToCSV, csvToArray } from './utils/csv';`;

content = content.replace(oldImports, newImports);

// 2. Remove the inline utility functions (getYouTubeID, getYouTubeThumbnail, formatDate, formatDuration, etc.)
// These are now imported from utils

// Remove getYouTubeID
content = content.replace(/const getYouTubeID = \(url\) => \{[\s\S]*?return \(match && match\[2\]\.length === 11\) \? match\[2\] : null;\};\n?/, '');

// Remove getYouTubeThumbnail
content = content.replace(/const getYouTubeThumbnail = \(url\) => \{[\s\S]*?return videoId \? .* : null;\};\n?/, '');

// Remove formatDate
content = content.replace(/const formatDate = \(timestamp\) => \{[\s\S]*?return '';\n  \}\n\};\n?/, '');

// Remove formatDuration
content = content.replace(/const formatDuration = \(seconds\) => \{[\s\S]*?\};\n?/, '');

// Remove getVideoUrl
content = content.replace(/const getVideoUrl = \(item\) => \{[\s\S]*?\};\n?/, '');

// Remove getVideoTitle
content = content.replace(/const getVideoTitle = \(item\) => \{[\s\S]*?\};\n?/, '');

// Remove shuffleArray
content = content.replace(/const shuffleArray = \(array\) => \{[\s\S]*?return newArray;\n\};\n?/, '');

// Remove arrayToCSV
content = content.replace(/const arrayToCSV = \(items\) => \{[\s\S]*?return \[headers\.join\(','\), \.\.\.csvRows\]\.join\('\n'\);\n\};\n?/, '');

// Remove csvToArray
content = content.replace(/const csvToArray = \(csvText\) => \{[\s\S]*?return result;\n\};\n?/, '');

fs.writeFileSync('src/App.jsx', content);
console.log('Done! Utils refactored.');
