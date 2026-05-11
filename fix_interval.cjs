const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix: Clear interval BEFORE destroying player
const oldCleanup = `    return () => {
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };`;

const newCleanup = `    return () => {
      console.log('[Player] Cleanup');
      clearTimeout(timer);
      // 先清除 interval，再摧毀 player
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };`;

content = content.replace(oldCleanup, newCleanup);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
