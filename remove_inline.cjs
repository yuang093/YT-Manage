const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 要移除的函式（這些已經移到 utils/ 了）
const functionsToRemove = [
  {
    name: 'getYouTubeID',
    start: 122,
    end: 128
  },
  {
    name: 'getYouTubeThumbnail', 
    start: 129,
    end: 138
  },
  {
    name: 'arrayToCSV',
    start: 139,
    end: 153
  }
];

// 讀取行
const lines = content.split('\n');

// 移除指定行（從高行數到低行數，避免行號偏移）
functionsToRemove.sort((a, b) => b.start - a.start);

for (const func of functionsToRemove) {
  console.log(`Removing ${func.name} (lines ${func.start}-${func.end})`);
  lines.splice(func.start - 1, func.end - func.start + 1);
}

// 寫回
fs.writeFileSync('src/App.jsx', lines.join('\n'));
console.log('Done!');
