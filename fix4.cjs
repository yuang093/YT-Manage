const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 在 timer 設定處加入更多偵錯
const oldTimer = `    // 延遲建立，確保 DOM 準備好
    const timer = setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const onStateChange = (event) => {`;

const newTimer = `    // 延遲建立，確保 DOM 準備好
    console.log('[Player] Setting up timer, containerRef:', containerRef.current);
    const timer = setTimeout(() => {
      console.log('[Player] Timer fired, creating player');
      try {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const onStateChange = (event) => {`;

content = content.replace(oldTimer, newTimer);

// 修改 player creation 後面的結尾
const oldPlayerEnd = `        }
        }
      });
    });

    return () => {
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isApiReady, videoId]);`;

const newPlayerEnd = `        }
        }
      });
      } catch (err) {
        console.error('[Player] Error creating player:', err);
      }
    });

    return () => {
      console.log('[Player] Cleanup');
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isApiReady, videoId]);`;

content = content.replace(oldPlayerEnd, newPlayerEnd);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
