import React, { useState, useEffect, useRef } from 'react';
import { getYouTubeID, getYouTubeThumbnail, getVideoUrl, getVideoTitle } from './utils/youtube';
import { formatDate, formatDuration } from './utils/format';
import { arrayToCSV, csvToArray } from './utils/csv';
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
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  User,
  Search,
  Sun,
  Moon,
  Heart,
  Clock,
  PlayCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Repeat,
  Repeat1,
  Gauge,
  Timer,
  History,
  ArrowUpDown,
  Trash,
  Monitor,
  Share2,
  Mic,
  BarChart2,
  HelpCircle
} from 'lucide-react';


import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import Header from './components/Header/Header';
import SortDropdown from './components/Dashboard/SortDropdown';
import Dashboard from './components/Dashboard/Dashboard';
import CreatePage from './components/Form/CreatePage';
import EditPage from './components/Form/EditPage';
import AdminPanel from './components/Admin/AdminPanel';
import LoginView from './components/Login/LoginView';
// import PlayerView from './components/Player/PlayerView';

// --- 全局動畫樣式 ---
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeInUp { animation: fadeInUp 0.3s ease-out forwards; }
`;
if (typeof document !== 'undefined') document.head.appendChild(styleEl);

// ============================================================================
// Firebase 設定
// ============================================================================
const YOUR_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAf9E7Q5re8A09k-N7moPC_pkjqvVWOBbg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yt-manager-995a5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yt-manager-995a5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yt-manager-995a5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "188108532520",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:188108532520:web:76f89808fa5e919bc1be1d"
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let appId = 'default-app-id';
let isCloudAvailable = false;
let configSource = 'none';

try {
  let configToUse = null;
  if (YOUR_FIREBASE_CONFIG) {
    configToUse = YOUR_FIREBASE_CONFIG;
    configSource = 'manual';
    appId = 'yt-manager-global'; 
  }
  else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    configToUse = JSON.parse(__firebase_config);
    if (typeof __app_id !== 'undefined') appId = __app_id;
    configSource = 'env';
  } 

  if (configToUse) {
    app = initializeApp(configToUse);
    auth = getAuth(app);
    db = getFirestore(app);
    isCloudAvailable = true;
    console.log(`Firebase init success. Mode: ${configSource}, AppID: ${appId}`);
  }
} catch (e) {
  console.warn("Firebase init failed:", e);
  isCloudAvailable = false;
}

// --- 工具函數 ---
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);


;



// Fisher-Yates 洗牌演算法

// --- CSV ---


// --- UI ---






// --- App ---
export default function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('home');
  const [activeItem, setActiveItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permErr, setPermErr] = useState(false);
  // 6. 訪客計數 (LocalStorage 模擬)
  const [visitorCount, setVisitorCount] = useState(0);
  
  // 新功能：播放歷史
  const [playHistory, setPlayHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('yt_play_history') || '[]');
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  // 新功能：添加播放歷史
  const addToHistory = (item) => {
    const newHistory = [
      { id: item.id, playedAt: Date.now() },
      ...playHistory.filter(h => h.id !== item.id)
    ].slice(0, 20);
    setPlayHistory(newHistory);
    localStorage.setItem('yt_play_history', JSON.stringify(newHistory));
  };
  
  // 新功能：從歷史記錄播放
  const handlePlayFromHistory = (item) => {
    addToHistory(item);
    setActiveItem(item);
    setView('view');
  };
  
  // 收藏功能
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('yt_favorites') || '[]');
    }
    return [];
  });
  
  // 切換收藏
  const toggleFavorite = (itemId) => {
    let newFavorites;
    if (favorites.includes(itemId)) {
      newFavorites = favorites.filter(id => id !== itemId);
    } else {
      newFavorites = [...favorites, itemId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('yt_favorites', JSON.stringify(newFavorites));
  };
  
  // 深色模式狀態
  const [autoDarkMode, setAutoDarkMode] = useState(() => {
    return localStorage.getItem('yt_auto_dark_mode') !== 'false';
  });

  // 自動深夜模式 effect
  useEffect(() => {
    if (!autoDarkMode) return;
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      setIsDarkMode(true);
    }
  }, [autoDarkMode]);

  useEffect(() => {
    localStorage.setItem('yt_auto_dark_mode', autoDarkMode);
  }, [autoDarkMode]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 切換主題
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // 應用主題
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showNotification = (msg, type='success') => { setNotification({msg, type}); setTimeout(()=>setNotification(null), 3000); };

  const handleCreate = async (item) => {
    const newItem = { ...item, id: generateId(), createdAt: Date.now(), visits: 0, downloads: 0 };
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', newItem.id), newItem); showNotification('建立成功'); setView('home'); } catch(e) { showNotification('建立失敗: '+e.message, 'error'); }
  };
  
  const handleUpdate = async (item) => {
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', item.id), item, {merge:true}); showNotification('更新成功'); setEditItem(null); setView('admin'); } catch(e) { showNotification('更新失敗', 'error'); }
  };
  
  const handleDelete = async (id) => {
    if(window.confirm('確認刪除?')) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', id)); showNotification('已刪除'); } catch(e) { showNotification('刪除失敗', 'error'); } }
  };
  
  const handleBatchDelete = async (ids) => {
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', id));
      }
      showNotification(`已刪除 ${ids.length} 筆`);
    } catch(e) { 
      showNotification('批量刪除失敗', 'error'); 
    }
  };
  
  const handleImport = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result.startsWith('\uFEFF') ? evt.target.result.slice(1) : evt.target.result;
      const data = csvToArray(text);
      if(data.length > 0) {
        let count = 0;
        for(const d of data) {
          const id = d.id || generateId();
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', id), {...d, id});
          count++;
        }
        showNotification(`匯入成功 ${count} 筆`);
      } else showNotification('無效資料', 'error');
    };
    reader.readAsText(file);
  };
  
  // 4. CSV 匯出 (檔名日期 + BOM)
  const handleExport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `musiclist_${dateStr}.csv`;
    const url = URL.createObjectURL(new Blob(['\uFEFF'+arrayToCSV(items)], {type:'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); 
    link.href = url; 
    link.download = fileName; 
    link.click();
  };
  
  const viewItem = async (item) => {
    addToHistory(item);
    setActiveItem(item); setView('view');
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', item.id), {visits: (item.visits||0)+1}); } catch(e){}
  };
  
  const recordDownload = async (id) => {
    const item = items.find(i=>i.id===id);
    if(item) try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items', id), {downloads: (item.downloads||0)+1}); } catch(e){}
  };

  const handleLogin = (p) => { 
    if (p === '1qaz2wsx') { 
      setIsAdmin(true); 
      setView('admin'); 
      showNotification('管理員登入成功'); 
    } else {
      showNotification('密碼錯誤', 'error'); 
    }
  };
  
  const handleLogout = () => { 
    setIsAdmin(false); 
    setView('home'); 
    showNotification('已登出'); 
  };
  
  const openEdit = (item) => { 
    setEditItem(item); 
    setView('edit'); 
  };

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch(e) { console.error(e); } };
    initAuth();
    // 6. 訪客計數初始化
    const count = parseInt(localStorage.getItem('yt_visitor_count') || '0') + 1;
    localStorage.setItem('yt_visitor_count', count);
    setVisitorCount(count);
    
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true); setPermErr(false);
      return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'yt_manager_items'), (snap) => {
        const d = snap.docs.map(doc => doc.data()).sort((a,b)=>b.createdAt-a.createdAt);
        setItems(d); setIsLoading(false);
      }, (err) => { setIsLoading(false); if(err.code==='permission-denied') { setPermErr(true); showNotification('權限不足', 'error'); } });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header setView={setView} isAdmin={isAdmin} handleLogout={handleLogout} isLoading={isLoading} isDarkMode={isDarkMode} toggleTheme={toggleTheme} autoDarkMode={autoDarkMode} setAutoDarkMode={setAutoDarkMode}/>
      {notification && <div className={`fixed top-4 right-4 p-4 rounded shadow text-white z-50 ${notification.type==='error'?'bg-red-500':'bg-green-500'}`}>{notification.msg}</div>}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {view === 'home' && <Dashboard items={items} viewItem={viewItem} isLoading={isLoading} permissionError={permErr} favorites={favorites} toggleFavorite={toggleFavorite} playHistory={playHistory} onPlayFromHistory={handlePlayFromHistory}/>}
        {view === 'create' && <CreatePage items={items} handleCreate={handleCreate} setView={setView} showNotification={showNotification}/>}
        {view === 'edit' && editItem && <EditPage item={editItem} items={items} handleUpdate={handleUpdate} setView={setView} showNotification={showNotification}/>}
        {view === 'view' && activeItem && <PlayerView item={activeItem} setView={setView} recordDownload={recordDownload}/>}
        {view === 'login' && <LoginView onLogin={handleLogin} setView={setView}/>}
        {view === 'admin' && <AdminPanel items={items} handleDelete={handleDelete} openEdit={openEdit} handleImport={handleImport} handleExport={handleExport} handleBatchDelete={handleBatchDelete}/>}
      </main>
      
      {/* 底部狀態列 (包含訪客計數) */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
         <div className="px-3 py-1 bg-white dark:bg-gray-800 shadow rounded-full text-xs flex items-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
           <Cloud size={12} className="mr-1 text-blue-500 dark:text-blue-400"/> 雲端模式
         </div>
         <div className="px-3 py-1 bg-white dark:bg-gray-800 shadow rounded-full text-xs flex items-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
           <User size={12} className="mr-1 text-purple-500 dark:text-purple-400"/> 您的造訪次數: {visitorCount}
         </div>
      </div>
    </div>
  );
}