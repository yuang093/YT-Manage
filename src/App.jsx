import React, { useState, useEffect, useRef } from 'react';
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
  Search, // 新增 Search 圖示
  Sun,    // 新增 Sun 圖示
  Moon    // 新增 Moon 圖示
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';

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
const generateId = () => Math.random().toString(36).substr(2, 9);
const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
};
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const getVideoUrl = (item) => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.url;
};
const getVideoTitle = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.title && item.title.trim() !== '' ? item.title : item.url;
};

// Fisher-Yates 洗牌演算法
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- CSV ---
const arrayToCSV = (items) => {
  const headers = ['id', 'type', 'title', 'description', 'url', 'urls', 'createdAt', 'visits', 'downloads'];
  const csvRows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (header === 'urls') val = JSON.stringify(val || []); 
      if (val === undefined || val === null) val = '';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });
  return [headers.join(','), ...csvRows].join('\n');
};
const csvToArray = (csvText) => {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1] !== undefined) values.push(match[1].replace(/""/g, '"'));
      else values.push(match[2]);
    }
    if (values.length === 0) continue;
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index];
      if (val === undefined) val = '';
      if (header === 'urls') { try { val = JSON.parse(val); } catch(e) { val = []; } } 
      else if (['createdAt', 'visits', 'downloads'].includes(header)) val = Number(val) || 0;
      obj[header] = val;
    });
    if (obj.title || obj.url) result.push(obj);
  }
  return result;
};

