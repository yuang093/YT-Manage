const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const oldReturn = `    return () => {
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isApiReady, videoId]);

  // audio 模式切換`;

const newReturn = `    return () => {
      console.log('[Player] Cleanup - timer cleared');
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (playerRef.current) {
        console.log('[Player] Cleanup - destroying player');
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, videoId]);

  // audio 模式切換`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
