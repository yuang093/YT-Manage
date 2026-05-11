const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Find the problematic section and fix it
// The issue is that 'const style = ...' appears BEFORE firebase imports but uses 'style' variable
// which gets minified to 'u' and conflicts with something else

// Move the style injection to AFTER the Firebase imports, and change 'style' to 'styleEl' to avoid conflicts
const lines = content.split('\n');
let newLines = [];
let inStyleBlock = false;
let firebaseImportIndex = -1;

// Find where firebase import is
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { initializeApp } from 'firebase/app'")) {
    firebaseImportIndex = i;
    break;
  }
}

// Find the style block (lines with // --- 全局動畫樣式 --- through the if statement)
let styleBlockStart = -1;
let styleBlockEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// --- 全局動畫樣式 ---')) {
    styleBlockStart = i;
  }
  if (styleBlockStart >= 0 && lines[i].includes("if (typeof document !== 'undefined') document.head.appendChild(style);")) {
    styleBlockEnd = i;
    break;
  }
}

if (styleBlockStart >= 0 && styleBlockEnd >= 0 && styleBlockStart < firebaseImportIndex) {
  console.log('Found style block at lines', styleBlockStart+1, '-', styleBlockEnd+1);
  console.log('Firebase import at line', firebaseImportIndex+1);
  
  // Extract style block
  const styleBlock = lines.slice(styleBlockStart, styleBlockEnd + 1);
  
  // Remove style block from current position
  lines.splice(styleBlockStart, styleBlockEnd - styleBlockStart + 1);
  
  // Change 'style' to 'styleEl' in the extracted block to avoid conflicts
  const modifiedStyleBlock = styleBlock.map(line => {
    if (line.includes('const style ')) {
      return line.replace('const style ', 'const styleEl ');
    }
    if (line.includes('document.head.appendChild(style)')) {
      return line.replace('document.head.appendChild(style)', 'document.head.appendChild(styleEl)');
    }
    return line;
  });
  
  // Find new firebase import index (it shifted)
  let newFirebaseIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("import { initializeApp } from 'firebase/app'")) {
      newFirebaseIndex = i;
      break;
    }
  }
  
  // Insert style block after firebase imports
  if (newFirebaseIndex >= 0) {
    // Find the last firebase import line
    let lastFirebaseImport = newFirebaseIndex;
    for (let i = newFirebaseIndex; i < lines.length; i++) {
      if (lines[i].startsWith("import {") && lines[i].includes("from 'firebase")) {
        lastFirebaseImport = i;
      }
    }
    // Insert after last firebase import
    lines.splice(lastFirebaseImport + 1, 0, '', ...modifiedStyleBlock);
  }
  
  content = lines.join('\n');
  fs.writeFileSync('src/App.jsx', content);
  console.log('Fixed!');
} else {
  console.log('Could not find style block to fix');
  console.log('styleBlockStart:', styleBlockStart, 'styleBlockEnd:', styleBlockEnd, 'firebaseImportIndex:', firebaseImportIndex);
}
