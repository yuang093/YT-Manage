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
  Users,
  FileType
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, getDoc, increment } from 'firebase/firestore';

// ============================================================================
// Firebase 設定
// ============================================================================
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAf9E7Q5re8A09k-N7moPC_pkjqvVWOBbg",
  authDomain: "yt-manager-995a5.firebaseapp.com",
  projectId: "yt-manager-995a5",
  storageBucket: "yt-manager-995a5.firebasestorage.app",
  messagingSenderId: "188108532520",
  appId: "1:188108532520:web:76f89808fa5e919bc1be1d"
};

const app = initializeApp(YOUR_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// 工具函式
// ============================================================================

// 修正後的 ID 解析，支援更多格式
const getYouTubeId = (url) => {
  if (!url) return null;
  // 如果已經是 ID (11碼且無特殊符號)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 強大的 CSV 解析器 (處理引號與逗號)
const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuote = false;
  
  // 簡單清理 BOM
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // 跳過下一個引號
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++; // 處理 \r\n
      currentRow.push(currentVal);
      if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
         rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
};

// ============================================================================
// 元件：Header
// ============================================================================
const Header = ({ setView, isAdmin, handleLogout, isLoading, view }) => (
  <header className="bg-white shadow-sm sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
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
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700" title="登出">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </header>
);

// ============================================================================
// 元件：Dashboard
// ============================================================================
const Dashboard = ({ items, viewItem, isLoading, permissionError, visitCount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="搜尋播放清單或歌曲..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
             <List className="w-4 h-4" />
          </div>
        </div>
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
                  onError={(e) => e.target.src = 'https://placehold.co/600x400?text=No+Image'}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all shadow-lg">
                    <Play className="w-5 h-5 text-red-600 ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{item.title}</h3>
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
// 元件：CreatePage
// ============================================================================
const CreatePage = ({ items, handleCreate, setView, showNotification }) => {
  const [url, setUrl] = useState('');
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
    handleCreate({
        title: manualTitle,
        artist: manualArtist || 'Unknown',
        youtubeId: videoId,
        category: 'General'
    });
    setView('home');
  };

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
            {isUrlInLibrary && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> 此歌曲已在庫中
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
              <input 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="輸入歌曲標題"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">演出者 (選填)</label>
              <input 
                value={manualArtist}
                onChange={(e) => setManualArtist(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="輸入演出者"
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
             <button onClick={() => setView('home')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">取消</button>
            <button 
              onClick={handleManualAdd}
              disabled={!url || !manualTitle}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 shadow-md"
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
// 元件：PlayerView
// ============================================================================
const PlayerView = ({ activeItem, allItems, setView }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    if (activeItem && allItems.length > 0) {
      setPlaylist(allItems);
      const idx = allItems.findIndex(i => i.id === activeItem.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [activeItem, allItems]);

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
         // 確保有有效的 ID，否則跳下一首
         if (!currentVideo || !currentVideo.youtubeId) {
             console.warn("Invalid Video ID, skipping");
             return;
         }

         if (player) {
           player.loadVideoById(currentVideo.youtubeId);
           return;
         }

         new window.YT.Player('youtube-player', {
           height: '100%',
           width: '100%',
           videoId: currentVideo.youtubeId,
           playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 1, 'rel': 0, 'fs': 1 },
           events: {
             'onReady': (event) => {
                setPlayer(event.target);
                event.target.setVolume(volume);
                setIsPlaying(true);
             },
             'onStateChange': (event) => {
                if (event.data === 1) setIsPlaying(true);
                if (event.data === 2) setIsPlaying(false);
                if (event.data === 0) handleNext(); // Auto play next
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
    if (player && playlist[currentIndex]?.youtubeId) {
      player.loadVideoById(playlist[currentIndex].youtubeId);
      setIsPlaying(true);
    }
  }, [currentIndex, player]);

  useEffect(() => {
    if (player) player.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, player]);

  const togglePlay = () => {
    if (!player) return;
    isPlaying ? player.pauseVideo() : player.playVideo();
    setIsPlaying(!isPlaying);
  };

  const handleNext = useCallback(() => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) nextIndex = 0;
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
      <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Now Playing</span>
          <h3 className="font-medium text-sm sm:text-base line-clamp-1">{currentSong.title}</h3>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className={`relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-500 ${!showVideo ? 'opacity-0 h-0 w-0 absolute' : 'opacity-100'}`}>
          <div id="youtube-player" className="w-full h-full"></div>
        </div>
        {!showVideo && (
           <div className="text-center text-white animate-pulse">
             <Music className="w-32 h-32 mx-auto mb-4 text-red-500" />
             <h2 className="text-2xl font-bold">{currentSong.title}</h2>
             <p className="text-gray-400">{currentSong.artist}</p>
             <p className="mt-4 text-sm text-gray-500">純音樂模式</p>
           </div>
        )}
      </div>

      <div className="bg-gray-900 text-white p-6 pb-8 rounded-t-3xl border-t border-gray-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold line-clamp-1 mb-1">{currentSong.title}</h2>
              <p className="text-gray-400 text-sm">{currentSong.artist || 'YouTube Music'}</p>
            </div>
            <button 
                onClick={() => setShowVideo(!showVideo)}
                className={`p-2 rounded-full transition-colors ${!showVideo ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                title={showVideo ? "切換至純音樂模式" : "顯示影片"}
            >
              {showVideo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <button onClick={handleShuffleJump} className="text-gray-400 hover:text-white transition-colors p-2"><Shuffle className="w-5 h-5" /></button>
            <button onClick={handlePrev} className="text-white hover:text-red-500 transition-colors p-2"><SkipBack className="w-8 h-8" /></button>
            <button onClick={togglePlay} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10">
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button onClick={handleNext} className="text-white hover:text-red-500 transition-colors p-2"><SkipForward className="w-8 h-8" /></button>
            <button className="text-gray-400 hover:text-white transition-colors p-2"><Repeat className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center gap-4 text-gray-400 max-w-sm mx-auto">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" min="0" max="100" 
              value={isMuted ? 0 : volume} 
              onChange={(e) => { setVolume(parseInt(e.target.value)); setIsMuted(false); }}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 元件：AdminPanel
// ============================================================================
const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport, setView }) => {
  const [useBig5, setUseBig5] = useState(false);

  const onFileChange = (e) => {
    handleImport(e, useBig5);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          歌曲管理 ({items.length})
        </h2>
        
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full sm:w-auto">
           {/* 編碼選擇，解決亂碼問題 */}
           <label className="flex items-center gap-2 text-sm text-gray-600 bg-white px-2 py-1 rounded border">
             <input 
               type="checkbox" 
               checked={useBig5} 
               onChange={(e) => setUseBig5(e.target.checked)} 
               className="rounded text-red-600 focus:ring-red-500"
             />
             解決中文亂碼 (Big5)
           </label>

           <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium">
              <Upload className="w-4 h-4" />
              匯入 CSV
              <input 
                type="file" 
                accept=".csv" 
                onChange={onFileChange} 
                className="hidden" 
                key={useBig5 ? 'big5' : 'utf8'} // Force re-render input to clear selection
              />
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
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
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
// 元件：LoginView & EditPage
// ============================================================================
const LoginView = ({ onLogin }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
       <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
         <Music className="w-8 h-8 text-red-600" />
       </div>
       <h2 className="text-2xl font-bold mb-2">歡迎回來</h2>
       <p className="text-gray-500 mb-8">請登入以管理您的音樂庫</p>
       <button onClick={onLogin} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 shadow-lg flex items-center justify-center gap-2">
         <LogOut className="w-5 h-5" /> 匿名登入
       </button>
    </div>
  </div>
);

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
                <input className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="標題"/>
                <input className="w-full p-2 border rounded" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} placeholder="演出者"/>
                <input className="w-full p-2 border rounded text-gray-500" value={formData.youtubeId} disabled placeholder="ID (不可編輯)"/>
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
  const [visitCount, setVisitCount] = useState(0);

  const DB_APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-yt-app';

  useEffect(() => {
    const initAuth = async () => {
       try { await signInAnonymously(auth); } catch(e) { console.error("Auth Error:", e); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(!!u);
      setIsLoading(false);
      if (u) updateVisitCount();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs');
    const unsub = onSnapshot(q, 
      (snapshot) => setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => setPermErr("讀取資料失敗 (Rule 1)")
    );
    return () => unsub();
  }, [user]);

  const updateVisitCount = async () => {
    const statsRef = doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'stats', 'global');
    try {
        const snap = await getDoc(statsRef);
        if (snap.exists()) setVisitCount(snap.data().visits || 0);
        if (!sessionStorage.getItem('visited')) {
             snap.exists() ? await updateDoc(statsRef, { visits: increment(1) }) : await setDoc(statsRef, { visits: 1 });
             setVisitCount(prev => prev + 1);
             sessionStorage.setItem('visited', 'true');
        }
    } catch (e) { console.log(e); }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = async (data) => {
    if (!user) return;
    try {
      const newRef = doc(collection(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs'));
      await setDoc(newRef, { ...data, createdAt: new Date().toISOString(), createdBy: user.uid });
      showNotification('新增成功');
    } catch (error) { showNotification('新增失敗', 'error'); }
  };

  const handleUpdate = async (id, data) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs', id), data);
    } catch (error) { showNotification('更新失敗', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除嗎？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', DB_APP_ID, 'public', 'data', 'songs', id));
      showNotification('已刪除');
    } catch (error) { showNotification('刪除失敗', 'error'); }
  };

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

  // 重寫：支援 Big5、支援新舊格式、自動轉換 ID
  const handleImport = (e, useBig5) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // 如果使用者勾選 Big5，則用 big5 編碼讀取
    reader.readAsText(file, useBig5 ? 'big5' : 'utf-8');
    
    reader.onload = (evt) => {
      const text = evt.target.result;
      const rows = parseCSV(text); // 使用新的 parser
      
      if (rows.length < 2) {
          showNotification('CSV 檔案格式錯誤或為空', 'error');
          return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      let count = 0;

      // 偵測是否為舊格式 (包含 'url' 欄位)
      const isOldFormat = headers.includes('url') && headers.includes('title');
      const isNewFormat = headers.includes('youtube id') || (headers.includes('title') && headers.includes('artist'));

      // 欄位索引 mapping
      let idxTitle = -1, idxArtist = -1, idxUrl = -1, idxId = -1, idxDesc = -1;

      if (isOldFormat) {
          idxTitle = headers.indexOf('title');
          idxUrl = headers.indexOf('url');
          idxDesc = headers.indexOf('description'); // 舊格式通常把資訊放在 description
      } else if (isNewFormat) {
          idxTitle = headers.indexOf('title');
          idxArtist = headers.indexOf('artist');
          idxId = headers.findIndex(h => h.includes('id') && h.includes('youtube'));
      }

      rows.slice(1).forEach(cols => {
        if (cols.length < 2) return;

        let title = '', artist = '', youtubeId = '';

        if (isOldFormat) {
            title = cols[idxTitle] || 'Unknown Title';
            const urlVal = cols[idxUrl] || '';
            // 自動從 URL 轉 ID
            youtubeId = getYouTubeId(urlVal);
            // 舊格式 artist 常常混在 description，若無 description 則用 title 的一部分或 Unknown
            artist = cols[idxDesc] || 'Unknown Artist';
        } else {
            title = cols[idxTitle];
            artist = cols[idxArtist] || 'Unknown';
            youtubeId = cols[idxId];
            // 若新格式欄位是 URL，也嘗試轉換
            if (youtubeId && youtubeId.includes('http')) {
                youtubeId = getYouTubeId(youtubeId);
            }
        }

        if (title && youtubeId) {
          handleCreate({
             title: title.replace(/^"|"$/g, '').trim(), // 去除可能殘留的引號
             artist: artist.replace(/^"|"$/g, '').trim(),
             youtubeId: youtubeId,
             category: 'Imported'
          });
          count++;
        }
      });
      
      if (count > 0) {
          showNotification(`已排程匯入 ${count} 首歌 (若文字仍是亂碼，請勾選 Big5 重試)`);
      } else {
          showNotification(`匯入失敗：找不到有效歌曲，請確認 CSV 格式`, 'error');
      }
    };
  };

  const handleLogin = async () => { try { await signInAnonymously(auth); } catch (e) { showNotification('登入失敗', 'error'); } };
  const handleLogout = () => { signOut(auth); setView('login'); };
  const startPlayer = (clickedItem) => { setActiveItem(clickedItem); setView('view'); };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header setView={setView} isAdmin={isAdmin} handleLogout={handleLogout} isLoading={isLoading} view={view} />
      {notification && (
        <div className={`fixed top-20 right-4 p-4 rounded-xl shadow-lg text-white z-50 flex items-center gap-2 animate-bounce-in ${notification.type==='error'?'bg-red-500':'bg-green-500'}`}>
           {notification.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5"/>}
           {notification.msg}
        </div>
      )}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        {view === 'home' && <Dashboard items={items} viewItem={startPlayer} isLoading={isLoading} permissionError={permErr} visitCount={visitCount} />}
        {view === 'create' && <CreatePage items={items} handleCreate={handleCreate} setView={setView} showNotification={showNotification} />}
        {view === 'edit' && editItem && <EditPage item={editItem} items={items} handleUpdate={handleUpdate} setView={setView} showNotification={showNotification} />}
        {view === 'view' && activeItem && <PlayerView activeItem={activeItem} allItems={items} setView={setView} />}
        {view === 'login' && <LoginView onLogin={handleLogin} />}
        {view === 'admin' && <AdminPanel items={items} handleDelete={handleDelete} openEdit={(item) => { setEditItem(item); setView('edit'); }} handleImport={handleImport} handleExport={handleExport} setView={setView} />}
      </main>
    </div>
  );
}