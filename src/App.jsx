import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Shuffle, 
  SkipForward, 
  SkipBack, 
  Plus, 
  List, 
  Settings, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Youtube,
  Lock,
  LogOut,
  X,
  Music,
  CheckSquare,
  Square,
  Cloud,
  HardDrive,
  ShieldAlert,
  Loader2,
  CheckCircle,
  Pause,
  Repeat,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, getDoc, increment } from 'firebase/firestore';

// ============================================================================
// Firebase 設定 (使用您的自訂設定)
// ============================================================================
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAf9E7Q5re8A09k-N7moPC_pkjqvVWOBbg",
  authDomain: "yt-manager-995a5.firebaseapp.com",
  projectId: "yt-manager-995a5",
  storageBucket: "yt-manager-995a5.firebasestorage.app",
  messagingSenderId: "188108532520",
  appId: "1:188108532520:web:76f89808fa5e919bc1be1d"
};

// 初始化 Firebase
const app = initializeApp(YOUR_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// 預設空歌曲列表
const MOCK_DB_SONGS = [];

// ============================================================================
// 工具函式
// ============================================================================
const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 產生 YYYYMMDD 字串 (功能 4)
const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// ============================================================================
// 子元件：Header
// ============================================================================
const Header = ({ setView, isAdmin, handleLogout, isLoading, view }) => (
  <header className="bg-white shadow-sm sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => setView('home')}
      >
        <div className="bg-red-600 p-2 rounded-lg">
          <Music className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">YT Music Manager</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {isAdmin && (
          <button 
            onClick={() => setView('admin')}
            className={`p-2 rounded-full hover:bg-gray-100 ${view === 'admin' ? 'text-red-600 bg-red-50' : 'text-gray-600'}`}
            title="管理後台"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        
        <button 
          onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新增歌曲</span>
        </button>

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="登出"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </header>
);

// ============================================================================
// 子元件：Dashboard (首頁)
// ============================================================================
const Dashboard = ({ items, viewItem, isLoading, permissionError, visitCount }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 簡單過濾
  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 統計與搜尋區塊 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="搜尋播放清單或歌曲..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
             <List className="w-4 h-4" />
          </div>
        </div>
        
        {/* 功能 6: 訪客計數器 */}
        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full">
          <Users className="w-4 h-4" />
          <span>瀏覽人次: {visitCount}</span>
        </div>
      </div>

      {permissionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          {permissionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>沒有找到歌曲，點擊右上角新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              onClick={() => viewItem(item)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-red-100"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img 
                  src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all shadow-lg">
                    <Play className="w-5 h-5 text-red-600 ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  YouTube
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1" title={item.title}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Youtube className="w-3 h-3" />
                  {item.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 子元件：CreatePage (搜尋並新增)
// ============================================================================
const CreatePage = ({ items, handleCreate, setView, showNotification }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // 模擬 YouTube 搜尋 (因為沒有後端 API key，這裡做一個假的解析與添加)
  const handleSearch = async () => {
    if (!url.trim()) return;
    setIsProcessing(true);

    const videoId = getYouTubeId(url);
    if (videoId) {
      const newSong = {
        id: videoId, 
        youtubeId: videoId,
        title: 'New Video (' + videoId + ')', // 預設標題
        artist: 'YouTube',
        duration: 0
      };
      
      const exists = items.some(i => i.youtubeId === videoId);
      setSearchResults([{ ...newSong, exists }]);
    } else {
       showNotification('請輸入有效的 YouTube 網址', 'error');
    }
    setIsProcessing(false);
  };

  // 單首手動添加模式
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');

  const handleManualAdd = () => {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      showNotification('無效的 YouTube 連結', 'error');
      return;
    }
    if (!manualTitle) {
      showNotification('請輸入標題', 'error');
      return;
    }
    
    // 檢查是否已存在 (雖然介面有提示，但防呆)
    // 功能 5: 介面已實作自動偵測，這裡直接加入
    handleCreate({
        title: manualTitle,
        artist: manualArtist || 'Unknown',
        youtubeId: videoId,
        category: 'General'
    });
    setView('home');
  };

  // 功能 5 檢查邏輯: 當 URL 改變，檢查是否已在庫中，若有則顯示綠色框框提示
  const isUrlInLibrary = React.useMemo(() => {
    const vid = getYouTubeId(url);
    if (!vid) return false;
    return items.some(i => i.youtubeId === vid);
  }, [url, items]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">新增歌曲</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube 連結</label>
            <div className="flex gap-2">
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none ${isUrlInLibrary ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <button 
                onClick={() => setUrl('')}
                className="p-3 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 功能 5: 提示已存在 */}
            {isUrlInLibrary && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> 此歌曲已在庫中 (您仍可再次新增至不同分類)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
              <input 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="輸入歌曲標題"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">演出者 (選填)</label>
              <input 
                value={manualArtist}
                onChange={(e) => setManualArtist(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="輸入演出者"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
              onClick={() => setView('home')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
            >
              取消
            </button>
            <button 
              onClick={handleManualAdd}
              disabled={!url || !manualTitle}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-200"
            >
              新增至資料庫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子元件：PlayerView (播放器核心)
// ============================================================================
const PlayerView = ({ activeItem, allItems, setView }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  
  // 功能 1: 音量控制
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // 功能 2: 純音樂模式 (隱藏影片)
  const [showVideo, setShowVideo] = useState(true);

  // 初始化播放清單與索引
  useEffect(() => {
    if (activeItem && allItems.length > 0) {
      setPlaylist(allItems);
      const idx = allItems.findIndex(i => i.id === activeItem.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [activeItem, allItems]);

  // YouTube API 初始化與載入
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
       if (window.YT && window.YT.Player && playlist.length > 0) {
         const currentVideo = playlist[currentIndex];
         if (!currentVideo) return;

         if (player) {
           player.loadVideoById(currentVideo.youtubeId);
           return;
         }

         new window.YT.Player('youtube-player', {
           height: '100%',
           width: '100%',
           videoId: currentVideo.youtubeId,
           playerVars: {
             'playsinline': 1,
             'autoplay': 1,
             'controls': 1,
             'rel': 0,
             'fs': 1
           },
           events: {
             'onReady': (event) => {
                setPlayer(event.target);
                event.target.setVolume(volume);
                setIsPlaying(true);
             },
             'onStateChange': (event) => {
                if (event.data === 1) setIsPlaying(true);
                if (event.data === 2) setIsPlaying(false);
                
                // 功能 3: 手機連續播放 / 自動播放下一首
                if (event.data === 0) {
                  handleNext();
                }
             }
           }
         });
       }
    };

    const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
            initPlayer();
            clearInterval(checkYT);
        }
    }, 500);

    return () => clearInterval(checkYT);
  }, [currentIndex, playlist]);

  useEffect(() => {
    if (player && playlist[currentIndex]) {
      player.loadVideoById(playlist[currentIndex].youtubeId);
      setIsPlaying(true);
    }
  }, [currentIndex, player]);

  // 功能 1: 音量監聽
  useEffect(() => {
    if (player) {
      player.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, player]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = useCallback(() => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) nextIndex = 0; // 循環
    setCurrentIndex(nextIndex);
  }, [currentIndex, playlist]);

  const handlePrev = () => {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    setCurrentIndex(prevIndex);
  };

  const handleShuffleJump = () => {
    const r = Math.floor(Math.random() * playlist.length);
    setCurrentIndex(r);
  };

  const currentSong = playlist[currentIndex] || {};

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* 頂部控制列 */}
      <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Now Playing</span>
          <h3 className="font-medium text-sm sm:text-base line-clamp-1">{currentSong.title}</h3>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full opacity-0 pointer-events-none">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* 播放器區域 (功能 2: 影片顯示切換) */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className={`relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-500 ${!showVideo ? 'opacity-0 h-0 w-0 absolute' : 'opacity-100'}`}>
          <div id="youtube-player" className="w-full h-full"></div>
        </div>
        
        {/* 純音樂模式下的替代視覺 */}
        {!showVideo && (
           <div className="text-center text-white animate-pulse">
             <Music className="w-32 h-32 mx-auto mb-4 text-red-500" />
             <h2 className="text-2xl font-bold">{currentSong.title}</h2>
             <p className="text-gray-400">{currentSong.artist}</p>
             <p className="mt-4 text-sm text-gray-500">純音樂模式</p>
           </div>
        )}
      </div>

      {/* 底部控制面板 */}
      <div className="bg-gray-900 text-white p-6 pb-8 rounded-t-3xl border-t border-gray-800">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold line-clamp-1 mb-1">{currentSong.title}</h2>
              <p className="text-gray-400 text-sm">{currentSong.artist || 'YouTube Music'}</p>
            </div>
            
            {/* 功能 2: 切換按鈕 */}
            <button 
                onClick={() => setShowVideo(!showVideo)}
                className={`p-2 rounded-full transition-colors ${!showVideo ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                title={showVideo ? "切換至純音樂模式" : "顯示影片"}
            >
              {showVideo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <button onClick={handleShuffleJump} className="text-gray-400 hover:text-white transition-colors p-2">
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={handlePrev} className="text-white hover:text-red-500 transition-colors p-2">
              <SkipBack className="w-8 h-8" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button onClick={handleNext} className="text-white hover:text-red-500 transition-colors p-2">
              <SkipForward className="w-8 h-8" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors p-2">
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* 功能 1: 音量 */}
          <div className="flex items-center gap-4 text-gray-400 max-w-sm mx-auto">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={isMuted ? 0 : volume} 
              onChange={(e) => {
                setVolume(parseInt(e.target.value));
                setIsMuted(false);
              }}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-xs w-8">{isMuted ? 0 : volume}%</span>
          </div>

        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子元件：AdminPanel (管理後台)
// ============================================================================
const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport, setView }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          歌曲管理 ({items.length})
        </h2>
        <div className="flex gap-2">
           <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" />
            匯入 CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            匯出 CSV
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 font-medium">標題</th>
              <th className="px-6 py-3 font-medium hidden sm:table-cell">演出者</th>
              <th className="px-6 py-3 font-medium hidden md:table-cell">ID</th>
              <th className="px-6 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`} 
                      className="w-10 h-10 rounded object-cover bg-gray-200"
                      alt=""
                    />
                    <span className="font-medium text-gray-900 line-clamp-1">{item.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{item.artist}</td>
                <td className="px-6 py-4 text-gray-400 text-xs font-mono hidden md:table-cell">{item.youtubeId}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 子元件：LoginView & EditPage
// ============================================================================
const LoginView = ({ onLogin }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
         <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
           <Music className="w-8 h-8 text-red-600" />
         </div>
         <h2 className="text-2xl font-bold mb-2">歡迎回來</h2>
         <p className="text-gray-500 mb-8">請登入以管理您的音樂庫</p>
         <button 
           onClick={onLogin}
           className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
         >
           <LogOut className="w-5 h-5" />
           匿名登入
         </button>
      </div>
    </div>
  );
};

const EditPage = ({ item, handleUpdate, setView, showNotification }) => {
    const [formData, setFormData] = useState({...item});

    const onSubmit = () => {
        handleUpdate(item.id, formData);
        showNotification('更新成功', 'success');
        setView('admin');
    };

    return (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">編輯歌曲</h2>
            <div className="space-y-4">
                <input 
                    className="w-full p-2 border rounded" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="標題"
                />
                <input 
                    className="w-full p-2 border rounded" 
                    value={formData.artist} 
                    onChange={e => setFormData({...formData, artist: e.target.value})}
                    placeholder="演出者"
                />
                <div className="flex gap-2 pt-4">
                    <button onClick={() => setView('admin')} className="flex-1 py-2 bg-gray-100 rounded">取消</button>
                    <button onClick={onSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded">儲存</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 主應用程式 App
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('home');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [permErr, setPermErr] = useState(null);
  
  // 功能 6: 訪客計數
  const [visitCount, setVisitCount] = useState(0);

  // Firestore collection 路徑 ID
  const DB_APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-yt-app';

  // 1. Auth 監聽
  useEffect(() => {
    const initAuth = async () => {
       // 因為使用自定義的 Firebase Config (不同的 projectId)，
       // 這裡直接使用匿名登入，因為環境變數提供的 Custom Token 與您的專案不匹配
       try { 
         await signInAnonymously(auth); 
       } catch(e) { 
         console.error("Auth Error:", e);
         showNotification("登入發生錯誤，請檢查 Firebase Console 設定", "error");
       }
    };
    initAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(!!u);
      setIsLoading(false);
      
      if (u) {
          updateVisitCount();
      }
    });
    return () => unsub();
  }, []);

  // 2. Data 監聽
  useEffect(() => {
    if (!user) return;
    // 使用 DB_APP_ID 以符合 Immersive 的路徑規則 (artifacts/{appId}/...)
    const q = collection(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs');
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(list);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setPermErr("讀取資料失敗，請確認權限設定 (Rule 1/3)");
      }
    );
    return () => unsub();
  }, [user]);

  // 功能 6: 訪客計數器實作
  const updateVisitCount = async () => {
    const statsRef = doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'stats', 'global');
    try {
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
            setVisitCount(snap.data().visits || 0);
        }

        if (!sessionStorage.getItem('visited')) {
             if (snap.exists()) {
                 await updateDoc(statsRef, { visits: increment(1) });
             } else {
                 await setDoc(statsRef, { visits: 1 });
             }
             setVisitCount(prev => prev + 1);
             sessionStorage.setItem('visited', 'true');
        }
    } catch (e) {
        console.log("Stats error:", e);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // CRUD 操作
  const handleCreate = async (data) => {
    if (!user) return;
    try {
      const newRef = doc(collection(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs'));
      await setDoc(newRef, {
        ...data,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      showNotification('新增成功');
    } catch (error) {
      showNotification('新增失敗: ' + error.message, 'error');
    }
  };

  const handleUpdate = async (id, data) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs', id), data);
    } catch (error) {
      showNotification('更新失敗', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除嗎？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs', id));
      showNotification('已刪除');
    } catch (error) {
      showNotification('刪除失敗', 'error');
    }
  };

  // 功能 4: 匯出 CSV (修改檔名 musiclistYYYYMMDD.csv)
  const handleExport = () => {
    const headers = ['Title', 'Artist', 'YouTube ID', 'Category'];
    const csvContent = [
      headers.join(','),
      ...items.map(i => `"${i.title}","${i.artist}","${i.youtubeId}","${i.category || ''}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `musiclist${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const rows = text.split('\n').slice(1); 
      let count = 0;
      rows.forEach(row => {
        const cols = row.split(',').map(c => c.replace(/^"|"$/g, ''));
        if (cols.length >= 3 && cols[2]) {
          handleCreate({
             title: cols[0],
             artist: cols[1],
             youtubeId: cols[2],
             category: cols[3] || 'Imported'
          });
          count++;
        }
      });
      showNotification(`已排程匯入 ${count} 首歌`);
    };
    reader.readAsText(file);
  };

  const handleLogin = async () => {
     try {
       await signInAnonymously(auth);
     } catch (e) {
       showNotification('登入失敗', 'error');
     }
  };
  
  const handleLogout = () => {
      signOut(auth);
      setView('login');
  };

  // 功能 7: 隨機播放開始
  const startPlayer = (clickedItem) => {
      setActiveItem(clickedItem);
      setView('view');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header 
        setView={setView} 
        isAdmin={isAdmin} 
        handleLogout={handleLogout} 
        isLoading={isLoading} 
        view={view}
      />
      
      {notification && (
        <div className={`fixed top-20 right-4 p-4 rounded-xl shadow-lg text-white z-50 flex items-center gap-2 animate-bounce-in ${notification.type==='error'?'bg-red-500':'bg-green-500'}`}>
           {notification.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5"/>}
           {notification.msg}
        </div>
      )}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        {view === 'home' && (
            <Dashboard 
                items={items} 
                viewItem={startPlayer} 
                isLoading={isLoading} 
                permissionError={permErr}
                visitCount={visitCount}
            />
        )}
        
        {view === 'create' && (
            <CreatePage 
                items={items} 
                handleCreate={handleCreate} 
                setView={setView} 
                showNotification={showNotification}
            />
        )}
        
        {view === 'edit' && editItem && (
            <EditPage 
                item={editItem} 
                items={items} 
                handleUpdate={handleUpdate} 
                setView={setView} 
                showNotification={showNotification}
            />
        )}
        
        {view === 'view' && activeItem && (
            <PlayerView 
                activeItem={activeItem} 
                allItems={items}
                setView={setView} 
            />
        )}
        
        {view === 'login' && <LoginView onLogin={handleLogin} />}
        
        {view === 'admin' && (
            <AdminPanel 
                items={items} 
                handleDelete={handleDelete} 
                openEdit={(item) => { setEditItem(item); setView('edit'); }} 
                handleImport={handleImport} 
                handleExport={handleExport}
                setView={setView}
            />
        )}
      </main>
    </div>
  );
}