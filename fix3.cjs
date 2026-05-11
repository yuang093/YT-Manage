const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 完全重寫播放器初始化 useEffect
const oldPlayerEffect = /  \/\/ 初始化播放器\n  useEffect\(\(\) => \{\n    console\.log\('\[Player useEffect\] trigger - audio:', audio, 'isApiReady:', isApiReady, 'videoId:', videoId\);\n    if \(isApiReady && videoId && containerRef\.current\) \{\n      console\.log\('\[Player useEffect\] creating player, audio mode:', audio\);\n      \n      \/\/ 摧毀舊播放器\n      if \(playerRef\.current\) \{\n        console\.log\('\[Player\] destroying existing player'\);\n        playerRef\.current\.destroy\(\);\n        playerRef\.current = null;\n      \}\n\n      \/\/ 延遲建立新播放器，確保 DOM 已更新\n      const timer = setTimeout\(\(\) => \{\n        console\.log\('\[Player\] setTimeout fired, creating YT\.Player'\);\n\n      const onStateChange.*?playerRef\.current = new window\.YT\.Player\('yt-player',.*?\}\);\n      \}\);\n    \}\n\n    return \(\) => \{\n      clearTimeout\(timer\);\n      if \(progressInterval\.current\) clearInterval\(progressInterval\.current\);\n      if \(playerRef\.current\) \{\n        playerRef\.current\.destroy\(\);\n        playerRef\.current = null;\n      \}\n    \};.*?\}, \[isApiReady, videoId, audio\]\);/s;

const newPlayerEffect = `  // 初始化播放器 (只在 videoId 改變時建立)
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current) return;
    console.log('[Player] Initializing with videoId:', videoId);

    // 延遲建立，確保 DOM 準備好
    const timer = setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const onStateChange = (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
          setIsPlaying(true);
          setDuration(playerRef.current.getDuration());
          if (progressInterval.current) clearInterval(progressInterval.current);
          progressInterval.current = setInterval(() => {
            setCurrentTime(playerRef.current.getCurrentTime());
            setStats(s => ({ ...s, totalTime: s.totalTime + 1 }));
          }, 1000);
        } else {
          if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (loopMode === 'one' && playerRef.current?.seekTo) {
              playerRef.current.seekTo(0);
              playerRef.current.playVideo();
            } else if (nextRef.current) {
              nextRef.current();
            }
          }
          clearInterval(progressInterval.current);
        }
      };

      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'autoplay': 1,
          'controls': 0,
          'playsinline': 1,
          'disablekb': 1,
          'fs': 0,
          'rel': 0,
          'iv_load_policy': 3
        },
        events: {
          'onStateChange': onStateChange,
          'onError': (e) => console.error('[YT Player Error]', e),
          'onReady': (e) => {
            setDuration(e.target.getDuration());
            e.target.setVolume(volume);
            e.target.playVideo();
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isApiReady, videoId]);

  // audio 模式切換：只切換 iframe 顯示，不摧毀播放器
  useEffect(() => {
    console.log('[Audio Mode] audio =', audio);
    const iframe = document.querySelector('#yt-player iframe');
    console.log('[Audio Mode] iframe found:', iframe);
    if (iframe) {
      iframe.style.display = audio ? 'none' : 'block';
      console.log('[Audio Mode] iframe display set to:', audio ? 'none' : 'block');
    }
  }, [audio]);`;

content = content.replace(oldPlayerEffect, newPlayerEffect);

// 修改 JSX：使用 style.display 而非 opacity
const oldRender = `<div id="yt-player" className={\`w-full h-full absolute inset-0 \${audio ? 'opacity-0' : 'opacity-100'}\`}></div>`;
const newRender = `<div id="yt-player" style={{ display: audio ? 'none' : 'block' }} className="w-full h-full absolute inset-0"></div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
