const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 找到 audio 切換的邏輯部分 - 將 useEffect 簡化
const oldPattern = /  \/\/ 初始化播放器\n  useEffect\(\(\) => \{\n    if \(!isApiReady \|\| !videoId\) return;\n\n    \/\/ 如果播放器已存在，只需要切換 iframe 可見性\n    if \(playerRef\.current && typeof playerRef\.current\.getPlayerState === 'function'\)\) \{\n      \/\/ 強制 iframe 可見（當 audio = false 時）\n      const iframe = document\.querySelector\('#yt-player iframe'\);\n      if \(iframe\) iframe\.style\.display = audio \? 'none' : 'block';\n      return;\n    \}\n    \n    \/\/ 只有在播放器不存在時才建立\n    if \(!playerRef\.current && containerRef\.current\) \{\n      console\.log\('\[Player\] Creating new YT\.Player for videoId:', videoId\);/;

content = content.replace(oldPattern, "// Player setup already handled above");

fs.writeFileSync('src/App.jsx', content);
console.log("Done!");
