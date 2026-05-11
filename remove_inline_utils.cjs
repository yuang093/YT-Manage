const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Find and remove the inline utility functions block
const oldBlock = `}

// --- 工具函數 ---
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeID(url);
  return videoId ? \`https://img.youtube.com/vi/\${videoId}/mqdefault.jpg\` : null;
};



// Fisher-Yates 洗牌演算法
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- CSV ---
const arrayToCSV = (items) => {
  const headers = ['id', 'type', 'title', 'description', 'url', 'urls', 'createdAt', 'visits', 'downloads'];
  const csvRows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (header === 'urls') val = JSON.stringify(val || []); 
      if (val === undefined || val === null) val = '';
      const stringVal = String(val).replace(/"/g, '""');
      return \`"\${stringVal}"\`;
    }).join(',');
  });
  return [headers.join(','), ...csvRows].join('\n');
};
const csvToArray = (csvText) => {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1] !== undefined) values.push(match[1].replace(/""/g, '"'));
      else values.push(match[2]);
    }
    if (values.length === 0) continue;
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index];
      if (val === undefined) val = '';
      if (header === 'urls') {
        try { val = JSON.parse(val); } catch (e) { val = []; }
      }
      obj[header] = val;
    });
    result.push(obj);
  }
  return result;
};

// --- UI ---`;

const newBlock = `}

// --- UI ---`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
