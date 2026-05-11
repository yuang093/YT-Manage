const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace the container div to use dynamic class instead of just style
const oldContainer = `<div ref={containerRef} className={\`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out \${audio ? 'h-32' : 'aspect-video'}\`}>
         {/* API 掛載點 - 使用 display 控制顯示 */}
         <div id="yt-player" className="w-full h-full absolute inset-0"></div>`;

const newContainer = `<div ref={containerRef} className={\`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out \${audio ? 'h-32' : 'aspect-video'}\`}>
         {/* API 掛載點 */}
         <div id="yt-player" className={\`w-full h-full absolute inset-0 transition-opacity duration-300 \${audio ? 'opacity-0' : 'opacity-100'}\`}></div>`;

content = content.replace(oldContainer, newContainer);

// Update audio useEffect to trigger re-render
const oldAudioEffect = `  // audio 模式切換：只切換 iframe 顯示，不摧毀播放器
  useEffect(() => {
    console.log('[Audio Mode] audio =', audio);
    const iframe = document.querySelector('#yt-player iframe');
    console.log('[Audio Mode] iframe found:', iframe);
    if (iframe) {
      iframe.style.display = audio ? 'none' : 'block';
      console.log('[Audio Mode] iframe display set to:', audio ? 'none' : 'block');
    }
  }, [audio]);`;

const newAudioEffect = `  // audio 模式切換：使用 CSS opacity 控制顯示
  useEffect(() => {
    console.log('[Audio Mode] audio =', audio);
    // CSS opacity 控制會由 class 處理，這裡只是偵錯
  }, [audio]);`;

content = content.replace(oldAudioEffect, newAudioEffect);

fs.writeFileSync('src/App.jsx', content);
console.log('Done!');
