import React, { useState, useEffect, useRef } from 'react';

// -----------------------------------------------------------------------------
// 模擬資料庫與工具函式
// -----------------------------------------------------------------------------

// 模擬音樂資料庫
const MOCK_DB_SONGS =;

// 工具：取得當日日期字串 (格式: YYYY-MM-DD)
const getCurrentDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 工具：Fisher-Yates 洗牌演算法 (用於隨機播放)
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// -----------------------------------------------------------------------------
// 主應用程式元件
// -----------------------------------------------------------------------------

export default function YouTubeCustomPlayer() {
  // --- 狀態管理 ---
  const [playlist, setPlaylist] = useState(); // 播放清單
  const = useState(0); // 目前播放索引
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50); // 音量 (0-100)
  
  // 功能 2: 純音樂模式 (預設關閉，即顯示影片)
  const [isMusicMode, setIsMusicMode] = useState(false);
  
  // 功能 6: 訪客計數
  const [visitCount, setVisitCount] = useState(0);

  // 介面狀態
  const = useState(false);
  const playerRef = useRef(null); // 綁定 YouTube Player 實例

  // --- 初始化與模擬後端 ---
  useEffect(() => {
    // 功能 6: 模擬「有人登入就加 1」的計數器
    // 在實際專案中，這裡會替換成 Firebase 的 transaction 呼叫
    const storedCount = localStorage.getItem('site_visit_count');
    const newCount = storedCount? parseInt(storedCount, 10) + 1 : 1;
    localStorage.setItem('site_visit_count', newCount);
    setVisitCount(newCount);

    // 載入預設播放清單 (範例)
    setPlaylist(, MOCK_DB_SONGS[1]]);
  },);

  // --- 播放器核心邏輯 ---

  // 初始化 YouTube Player (需在 index.html 引入 IFrame API，或使用 react-youtube 套件)
  // 這裡為了演示核心邏輯，我們假設使用 'react-youtube' 的 callback 風格，
  // 或是直接操作 window.YT。以下模擬 player 載入後的行為。
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
  };

  // 功能 3 & 7: 播放結束自動隨機/順序播放下一首
  const onPlayerStateChange = (event) => {
    // YT.PlayerState.ENDED === 0
    if (event.data === 0) {
      playNextSong();
    }
  };

  // 功能 7: 隨機播放邏輯
  // 這裡我們選擇「播放時隨機挑選下一首」的策略，這比打亂陣列更適合無限播放
  const playNextSong = () => {
    if (playlist.length === 0) return;

    // 這裡實作隨機播放：不從第一首開始，而是隨機挑選
    // 為了避免重複，實際專案可維護一個 "playedIndices" 陣列
    const nextIndex = Math.floor(Math.random() * playlist.length);
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  // 功能 1: 音量控制 (雙向綁定)
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  // 功能 4: 匯出 CSV
  const exportPlaylistToCSV = () => {
    if (playlist.length === 0) {
      alert('播放清單是空的！');
      return;
    }

    // 建立 CSV 內容
    const headers = 'ID,Title,Artist\n';
    const rows = playlist.map(song => 
      // 處理逗號，避免破壞 CSV 格式
      `${song.id},"${song.title.replace(/"/g, '""')}","${song.artist}"`
    ).join('\n');
    
    // 加入 BOM (\uFEFF) 解決 Excel 中文亂碼問題
    const csvContent = '\uFEFF' + headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 產生動態檔名 musiclist當天日期.csv
    const fileName = `musiclist_${getCurrentDateString()}.csv`;
    
    // 觸發下載
    const link = document.createElement('a');
    if (link.download!== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 功能 5: 處理歌曲勾選 (Toggle)
  const toggleSongSelection = (song) => {
    // 檢查歌曲是否已在清單中
    const exists = playlist.some(p => p.id === song.id);
    
    if (exists) {
      // 若存在則移除
      setPlaylist(playlist.filter(p => p.id!== song.id));
    } else {
      // 若不存在則新增
      setPlaylist([...playlist, song]);
    }
  };

  // 渲染目前的 Youtube 影片 ID
  const currentVideoId = playlist?.id;

  return (
    <div style={styles.container}>
      {/* 功能 6: 首頁計數器 */}
      <div style={styles.header}>
        <h1>My Custom Player</h1>
        <div style={styles.counterBadge}>
          今日瀏覽人次: {visitCount}
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* 播放器區域 */}
        <div style={styles.playerWrapper}>
          {currentVideoId? (
            <>
              {/* 
                功能 2: 關閉純音樂模式可以看到影片 
                我們透過 CSS class 控制 iframe 的顯示與否，而非移除 DOM，
                這樣可以保持音樂繼續播放。
              */}
              <div style={isMusicMode? styles.hiddenPlayer : styles.visiblePlayer}>
                {/* 這裡模擬嵌入 iframe，實際專案請使用 <YouTube /> 元件 */}
                <iframe
                  id="yt-player"
                  width="100%"
                  height="360"
                  src={`https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&autoplay=1&playsinline=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  // 功能 3: playsinline 對於 iOS 手機網頁連續播放至關重要
                  allowFullScreen
                ></iframe>
              </div>
              
              {isMusicMode && (
                <div style={styles.musicModePlaceholder}>
                  🎵 純音樂模式 (影片已隱藏)
                </div>
              )}
            </>
          ) : (
            <div style={styles.emptyState}>請先從清單選擇歌曲</div>
          )}
        </div>

        {/* 控制面板 */}
        <div style={styles.controls}>
          {/* 功能 1: 音量調整 */}
          <div style={styles.controlGroup}>
            <label>音量: {volume}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={handleVolumeChange} 
              style={styles.slider}
            />
          </div>

          {/* 功能 2: 純音樂模式切換 */}
          <button 
            onClick={() => setIsMusicMode(!isMusicMode)}
            style={isMusicMode? styles.activeBtn : styles.btn}
          >
            {isMusicMode? '開啟影片畫面' : '切換純音樂模式'}
          </button>

          {/* 功能 7: 隨機播放按鈕 */}
          <button onClick={playNextSong} style={styles.btn}>
            隨機下一首
          </button>
        </div>

        {/* 播放清單管理 */}
        <div style={styles.playlistSection}>
          <div style={styles.playlistHeader}>
            <h3>播放清單 ({playlist.length})</h3>
            <div>
              <button onClick={() => setShowSongSelector(true)} style={styles.primaryBtn}>
                管理 / 新增音樂
              </button>
              {/* 功能 4: 匯出 CSV */}
              <button onClick={exportPlaylistToCSV} style={{...styles.btn, marginLeft: '10px'}}>
                匯出清單 (CSV)
              </button>
            </div>
          </div>

          <ul style={styles.list}>
            {playlist.map((song, index) => (
              <li 
                key={song.id} 
                style={{
                 ...styles.listItem,
                  backgroundColor: index === currentSongIndex? '#e6f7ff' : 'white'
                }}
                onClick={() => setCurrentSongIndex(index)}
              >
                {index + 1}. {song.title} - {song.artist}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 功能 5: 歌曲選擇 Modal */}
      {showSongSelector && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>選擇音樂</h2>
            <div style={styles.songGrid}>
              {MOCK_DB_SONGS.map(song => {
                // 功能 5 核心: 檢查是否已在播放清單中 (Pre-check)
                const isSelected = playlist.some(p => p.id === song.id);
                return (
                  <label key={song.id} style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSongSelection(song)}
                    />
                    <span style={{marginLeft: '10px'}}>
                      {song.title} <small>({song.artist})</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <button 
              onClick={() => setShowSongSelector(false)} 
              style={{...styles.primaryBtn, marginTop: '20px', width: '100%'}}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 簡單的 CSS Styles (Inline Styles for demo purposes)
// -----------------------------------------------------------------------------
const styles = {
  container: { fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  counterBadge: { background: '#f0f0f0', padding: '5px 10px', borderRadius: '20px', fontSize: '0.9em' },
  mainContent: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' },
  playerWrapper: { position: 'relative', background: '#000', minHeight: '360px' },
  // 關鍵 CSS: 隱藏但保留 DOM 結構
  hiddenPlayer: { position: 'absolute', opacity: 0.001, width: '1px', height: '1px', pointerEvents: 'none' },
  visiblePlayer: { width: '100%', height: '100%' },
  musicModePlaceholder: { 
    height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
    color: 'white', background: 'linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d)' 
  },
  emptyState: { height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#eee' },
  controls: { padding: '15px', background: '#f9f9f9', borderBottom: '1px solid #eee', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px' },
  slider: { cursor: 'pointer' },
  btn: { padding: '8px 12px', cursor: 'pointer', background: 'white', border: '1px solid #ccc', borderRadius: '4px' },
  activeBtn: { padding: '8px 12px', cursor: 'pointer', background: '#333', color: 'white', border: '1px solid #333', borderRadius: '4px' },
  primaryBtn: { padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' },
  playlistSection: { padding: '20px' },
  playlistHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' },
  songGrid: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' },
  checkboxRow: { display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '5px' }
};