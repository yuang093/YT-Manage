const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace the entire player initialization and rendering logic with a simpler approach
// 1. Remove the audio useEffect
// 2. Use a different approach: force re-render by adding a key

const oldPlayerEffect = /  \/\/ 初始化播放器 \(只在 videoId 改變時建立\)\n  useEffect\(\(\) => \{[\s\S]*?\n    return \(\) => \{\n      console\.log\('\[Player\] Cleanup - timer cleared'\);\n      clearTimeout\(timer\);\n      if \(progressInterval\.current\) clearInterval\(progressInterval\.current\);\n      if \(playerRef\.current\) \{\n        console\.log\('\[Player\] Cleanup - destroying player'\);\n        playerRef\.current\.destroy\(\);\n        playerRef\.current = null;\n      \}\n    \};\n  \}, \[isApiReady, videoId\]\);/;

const newPlayerEffect = `  // 初始化播放器
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current) return;
    console.log('[Player] Initializing');

    // 清除舊播放器
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

    setTimeout(() => {
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
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, videoId, audio]);  // 加入 audio - 每次切換都重建播放器

  // audio 模式切換偵錯
  useEffect(() => {
    console.log('[Audio Mode] changed to:', audio);
  }, [audio]);`;

content = content.replace(oldPlayerEffect, newPlayerEffect);

// Replace the rendering section with a cleaner approach
const oldRender = `<div ref={containerRef} className={\`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out \${audio ? 'h-32' : 'aspect-video'}\`}>
         {/* API 掛載點 */}
         <div id="yt-player" className={\`w-full h-full absolute inset-0 transition-opacity duration-300 \${audio ? 'opacity-0' : 'opacity-100'}\`}></div>`;

const newRender = `<div ref={containerRef} className={\`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out \${audio ? 'h-32' : 'aspect-video'}\`}>
         {/* API 掛載點 */}
         <div id="yt-player" style={{ opacity: audio ? 0 : 1 }} className="w-full h-full absolute inset-0"></div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