// --- UI ---
const Header = ({ setView, isAdmin, handleLogout, isLoading, isDarkMode, toggleTheme }) => (
  <nav className="bg-red-600 dark:bg-red-900 text-white shadow-md transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
          <Youtube className="w-8 h-8 mr-2" />
          <span className="font-bold text-xl tracking-tight">YT 管理大師</span>
          {isLoading && <span className="ml-3 flex items-center text-xs bg-red-700 dark:bg-red-950 px-2 py-1 rounded text-white opacity-80"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> 同步中...</span>}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-red-700 dark:hover:bg-red-800 transition-colors focus:outline-none"
            title={isDarkMode ? "切換亮色模式" : "切換深色模式"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button onClick={() => setView('create')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">新增頁面</span>
          </button>
          {isAdmin ? (
            <div className="flex items-center space-x-2">
               <button onClick={() => setView('admin')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
                <Settings className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">後台</span>
              </button>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium bg-red-800 dark:bg-red-950 hover:bg-red-900 dark:hover:bg-red-900 flex items-center transition-colors">
                <LogOut className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">登出</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setView('login')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
              <Lock className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">管理員</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Dashboard = ({ items, viewItem, isLoading, permissionError }) => {
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState(''); // 搜尋關鍵字狀態

  const safeItems = items || [];
  const stats = {
    totalItems: safeItems.length,
    totalVisits: safeItems.reduce((acc, curr) => acc + (curr.visits || 0), 0),
    totalDownloads: safeItems.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
    playlists: safeItems.filter(i => i.type === 'playlist').length,
    singles: safeItems.filter(i => i.type === 'single').length,
  };

  // 結合篩選與搜尋
  const filteredItems = safeItems.filter(item => {
    // 類型篩選
    const matchesFilter = filter === 'all' || item.type === filter;
    
    // 搜尋過濾 (標題或說明)
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = item.title?.toLowerCase().includes(lowerSearch) || 
                          item.description?.toLowerCase().includes(lowerSearch);

    return matchesFilter && matchesSearch;
  });

  const renderEmptyState = () => {
    if (permissionError) {
      return (
        <div className="text-red-500 dark:text-red-400 flex flex-col items-center p-4 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20">
          <ShieldAlert className="w-8 h-8 mb-2"/>
          <span className="font-bold">權限不足：無法讀取資料庫</span>
          <span className="text-sm mt-1">請至 Firebase Console → Firestore → Rules 將權限設為 true，並至 Authentication 開啟 Anonymous。</span>
        </div>
      );
    }
    if (isLoading) return <div className="flex items-center justify-center text-gray-500 dark:text-gray-400"><Loader2 className="w-5 h-5 mr-2 animate-spin"/> 正在連線至雲端資料庫...</div>;
    if (safeItems.length === 0) return <div className="text-gray-500 dark:text-gray-400">目前雲端資料庫是空的，請點擊右上角「新增頁面」開始建立。</div>;
    if (filteredItems.length === 0) return <div className="text-gray-500 dark:text-gray-400">找不到符合「{searchTerm}」的資料。</div>;
    return <div className="text-gray-500 dark:text-gray-400">此分類目前沒有資料。</div>;
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500 dark:border-blue-600 transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm">總項目數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-green-500 dark:border-green-600 transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm">總訪問次數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVisits}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-purple-500 dark:border-purple-600 transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm">總下載/點擊</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-yellow-500 dark:border-yellow-600 transition-colors">
          <div className="text-gray-500 dark:text-gray-400 text-sm">清單 / 單曲</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.playlists} / {stats.singles}</div>
        </div>
      </div>
      
      {/* 搜尋與過濾區 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* 分類按鈕 */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
             {['all', 'single', 'playlist'].map(type => (
               <button key={type} onClick={() => setFilter(type)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === type ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                 {type === 'all' ? '全部' : type === 'single' ? '單曲' : '播放清單'}
               </button>
             ))}
          </div>

          {/* 搜尋框 */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="搜尋標題或說明..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">{renderEmptyState()}</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map(item => (
              <li key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center flex-1 cursor-pointer" onClick={() => viewItem(item)}>
                    <div className={`p-2 rounded-full mr-4 ${item.type === 'playlist' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      {item.type === 'playlist' ? <List size={20} /> : <Youtube size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-6">
                    <span className="flex items-center" title="訪問次數"><Eye size={14} className="mr-1"/> {item.visits || 0}</span>
                    <span className="flex items-center" title="下載次數"><Download size={14} className="mr-1"/> {item.downloads || 0}</span>
                    <span className="hidden sm:inline">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const CreatePage = ({ items, handleCreate, setView, showNotification }) => {
  const [type, setType] = useState('single');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [manualItems, setManualItems] = useState([{title: '', url: ''}]); 
  const [selectedExistingIds, setSelectedExistingIds] = useState([]); 
  const existingSingles = items.filter(i => i.type === 'single');

  const handleManualItemChange = (index, field, value) => {
    const newItems = [...manualItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualItems(newItems);
  };
  const addPlaylistField = () => setManualItems([...manualItems, {title: '', url: ''}]);
  const removePlaylistField = (index) => {
    const newItems = manualItems.filter((_, i) => i !== index);
    setManualItems(newItems);
  };
  const toggleSelection = (itemId) => {
    if (selectedExistingIds.includes(itemId)) setSelectedExistingIds(selectedExistingIds.filter(id => id !== itemId));
    else setSelectedExistingIds([...selectedExistingIds, itemId]);
  };
  const handleSelectAll = () => {
    if (selectedExistingIds.length === existingSingles.length) setSelectedExistingIds([]);
    else setSelectedExistingIds(existingSingles.map(i => i.id));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'single') {
      if (!getYouTubeID(url)) return showNotification('無效的 YouTube 連結', 'error');
      handleCreate({ type, title, description, url });
    } else {
      const validManualItems = manualItems.filter(item => getYouTubeID(item.url)).map(item => ({ url: item.url, title: item.title || item.url }));
      const selectedItems = existingSingles.filter(item => selectedExistingIds.includes(item.id)).map(item => ({ url: item.url, title: item.title }));
      const finalItems = [...validManualItems, ...selectedItems];
      if (finalItems.length === 0) return showNotification('請至少輸入或選擇一個有效的 YouTube 連結', 'error');
      handleCreate({ type, title, description, urls: finalItems });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">建立新頁面</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">類型</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center cursor-pointer text-gray-900 dark:text-gray-100">
              <input type="radio" className="form-radio text-red-600" name="type" value="single" checked={type === 'single'} onChange={() => setType('single')} />
              <span className="ml-2">單一連結</span>
            </label>
            <label className="inline-flex items-center cursor-pointer text-gray-900 dark:text-gray-100">
              <input type="radio" className="form-radio text-red-600" name="type" value="playlist" checked={type === 'playlist'} onChange={() => setType('playlist')} />
              <span className="ml-2">播放清單</span>
            </label>
          </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">主旨 (標題)</label>
            <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">說明</label>
            <textarea className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>
        
        {type === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">YouTube 連結</label>
            <input required type="url" placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">從現有單曲庫選擇 (智慧勾選)</label>
                {existingSingles.length > 0 && (
                  <button type="button" onClick={handleSelectAll} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center">
                    {selectedExistingIds.length === existingSingles.length ? '取消全選' : `全選 (${existingSingles.length})`}
                  </button>
                )}
              </div>
              {existingSingles.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">目前沒有已建立的單曲。</p> : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingSingles.map(item => (
                    <div key={item.id} className={`flex items-center p-2 rounded cursor-pointer border ${selectedExistingIds.includes(item.id) ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`} onClick={() => toggleSelection(item.id)}>
                      <div className={`mr-2 ${selectedExistingIds.includes(item.id) ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>{selectedExistingIds.includes(item.id) ? <CheckSquare size={20}/> : <Square size={20}/>}</div>
                      <span className="text-sm truncate text-gray-900 dark:text-gray-100">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">或手動輸入 (可直接輸入新歌)</label>
              {manualItems.map((item, idx) => (
                <div key={idx} className="flex mb-2 space-x-2">
                  <input type="text" placeholder="影片標題 (選填)" className="w-1/3 rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500" value={item.title} onChange={e => handleManualItemChange(idx, 'title', e.target.value)} />
                  <input type="url" placeholder="YouTube 連結" className="flex-1 rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500" value={item.url} onChange={e => handleManualItemChange(idx, 'url', e.target.value)} />
                  <button type="button" onClick={() => removePlaylistField(idx)} className="bg-gray-100 dark:bg-gray-600 px-3 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={addPlaylistField} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium flex items-center mt-2"><Plus size={16} className="mr-1"/> 新增欄位</button>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setView('home')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">取消</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">建立</button>
        </div>
      </form>
    </div>
  );
};

const EditPage = ({ item, items, handleUpdate, setView, showNotification }) => {
  const [type, setType] = useState(item.type);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [url, setUrl] = useState(item.type === 'single' ? item.url : '');
  const [manualItems, setManualItems] = useState(() => {
    if (item.type === 'playlist' && Array.isArray(item.urls)) return item.urls.map(u => typeof u === 'string' ? {title: '', url: u} : u);
    return [{title: '', url: ''}];
  });
  const existingSingles = items.filter(i => i.type === 'single');
  const [selectedExistingIds, setSelectedExistingIds] = useState([]); 
  
  useEffect(() => { if (type === 'playlist' && manualItems.length === 0) setManualItems([{title: '', url: ''}]); }, []);
  const handleManualItemChange = (index, field, value) => { const n = [...manualItems]; n[index] = { ...n[index], [field]: value }; setManualItems(n); };
  const addPlaylistField = () => setManualItems([...manualItems, {title: '', url: ''}]);
  const removePlaylistField = (index) => setManualItems(manualItems.filter((_, i) => i !== index));
  const toggleSelection = (id) => { if (selectedExistingIds.includes(id)) setSelectedExistingIds(selectedExistingIds.filter(x => x !== id)); else setSelectedExistingIds([...selectedExistingIds, id]); };
  const handleSelectAll = () => { if (selectedExistingIds.length === existingSingles.length) setSelectedExistingIds([]); else setSelectedExistingIds(existingSingles.map(i => i.id)); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'single') {
      if (!getYouTubeID(url)) return showNotification('無效 URL', 'error');
      handleUpdate({ ...item, type, title, description, url });
    } else {
      const m = manualItems.filter(u => getYouTubeID(u.url)).map(i => ({url: i.url, title: i.title || i.url}));
      const s = existingSingles.filter(i => selectedExistingIds.includes(i.id)).map(i => ({url: i.url, title: i.title}));
      const f = [...m, ...s];
      if (f.length === 0) return showNotification('至少需一個連結', 'error');
      handleUpdate({ ...item, type, title, description, urls: f });
    }
  };
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white"><Edit className="mr-2" /> 修改</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
         <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">主旨</label><input required type="text" className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} /></div>
         <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">說明</label><textarea className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea></div>
         {type === 'single' ? (
           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label><input required type="url" className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={url} onChange={e => setUrl(e.target.value)} /></div>
         ) : (
           <div className="space-y-4">
             <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border rounded border-gray-200 dark:border-gray-600">
               <div className="flex justify-between mb-2"><label className="text-gray-700 dark:text-gray-300">從庫選擇</label><button type="button" onClick={handleSelectAll} className="text-indigo-600 dark:text-indigo-400 text-sm">{selectedExistingIds.length === existingSingles.length ? '取消全選' : '全選'}</button></div>
               <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">{existingSingles.map(i => (<div key={i.id} onClick={() => toggleSelection(i.id)} className={`cursor-pointer p-2 border rounded flex items-center ${selectedExistingIds.includes(i.id)?'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700':'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}><div className="mr-2 text-red-600 dark:text-red-400">{selectedExistingIds.includes(i.id)?<CheckSquare size={16}/>:<Square size={16}/>}</div><span className="truncate text-sm text-gray-900 dark:text-gray-100">{i.title}</span></div>))}</div>
             </div>
             <div><label className="text-gray-700 dark:text-gray-300">編輯列表</label>{manualItems.map((m, i) => (<div key={i} className="flex mb-2 gap-2"><input placeholder="標題" className="w-1/3 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={m.title} onChange={e=>handleManualItemChange(i,'title',e.target.value)}/><input placeholder="URL" className="flex-1 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={m.url} onChange={e=>handleManualItemChange(i,'url',e.target.value)}/><button type="button" onClick={()=>removePlaylistField(i)} className="px-3 bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300"><X size={16}/></button></div>))}<button type="button" onClick={addPlaylistField} className="text-red-600 dark:text-red-400 text-sm flex items-center"><Plus size={16}/> 新增</button></div>
           </div>
         )}
         <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setView('admin')} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">取消</button><button type="submit" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600">儲存</button></div>
      </form>
    </div>
  );
};

const PlayerView = ({ item, setView, recordDownload }) => {
  const [idx, setIdx] = useState(0);
  const [shuffle, setShuffle] = useState(true); 
  const [vList, setVList] = useState([]);
  const [audio, setAudio] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  
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
    if (item.type === 'single') setVList([item.url]); 
    else setVList(item.urls); 
    setIdx(0); 
    setIsPlaying(false);
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

  // 初始化播放器
  useEffect(() => {
    if (isApiReady && videoId && containerRef.current) {
      if (playerRef.current) {
        // 如果只是換歌，直接 loadVideoById 比較順暢
        if (typeof playerRef.current.loadVideoById === 'function') {
           playerRef.current.loadVideoById(videoId);
           return; 
        } else {
           playerRef.current.destroy(); // Fallback
        }
      }

      const onStateChange = (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
          setIsPlaying(true);
          setDuration(playerRef.current.getDuration());
          if(progressInterval.current) clearInterval(progressInterval.current);
          progressInterval.current = setInterval(() => {
             setCurrentTime(playerRef.current.getCurrentTime());
          }, 1000);
        } else {
          if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          if (event.data === window.YT.PlayerState.ENDED) {
             setIsPlaying(false);
             // 3. 行動裝置連續播放 (自動觸發)
             if (nextRef.current) nextRef.current(); 
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
          'playsinline': 1, // 3. 相容 iOS
          'disablekb': 1,
          'fs': 0,
          'rel': 0,
          'iv_load_policy': 3 // 隱藏註釋
        },
        events: {
          'onStateChange': onStateChange,
          'onReady': (e) => {
             setDuration(e.target.getDuration());
             e.target.setVolume(volume); // 設定初始音量
             e.target.playVideo(); 
          }
        }
      });
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isApiReady, videoId]);

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

  // 7. 隨機播放邏輯 (使用 shuffledIndices)
  const next = () => {
    if (shuffle) {
      // 在 shuffledIndices 中找到當前 idx 的位置，然後往下一個
      const currentPos = shuffledIndices.indexOf(idx);
      const nextPos = (currentPos + 1) % shuffledIndices.length;
      setIdx(shuffledIndices[nextPos]);
    } else {
      setIdx(prevIdx => (prevIdx + 1) % vList.length);
    }
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
          <button onClick={()=>setView('home')} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><SkipBack size={16} className="mr-1"/> 返回列表</button>
          
          {/* 2. 純音樂模式切換 (顯示/隱藏影片，不中斷播放) */}
          <button 
            onClick={()=>setAudio(!audio)} 
            className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${audio ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {audio ? <Music size={16} className="mr-1" /> : <Youtube size={16} className="mr-1" />}
            {audio ? '純音樂模式 (省電)' : '顯示影片畫面'}
          </button>
      </div>

      {/* 播放器容器 (3. 純音樂模式自動縮小) */}
      <div ref={containerRef} className={`relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-500 ease-in-out ${audio ? 'h-32' : 'aspect-video'}`}>
         {/* API 掛載點 - 始終存在，控制 opacity 隱藏 */}
         <div id="yt-player" className={`w-full h-full absolute inset-0 ${audio ? 'opacity-0' : 'opacity-100'}`}></div>
         
         {/* Audio 遮罩 */}
         <div className={`absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center text-white pointer-events-none transition-opacity duration-300 ${audio ? 'opacity-100' : 'opacity-0'}`}>
             <Music size={32} className={`mb-2 ${isPlaying ? 'animate-pulse text-green-400' : 'text-gray-500'}`}/>
             <p className="text-gray-300 text-sm font-medium truncate max-w-xs px-4">{curTitle}</p>
         </div>
      </div>

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
               <div className="flex items-center group relative">
                  <button onClick={toggleMute} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    {volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                  </button>
                  <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-600 dark:accent-gray-400 ml-1"
                    />
                  </div>
               </div>

               {item.type === 'playlist' && (
                 <>
                   <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                   <button onClick={()=>setShuffle(!shuffle)} className={`p-2 rounded-full transition ${shuffle?'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400':'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`} title={shuffle?"隨機播放開啟":"隨機播放關閉"}><Shuffle size={20}/></button>
                   <button onClick={prev} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><SkipBack size={20}/></button>
                   <button onClick={next} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><SkipForward size={20}/></button>
                 </>
               )}
             </div>
         </div>
      </div>

      {/* 詳細資訊與清單 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <div className="flex justify-between items-start">
          <div><h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h1><p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{item.description}</p></div>
          <button onClick={openLink} className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center"><ExternalLink size={18} className="mr-2"/> 原始連結</button>
        </div>
        
        {item.type === 'playlist' && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-bold flex mb-4 text-gray-700 dark:text-gray-300"><List size={18} className="mr-2"/> 播放清單 ({vList.length})</h3>
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

const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-900/30 flex justify-between">
       <div className="flex gap-4 text-xs font-bold text-blue-800 dark:text-blue-300 items-center">
         <span className="flex items-center text-green-600 dark:text-green-400"><Cloud size={12} className="mr-1"/> 雲端模式</span>
         <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircle size={12} className="mr-1"/> 連線正常</span>
         <span className="text-gray-400 dark:text-gray-500 font-mono">ID: yt-manager-global</span>
       </div>
    </div>
    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between"><h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white"><List className="mr-2"/> 管理</h2><div className="flex gap-2"><label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"><Upload size={16} className="mr-2"/> 匯入<input type="file" className="hidden" accept=".csv" onChange={handleImport}/></label><button onClick={handleExport} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"><Download size={16} className="mr-2"/> 匯出</button></div></div>
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">標題</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">類型</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">數據</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th></tr></thead><tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{items.map(i=>(<tr key={i.id}><td className="px-6 py-4"><div className="text-sm font-medium text-gray-900 dark:text-white">{i.title}</div></td><td className="px-6 py-4"><span className={`px-2 text-xs rounded-full ${i.type==='playlist'?'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400':'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'}`}>{i.type==='playlist'?'清單':'單曲'}</span></td><td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{i.visits||0}/{i.downloads||0}</td><td className="px-6 py-4 text-right space-x-2"><button onClick={()=>openEdit(i)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"><Edit size={16}/></button><button onClick={()=>handleDelete(i.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"><Trash2 size={16}/></button></td></tr>))}</tbody></table>
  </div>
);

const LoginView = ({ onLogin, setView }) => {
  const [p, setP] = useState('');
  return <div className="flex justify-center py-12"><div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded shadow-lg transition-colors"><div><h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">管理員登入</h2></div><form className="mt-8 space-y-6" onSubmit={e=>{e.preventDefault();onLogin(p)}}><div className="rounded-md shadow-sm -space-y-px"><div><label htmlFor="password" className="sr-only">Password</label><input id="password" name="password" type="password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm bg-white dark:bg-gray-700" placeholder="請輸入管理密碼" value={p} onChange={e=>setP(e.target.value)} /></div></div><div><button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">登入</button></div><div className="text-center mt-2"><button type="button" onClick={()=>setView('home')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">返回首頁</button></div></form></div></div>;
};

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
  // 深色模式狀態
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
      <Header setView={setView} isAdmin={isAdmin} handleLogout={handleLogout} isLoading={isLoading} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>
      {notification && <div className={`fixed top-4 right-4 p-4 rounded shadow text-white z-50 ${notification.type==='error'?'bg-red-500':'bg-green-500'}`}>{notification.msg}</div>}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {view === 'home' && <Dashboard items={items} viewItem={viewItem} isLoading={isLoading} permissionError={permErr}/>}
        {view === 'create' && <CreatePage items={items} handleCreate={handleCreate} setView={setView} showNotification={showNotification}/>}
        {view === 'edit' && editItem && <EditPage item={editItem} items={items} handleUpdate={handleUpdate} setView={setView} showNotification={showNotification}/>}
        {view === 'view' && activeItem && <PlayerView item={activeItem} setView={setView} recordDownload={recordDownload}/>}
        {view === 'login' && <LoginView onLogin={handleLogin} setView={setView}/>}
        {view === 'admin' && <AdminPanel items={items} handleDelete={handleDelete} openEdit={openEdit} handleImport={handleImport} handleExport={handleExport}/>}
      </main>
      
      {/* 底部狀態列 (包含訪客計數) */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
         <div className="px-3 py-1 bg-white dark:bg-gray-800 shadow rounded-full text-xs flex items-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
           <Cloud size={12} className="mr-1 text-blue-500 dark:text-blue-400"/> 雲端模式
         </div>
         <div className="px-3 py-1 bg-white dark:bg-gray-800 shadow rounded-full text-xs flex items-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
           <User size={12} className="mr-1 text-purple-500 dark:text-purple-400"/> 訪客數: {visitorCount}
         </div>
      </div>
    </div>
  );
}