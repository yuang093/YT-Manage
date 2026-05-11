const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix: Add guard in setInterval callback
const oldInterval = `progressInterval.current = setInterval(() => {
            setCurrentTime(playerRef.current.getCurrentTime());
            setStats(s => ({ ...s, totalTime: s.totalTime + 1 }));
          }, 1000);`;

const newInterval = `progressInterval.current = setInterval(() => {
            // 加 guard 避免 player 被摧毀後呼叫 getCurrentTime
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              setCurrentTime(playerRef.current.getCurrentTime());
              setStats(s => ({ ...s, totalTime: s.totalTime + 1 }));
            }
          }, 1000);`;

content = content.replace(oldInterval, newInterval);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
