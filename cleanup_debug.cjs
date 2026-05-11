const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Remove all debug console.log statements from PlayerView
const debugLogs = [
  "console.log('[Player] Initializing with videoId:', videoId);",
  "console.log('[Player] Setting up timer, containerRef:', containerRef.current);",
  "console.log('[Player] Timer fired, creating player');",
  "console.log('[Player] Before creating YT.Player');",
  "console.log('[Player] After creating YT.Player, playerRef:', playerRef.current);",
  "console.log('[Audio Mode] changed to:', audio);",
];

debugLogs.forEach(log => {
  content = content.replace(log + '\n', '');
  content = content.replace(log, '');
});

// Clean up empty lines left behind
content = content.replace(/\n\n\n+/g, '\n\n');

fs.writeFileSync('src/App.jsx', content);
console.log('Done! Cleaned up debug logs.');
