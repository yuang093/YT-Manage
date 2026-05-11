const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. 移除 audio 依賴，避免每次切換都重建 Player
const oldPlayerDeps = `}, [isApiReady, videoId, audio]);`;

const newPlayerDeps = `}, [isApiReady, videoId]);`;

content = content.replace(oldPlayerDeps, newPlayerDeps);

// 2. 確保 player 不會被意外摧毀 - 簡化 cleanup
const oldCleanup = `    return () => {
      console.log('[Player] Cleanup');
      clearTimeout(timer);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };`;

const newCleanup = `    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };`;

content = content.replace(oldCleanup, newCleanup);

// 3. 使用 CSS opacity 來控制顯示
const oldRender = `<div id="yt-player" style={{ opacity: audio ? 0 : 1 }} className="w-full h-full absolute inset-0"></div>`;
const newRender = `<div id="yt-player" className={\`w-full h-full absolute inset-0 \${audio ? 'opacity-0' : 'opacity-100'}\`}></div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
