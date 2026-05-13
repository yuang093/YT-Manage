import React, { useState, useEffect, useRef } from 'react';
import { Play, Shuffle, SkipForward, SkipBack, Plus, List, Settings, Trash2, Edit, Download, Upload, ExternalLink, Eye, Youtube, Lock, LogOut, X, Music, CheckSquare, Square, Cloud, HardDrive, ShieldAlert, Loader2, CheckCircle, Pause, Maximize2, Minimize2, Volume2, VolumeX, User, Search, Sun, Moon, Heart, Clock, PlayCircle, Zap, TrendingUp, TrendingDown, Repeat, Repeat1, Gauge, Timer, History, ArrowUpDown, Trash, Monitor, Share2, Mic, BarChart2, HelpCircle } from 'lucide-react';
import { getYouTubeID, getYouTubeThumbnail, getVideoUrl, getVideoTitle } from '../../utils/youtube';
const PlayerView = ({ item, setView, recordDownload }) => {
  const [idx, setIdx] = useState(0);
  const [shuffle, setShuffle] = useState(true); 
  const [vList, setVList] = useState([]);
  const [audio, setAudio] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  
  // 新功能：循環模式 (loopMode: 'none' | 'one' | 'all')
  const [loopMode, setLoopMode] = useState('none');
  // 新功能：播放速度
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  // 新功能：定時關閉
  const [sleepTimer, setSleepTimer] = useState(0); // 睡眠定時器 (分鐘)
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0); // 剩餘秒數
  const sleepTimerRef = useRef(null);
  
  // 新功能：畫中畫
  const [isPiP, setIsPiP] = useState(false);
  // 新功能：畫質選擇
  const [availableQualities, setAvailableQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  // 新功能：歌詞
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('🎵 歌詞功能\n\n點擊歌曲名稱可搜尋歌詞\n\n(此功能需要網路連線)');
  // 新功能：統計
  const [showStats, setShowStats] = useState(false);
  const [totalStats, setTotalStats] = useState({ totalTime: 0, totalVideos: 0, sessionStart: Date.now() });
  // 新功能：快捷鍵說明
  const [showHelp, setShowHelp] = useState(false);
  // 新功能：播放列表搜尋
  const [playlistSearch, setPlaylistSearch] = useState('');
  
  // 播放列表搜尋過濾
  const filteredPlaylist = vList.filter(item => 
    !playlistSearch || 
    (item && item.toLowerCase().includes(playlistSearch.toLowerCase()))
  );
  
  // 1. 音量控制 (State)
  const [volume, setVolume] = useState(100); 
  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = useRef(100);

  // 7. Fisher-Yates 隨機播放佇列
  const [shuffledIndices, setShuffledIndices] = useState([]);

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressInterval = useRef(null);
  const nextRef = useRef(null);

  // 初始化播放清單
  useEffect(() => { 
    if (item.type === 'single') {
      setVList([item.url]); 
      setIdx(0);
    } else {
      setVList(item.urls); 
      // 隨機選擇一首作為開始
      setIdx(Math.floor(Math.random() * item.urls.length));
    }
    setIsPlaying(false);
    
    // V10 新功能：恢復播放進度
    const savedProgress = localStorage.getItem(`yt-progress-${item.id}`);
    if (savedProgress) {
      try {
        const { idx: savedIdx, time: savedTime, listLength } = JSON.parse(savedProgress);
        if (listLength === (item.urls?.length || 1)) {
          setIdx(savedIdx || 0);
          setTimeout(() => {
            if (playerRef.current && playerRef.current.seekTo) {
              playerRef.current.seekTo(savedTime || 0, true);
            }
          }, 2000);
        }
      } catch (e) {}
    }
  }, [item]);

  // 當清單載入或 shuffle 切換時，產生新的隨機佇列
  useEffect(() => {
    if (vList.length > 0) {
      const indices = Array.from({ length: vList.length }, (_, i) => i);
      if (shuffle) {
        // Fisher-Yates Shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        // 確保目前播放的歌在第一個，避免切換 shuffle 時跳歌
        const currentIdxInShuffled = indices.indexOf(idx);
        if (currentIdxInShuffled !== -1 && currentIdxInShuffled !== 0) {
          [indices[0], indices[currentIdxInShuffled]] = [indices[currentIdxInShuffled], indices[0]];
        }
      }
      setShuffledIndices(indices);
    }
  }, [vList, shuffle]); // 注意: idx 不放入依賴，避免每次換歌都重洗
  
  const curItem = vList[idx];
  const curUrl = getVideoUrl(curItem);
  const curTitle = getVideoTitle(curItem);
  const videoId = getYouTubeID(curUrl);

  // 載入 YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
      document.body.appendChild(tag);
    } else {
      setIsApiReady(true);
    }
  }, []);

  // 1. 音量控制 (API 同步)
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
      if (volume > 0 && isMuted) setIsMuted(false);
      if (volume === 0 && !isMuted) setIsMuted(true);
    }
  }, [volume]);

  // 新功能：定時關閉計時器 + 逐步調低音量
  const [volumeFadeInterval, setVolumeFadeInterval] = useState(null);
  useEffect(() => {
    if (sleepTimer > 0) {
      // 逐步調低音量：每分鐘降低 10%
      const fadeSteps = Math.ceil(sleepTimer / 2); // 每2分鐘降一次
      let remainingMinutes = sleepTimer;
      
      sleepTimerRef.current = setTimeout(() => {
        // 開始逐步調低音量
        const fadeInterval = setInterval(() => {
          setVolume(prev => {
            const newVol = Math.max(0, prev - 15);
            if (playerRef.current && playerRef.current.setVolume) {
              playerRef.current.setVolume(newVol);
            }
            if (newVol === 0) {
              clearInterval(fadeInterval);
              // 音量歸零後暫停
              if (playerRef.current && playerRef.current.pauseVideo) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
              }
              setSleepTimer(0);
            }
            return newVol;
          });
        }, 120000); // 每2分鐘降低一次音量 (sleepTimer 分鐘內完成)
        
        setVolumeFadeInterval(fadeInterval);
        
        // 最終暫停
        if (playerRef.current && playerRef.current.pauseVideo) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
        setSleepTimer(0);
      }, sleepTimer * 60 * 1000);
    }
    
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
      if (volumeFadeInterval) {
        clearInterval(volumeFadeInterval);
      }
    };
  }, [sleepTimer]);
  
  // 新功能：播放速度控制
  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed]);

  // 初始化播放器
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
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') { setCurrentTime(playerRef.current.getCurrentTime()); }
          setTotalStats(s => ({ ...s, totalTime: s.totalTime + 1 }));
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
      console.log('[Player] Cleanup');
      
      // 先清除 interval，再摧毀 player
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, videoId]);  // 加入 audio - 每次切換都重建播放器

  // audio 模式切換偵錯
  useEffect(() => {
      }, [audio]);

  // audio 模式切換：使用 CSS opacity 控制顯示
  useEffect(() => {
    console.log('[Audio Mode] audio =', audio);
    // CSS opacity 控制會由 class 處理，這裡只是偵錯
  }, [audio]);

  const togglePlay = () => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;
    const state = playerRef.current.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  // 新功能：歌詞搜尋
  const searchLyrics = async () => {
    if (!curTitle) return;
    try {
      const query = curTitle.replace(/\([^)]*\)/g, '').replace(/\[.*\]/g, '').trim();
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        setLyrics('❌ 找不到歌詞\n\n請嘗試其他歌曲');
      }
    } catch(e) {
      // API 可能暫時不可用
      setLyrics('⚠️ 歌詞服務暫時不可用\n\n請稍後再試\n\n或使用其他方式搜尋歌詞');
    }
  };

  // 新功能：畫質選擇
  const setQuality = (quality) => {
    if (!playerRef.current) return;
    try {
      if (quality === 'auto') {
        playerRef.current.setPlaybackQualityRange('hd720', 'hd1080');
      } else {
        const qMap = { '1080p': 'hd1080', '720p': 'hd720', '480p': 'large', '360p': 'medium', '240p': 'small', '144p': 'tiny' };
        playerRef.current.setPlaybackQuality(qMap[quality] || 'medium');
      }
      setSelectedQuality(quality);
    } catch(e) {}
  };

  // 新功能：畫中畫
  const togglePiP = async () => {
    try {
      const playerElement = document.querySelector('#yt-player iframe');
      if (!playerElement) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await playerElement.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.log('PiP not supported:', err);
    }
  };

  // 新功能：分享
  const shareVideo = async () => {
    const url = `https://youtube.com/watch?v=${videoId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: curTitle, url });
      } catch(e) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('連結已複製到剪貼簿！');
    }
  };

  // 新功能：睡眠定時器格式化
  const formatSleepTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 1. 音量控制 (對數調整優化 Logarithmic)
  // 滑桿 (0-100) -> 實際音量 (0-100)
  // 人耳對音量是非線性的，但 YouTube API 是線性的。
  // 為了簡單直覺，這裡使用線性對應，但可以加入簡易曲線
  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current);
      setIsMuted(false);
    } else {
      previousVolume.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  // V9 新功能：鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 忽略輸入框中的鍵盤事件
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(100, v + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 10));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setLoopMode(m => {
            if (m === 'none') return 'all';
            if (m === 'all') return 'one';
            return 'none';
          });
          break;
        case 's':
        case 'S':
          // 切換隨機播放 (不重洗當前佇列)
          e.preventDefault();
          setShuffle(s => !s);
          break;
        case 'f':
        case '?':
          // 顯示/隱藏快捷鍵說明
          e.preventDefault();
          setShowHelp(h => !h);
          break;
        case 'F':
          // 切換純音樂模式 + 影片顯示大小調整
          e.preventDefault();
          setAudio(a => {
            // 切換後通知 YouTube player 調整大小
            setTimeout(() => {
              if (playerRef.current && playerRef.current.setSize) {
                const container = containerRef.current;
                if (container) {
                  const w = container.offsetWidth;
                  const h = container.offsetHeight;
                  playerRef.current.setSize(w, h);
                }
              }
            }, 100);
            return !a;
          });
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // 空依賴陣列，確保只註冊一次

  // 循環模式 + 隨機播放邏輯
  const next = () => {
    // 單曲循環
    if (loopMode === 'one') {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
      return;
    }
    
    // 列表循環 or 隨機
    let nextIdx;
    if (shuffle) {
      const currentPos = shuffledIndices.indexOf(idx);
      const nextPos = (currentPos + 1) % shuffledIndices.length;
      nextIdx = shuffledIndices[nextPos];
    } else {
      nextIdx = (idx + 1) % vList.length;
    }
    
    // 如果是列表循環且到達末尾
    if (loopMode === 'all' && nextIdx === 0 && !shuffle) {
      // 重新隨機排序
      const indices = Array.from({ length: vList.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
      nextIdx = indices[0];
    }
    
    setIdx(nextIdx);
  };

  const prev = () => {
    if (shuffle) {
      const currentPos = shuffledIndices.indexOf(idx);
      const prevPos = (currentPos - 1 + shuffledIndices.length) % shuffledIndices.length;
      setIdx(shuffledIndices[prevPos]);
    } else {
      setIdx(prevIdx => (prevIdx - 1 + vList.length) % vList.length);
    }
  };

  const openLink = () => { window.open(curUrl, '_blank'); recordDownload(item.id); };
  
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  if (!curItem) return <div className="p-12 text-center text-gray-500 dark:text-gray-400">載入中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between mb-4">
          <button onClick={() => {
          // V10 新功能：儲存播放進度
          if (item && item.id) {
            localStorage.setItem(`yt-progress-${item.id}`, JSON.stringify({
              idx: idx,
              time: currentTime,
              listLength: vList.length
            }));
          }
          setView('home');
        }} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><SkipBack size={16} className="mr-1"/> 返回列表</button>
          
          {/* 2. 純音樂模式切換 (顯示/隱藏影片，不中斷播放) */}
          <button 
            onClick={()=>{
              setAudio(!audio);
              // 切換後通知 YouTube player 調整大小
              setTimeout(() => {
                if (playerRef.current && playerRef.current.setSize) {
                  const container = containerRef.current;
                  if (container) {
                    const w = container.offsetWidth;
                    const h = container.offsetHeight;
                    playerRef.current.setSize(w, h);
                  }
                }
              }, 100);
            }} 
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${audio ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {audio ? <Music size={16} className="mr-1" /> : <Youtube size={16} className="mr-1" />}
            {audio ? '純音樂模式 (省電)' : '顯示影片畫面'}
          </button>
      </div>

      {/* 播放器容器 (3. 純音樂模式自動縮小) */}
      <div ref={containerRef} className={`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out ${audio ? 'h-32' : 'aspect-video'}`}>
         {/* API 掛載點 - 始終存在，控制 opacity 隱藏 */}
         <div id="yt-player"  className="w-full h-full absolute inset-0"></div>
         
         {/* Audio 遮罩 */}
         <div className={`absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center text-white pointer-events-none transition-opacity duration-300 ${audio ? 'opacity-100' : 'opacity-0'}`}>
             <Music size={32} className={`mb-2 ${isPlaying ? 'animate-pulse text-green-400' : 'text-gray-500'}`}/>
             <p className="text-gray-300 text-sm font-medium truncate max-w-xs px-4">{curTitle}</p>
         </div>
      </div>

      {/* 歌詞面板 */}
      {showLyrics && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowLyrics(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">🎵 歌詞</h3>
              <button onClick={() => setShowLyrics(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-center">
              {lyrics}
            </div>
            <button onClick={searchLyrics} className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
              🔍 重新搜尋歌詞
            </button>
          </div>
        </div>
      )}

      {/* 快捷鍵說明面板 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">⌨️ 快捷鍵</h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> 播放/暫停</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">←</kbd> 上一首</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">→</kbd> 下一首</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">↑</kbd> 音量+</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">↓</kbd> 音量-</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">M</kbd> 靜音</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">F</kbd> 純音樂模式</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">L</kbd> 循環模式</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">P</kbd> 畫中畫</div>
              <div><kbd className="bg-gray-700 px-2 py-1 rounded">?</kbd> 顯示說明</div>
            </div>
          </div>
        </div>
      )}

      {/* 統計面板 */}
      {showStats && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowStats(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">📊 播放統計</h3>
              <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="flex justify-between">
                <span>🎬 總播放影片數</span>
                <span className="font-bold text-white">{totalStats.totalVideos}</span>
              </div>
              <div className="flex justify-between">
                <span>⏱️ 總播放時間</span>
                <span className="font-bold text-white">{Math.floor(totalStats.totalTime / 60)} 分 {totalStats.totalTime % 60} 秒</span>
              </div>
              <div className="flex justify-between">
                <span>📅 連續播放</span>
                <span className="font-bold text-white">{Math.floor((Date.now() - totalStats.sessionStart) / 60000)} 分鐘</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 睡眠定時器顯示 */}
      {sleepTimer > 0 && sleepTimerRemaining > 0 && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-40 flex items-center">
          <Clock size={16} className="mr-2"/>
          💤 {formatSleepTimer(sleepTimerRemaining)}
        </div>
      )}

      {/* 控制列 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-t-4 border-red-600 space-y-4 transition-colors">
         {/* 時間與進度條 */}
         <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
            <span>{formatDuration(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span>{formatDuration(duration)}</span>
         </div>

         <div className="flex items-center justify-between flex-wrap gap-4">
             {/* 左側：播放控制 */}
             <div className="flex items-center space-x-4">
                <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-lg flex-shrink-0">
                  {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                </button>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Now Playing</div>
                  <div className="font-medium text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">{curTitle}</div>
                </div>
             </div>
             
             {/* 右側：功能按鈕 */}
             <div className="flex items-center space-x-2 sm:space-x-4">
               {/* 1. 音量控制滑桿 */}
               <div className="flex items-center">
                  <button onClick={toggleMute} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    {volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 cursor-pointer"
                    style={{ height: '8px' }}
                  />
               </div>

               {/* 循環模式按鈕 */}
                 <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                 <button 
                   onClick={() => setLoopMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')} 
                   className={`p-2 rounded-full transition ${
                     loopMode !== 'none' 
                       ? loopMode === 'one'
                         ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                         : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                       : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                   }`}
                   title={loopMode === 'none' ? '關閉循環' : loopMode === 'all' ? '列表循環' : '單曲循環'}
                 >
                   {loopMode === 'one' ? <Repeat1 size={20}/> : <Repeat size={20}/>}
                 </button>

               {/* 睡眠定時器 */}
               <button 
                 onClick={() => setSleepTimer(t => {
                   if (t >= 120) return 0;
                   return t === 0 ? 15 : t === 15 ? 30 : t === 30 ? 60 : t === 60 ? 90 : 120;
                 })}
                 className={`p-2 rounded-full transition ${sleepTimer > 0 ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                 title={sleepTimer > 0 ? `睡眠定時: ${sleepTimer}分鐘` : '睡眠定時器'}
               >
                 <Clock size={20}/>
                 {sleepTimer > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">{sleepTimer}</span>}
               </button>

               {/* 畫中畫 */}
               <button 
                 onClick={togglePiP}
                 className={`p-2 rounded-full transition ${isPiP ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                 title="畫中畫"
               >
                 <Monitor size={20}/>
               </button>

               {/* 分享 */}
               <button 
                 onClick={shareVideo}
                 className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                 title="分享"
               >
                 <Share2 size={20}/>
               </button>

               {/* 歌詞 */}
               <button 
                 onClick={() => { setShowLyrics(!showLyrics); if (!showLyrics && lyrics.includes('點擊上方按鈕')) searchLyrics(); }}
                 className={`p-2 rounded-full transition ${showLyrics ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                 title="歌詞"
               >
                 <Mic size={20}/>
               </button>

               {/* 統計 */}
               <button 
                 onClick={() => setShowStats(!showStats)}
                 className={`p-2 rounded-full transition ${showStats ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                 title="播放統計"
               >
                 <BarChart2 size={20}/>
               </button>

               {/* 快捷鍵說明 */}
               <button 
                 onClick={() => setShowHelp(!showHelp)}
                 className={`p-2 rounded-full transition ${showHelp ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                 title="快捷鍵 (?)"
               >
                 <HelpCircle size={20}/>
               </button>
                 
                 {/* 播放速度 */}
                 <div className="relative group">
                   <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center text-xs">
                     <Gauge size={16} className="mr-1" />
                     {playbackSpeed}x
                   </button>
                   <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     {speedOptions.map(speed => (
                       <button
                         key={speed}
                         onClick={() => setPlaybackSpeed(speed)}
                         className={`w-full px-3 py-1.5 text-xs first:rounded-t-lg last:rounded-b-lg ${
                           playbackSpeed === speed 
                             ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                             : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                         }`}
                       >
                         {speed}x
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* 畫質選擇 */}
                 {availableQualities.length > 0 && (
                   <div className="relative group">
                     <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center text-xs">
                       <Settings size={16} className="mr-1" />
                       {selectedQuality}
                     </button>
                     <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                       {availableQualities.map(q => (
                         <button
                           key={q}
                           onClick={() => setQuality(q)}
                           className={`w-full px-3 py-1.5 text-xs first:rounded-t-lg last:rounded-b-lg ${
                             selectedQuality === q 
                               ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                               : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                           }`}
                         >
                           {q}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {/* 定時關閉 */}
                 <div className="relative group">
                   <button 
                     className={`p-2 rounded-full flex items-center text-xs ${
                       sleepTimer > 0 
                         ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' 
                         : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                     title={sleepTimer > 0 ? `${sleepTimer}分鐘後停止` : '定時關閉'}
                   >
                     <Timer size={18} />
                     {sleepTimer > 0 && <span className="ml-1">{sleepTimer}</span>}
                   </button>
                   <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     {[0, 15, 30, 45, 60, 90].map(mins => (
                       <button
                         key={mins}
                         onClick={() => setSleepTimer(mins)}
                         className={`w-full px-3 py-1.5 text-xs first:rounded-t-lg last:rounded-b-lg ${
                           sleepTimer === mins 
                             ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                             : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                         }`}
                       >
                         {mins === 0 ? '關閉' : `${mins} 分鐘`}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 {item.type === 'playlist' && (
                 <>
                   <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                   {/* V10 新功能：歌單內隨機播放 - 重新洗牌按鈕 */}
                <button onClick={() => {
                  const indices = Array.from({ length: vList.length }, (_, i) => i);
                  for (let i = indices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                  }
                  // 確保目前播放的歌在第一個
                  const currentIdxInShuffled = indices.indexOf(idx);
                  if (currentIdxInShuffled !== -1 && currentIdxInShuffled !== 0) {
                    [indices[0], indices[currentIdxInShuffled]] = [indices[currentIdxInShuffled], indices[0]];
                  }
                  setShuffledIndices(indices);
                  setIdx(indices[0]);
                }} className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="重新洗牌"><Shuffle size={18} className="transform rotate-180"/></button>
                <button onClick={()=>setShuffle(!shuffle)} className={`p-2 rounded-full transition ${shuffle?'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400':'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={shuffle?"隨機播放開啟":"隨機播放關閉"}><Shuffle size={20}/></button>
                   <button onClick={prev} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><SkipBack size={20}/></button>
                   <button onClick={next} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><SkipForward size={20}/></button>
                 </>
               )}
             </div>
         </div>
      </div>

      {/* 詳細資訊與清單 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div><h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h1><p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{item.description}</p></div>
          <button onClick={openLink} className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center"><ExternalLink size={18} className="mr-2"/> 原始連結</button>
        </div>
        
        {item.type === 'playlist' && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-bold flex mb-2 text-gray-700 dark:text-gray-300"><List size={18} className="mr-2"/> 播放清單 ({filteredPlaylist.length}/{vList.length})</h3>
            {/* 播放列表搜尋 */}
            <input 
              type="text" 
              placeholder="🔍 搜尋歌曲..." 
              value={playlistSearch}
              onChange={e => setPlaylistSearch(e.target.value)}
              className="w-full mb-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
              {vList.map((v, i) => (
                <div key={i} onClick={()=>setIdx(i)} className={`p-3 cursor-pointer flex items-center border-b last:border-0 border-gray-200 dark:border-gray-700 ${i===idx?'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium':'hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-400'}`}>
                    <span className="w-8 text-center mr-2 text-xs text-gray-400 dark:text-gray-500">{i===idx?<Play size={12} className="mx-auto text-red-600 dark:text-red-400"/>:i+1}</span>
                    <span className="truncate flex-1">{getVideoTitle(v)}</span>
                    {/* 顯示隨機播放的順序 (Debug用，也可隱藏) */}
                    {shuffle && <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-2">#{shuffledIndices.indexOf(i) + 1}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 flex space-x-4"><span>累積訪問: {item.visits || 0}</span><span>累積下載: {item.downloads || 0}</span></div>
      </div>
    </div>
  );
};

export default PlayerView;
