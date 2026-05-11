const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Add debug before and after player creation
const oldPlayerCreation = `      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,`;

const newPlayerCreation = `      console.log('[Player] Before creating YT.Player');
      try {
        playerRef.current = new window.YT.Player('yt-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,`;

content = content.replace(oldPlayerCreation, newPlayerCreation);

// Add after player creation
const oldPlayerEnd = `          }
        }
      });
    }, 100);`;

const newPlayerEnd = `          }
        }
      });
      console.log('[Player] After creating YT.Player, playerRef:', playerRef.current);
      } catch (e) {
        console.error('[Player] Error creating player:', e);
      }
    }, 100);`;

content = content.replace(oldPlayerEnd, newPlayerEnd);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
