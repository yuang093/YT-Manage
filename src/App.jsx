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
  CheckCircle
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
  // 1. 強制優先使用手動設定
  if (YOUR_FIREBASE_CONFIG) {
    configToUse = YOUR_FIREBASE_CONFIG;
    configSource = 'manual';
    appId = 'yt-manager-global'; 
  }
  // 2. 環境變數
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
const formatDate = (timestamp) => new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
});

// 安全獲取 URL 與 Title，防止 undefined 錯誤
const getVideoUrl = (item) => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.url;
};
const getVideoTitle = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.title && item.title.trim() !== '' ? item.title : item.url;
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
const Header = ({ setView, isAdmin, handleLogout, isLoading }) => (
  <nav className="bg-red-600 text-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
          <Youtube className="w-8 h-8 mr-2" />
          <span className="font-bold text-xl tracking-tight">YT 管理大師</span>
          {isLoading && <span className="ml-3 flex items-center text-xs bg-red-700 px-2 py-1 rounded text-white opacity-80"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> 同步中...</span>}
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('create')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"><Plus className="w-4 h-4 mr-1" /> 新增頁面</button>
          {isAdmin ? (
            <div className="flex items-center space-x-2">
               <button onClick={() => setView('admin')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"><Settings className="w-4 h-4 mr-1" /> 管理後台</button>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium bg-red-800 hover:bg-red-900 flex items-center"><LogOut className="w-4 h-4 mr-1" /> 登出</button>
            </div>
          ) : (
            <button onClick={() => setView('login')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"><Lock className="w-4 h-4 mr-1" /> 管理員</button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Dashboard = ({ items, viewItem, isLoading, permissionError }) => {
  const [filter, setFilter] = useState('all'); 
  const safeItems = items || [];
  const stats = {
    totalItems: safeItems.length,
    totalVisits: safeItems.reduce((acc, curr) => acc + (curr.visits || 0), 0),
    totalDownloads: safeItems.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
    playlists: safeItems.filter(i => i.type === 'playlist').length,
    singles: safeItems.filter(i => i.type === 'single').length,
  };
  const filteredItems = safeItems.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const renderEmptyState = () => {
    if (permissionError) {
      return (
        <div className="text-red-500 flex flex-col items-center p-4 border border-red-200 rounded bg-red-50">
          <ShieldAlert className="w-8 h-8 mb-2"/>
          <span className="font-bold">權限不足：無法讀取資料庫</span>
          <span className="text-sm mt-1">請至 Firebase Console → Firestore → Rules 將權限設為 true，並至 Authentication 開啟 Anonymous。</span>
        </div>
      );
    }
    if (isLoading) return <div className="flex items-center justify-center text-gray-500"><Loader2 className="w-5 h-5 mr-2 animate-spin"/> 正在連線至雲端資料庫...</div>;
    if (safeItems.length === 0) return <div>目前雲端資料庫是空的，請點擊右上角「新增頁面」開始建立。</div>;
    return <div>此分類目前沒有資料。</div>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">總項目數</div>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">總訪問次數</div>
          <div className="text-2xl font-bold">{stats.totalVisits}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-gray-500 text-sm">總下載/點擊</div>
          <div className="text-2xl font-bold">{stats.totalDownloads}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-gray-500 text-sm">清單 / 單曲</div>
          <div className="text-2xl font-bold">{stats.playlists} / {stats.singles}</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
             {['all', 'single', 'playlist'].map(type => (
               <button key={type} onClick={() => setFilter(type)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === type ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                 {type === 'all' ? '全部' : type === 'single' ? '單曲' : '播放清單'}
               </button>
             ))}
          </div>
          <span className="text-xs font-normal text-gray-500 hidden sm:block">點擊標題進入</span>
        </div>
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{renderEmptyState()}</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredItems.map(item => (
              <li key={item.id} className="hover:bg-gray-50 transition duration-150">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center flex-1 cursor-pointer" onClick={() => viewItem(item)}>
                    <div className={`p-2 rounded-full mr-4 ${item.type === 'playlist' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                      {item.type === 'playlist' ? <List size={20} /> : <Youtube size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-6">
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
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">建立新頁面</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">類型</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center cursor-pointer"><input type="radio" className="form-radio text-red-600" name="type" value="single" checked={type === 'single'} onChange={() => setType('single')} /><span className="ml-2">單一連結</span></label>
            <label className="inline-flex items-center cursor-pointer"><input type="radio" className="form-radio text-red-600" name="type" value="playlist" checked={type === 'playlist'} onChange={() => setType('playlist')} /><span className="ml-2">播放清單</span></label>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">主旨 (標題)</label><input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-gray-700">說明</label><textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea></div>
        {type === 'single' ? (
          <div><label className="block text-sm font-medium text-gray-700">YouTube 連結</label><input required type="url" placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={url} onChange={e => setUrl(e.target.value)} /></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium text-gray-700">從現有單曲庫選擇</label>{existingSingles.length > 0 && (<button type="button" onClick={handleSelectAll} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">{selectedExistingIds.length === existingSingles.length ? '取消全選' : `全選 (${existingSingles.length})`}</button>)}</div>
              {existingSingles.length === 0 ? <p className="text-sm text-gray-500">目前沒有已建立的單曲。</p> : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingSingles.map(item => (
                    <div key={item.id} className={`flex items-center p-2 rounded cursor-pointer border ${selectedExistingIds.includes(item.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-100'}`} onClick={() => toggleSelection(item.id)}>
                      <div className={`mr-2 ${selectedExistingIds.includes(item.id) ? 'text-red-600' : 'text-gray-400'}`}>{selectedExistingIds.includes(item.id) ? <CheckSquare size={20}/> : <Square size={20}/>}</div><span className="text-sm truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">或手動輸入</label>
              {manualItems.map((item, idx) => (
                <div key={idx} className="flex mb-2 space-x-2"><input type="text" placeholder="影片標題" className="w-1/3 rounded-md border-gray-300 border p-2 focus:ring-red-500 focus:border-red-500" value={item.title} onChange={e => handleManualItemChange(idx, 'title', e.target.value)} /><input type="url" placeholder="URL" className="flex-1 rounded-md border-gray-300 border p-2 focus:ring-red-500 focus:border-red-500" value={item.url} onChange={e => handleManualItemChange(idx, 'url', e.target.value)} /><button type="button" onClick={() => removePlaylistField(idx)} className="bg-gray-100 px-3 border border-l-0 rounded-r-md hover:bg-gray-200"><X size={16} /></button></div>
              ))}
              <button type="button" onClick={addPlaylistField} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center mt-2"><Plus size={16} className="mr-1"/> 新增欄位</button>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end space-x-3"><button type="button" onClick={() => setView('home')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">建立</button></div>
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
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6"><h2 className="text-2xl font-bold mb-6 flex items-center"><Edit className="mr-2" /> 修改</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
         <div><label className="block text-sm font-medium text-gray-700">主旨</label><input required type="text" className="mt-1 block w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} /></div>
         <div><label className="block text-sm font-medium text-gray-700">說明</label><textarea className="mt-1 block w-full border p-2 rounded" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea></div>
         {type === 'single' ? (
           <div><label className="block text-sm font-medium text-gray-700">URL</label><input required type="url" className="mt-1 block w-full border p-2 rounded" value={url} onChange={e => setUrl(e.target.value)} /></div>
         ) : (
           <div className="space-y-4">
             <div className="bg-gray-50 p-4 border rounded">
               <div className="flex justify-between mb-2"><label>從庫選擇</label><button type="button" onClick={handleSelectAll} className="text-indigo-600 text-sm">{selectedExistingIds.length === existingSingles.length ? '取消全選' : '全選'}</button></div>
               <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">{existingSingles.map(i => (<div key={i.id} onClick={() => toggleSelection(i.id)} className={`cursor-pointer p-2 border rounded flex items-center ${selectedExistingIds.includes(i.id)?'bg-red-50 border-red-300':''}`}><div className="mr-2 text-red-600">{selectedExistingIds.includes(i.id)?<CheckSquare size={16}/>:<Square size={16}/>}</div><span className="truncate text-sm">{i.title}</span></div>))}</div>
             </div>
             <div><label>編輯列表</label>{manualItems.map((m, i) => (<div key={i} className="flex mb-2 gap-2"><input placeholder="標題" className="w-1/3 border p-2 rounded" value={m.title} onChange={e=>handleManualItemChange(i,'title',e.target.value)}/><input placeholder="URL" className="flex-1 border p-2 rounded" value={m.url} onChange={e=>handleManualItemChange(i,'url',e.target.value)}/><button type="button" onClick={()=>removePlaylistField(i)} className="px-3 bg-gray-100 rounded"><X size={16}/></button></div>))}<button type="button" onClick={addPlaylistField} className="text-red-600 text-sm flex items-center"><Plus size={16}/> 新增</button></div>
           </div>
         )}
         <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setView('admin')} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button><button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">儲存</button></div>
      </form>
    </div>
  );
};

const PlayerView = ({ item, setView, recordDownload }) => {
  const [idx, setIdx] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [vList, setVList] = useState([]);
  const [audio, setAudio] = useState(true);
  useEffect(() => { if (item.type === 'single') setVList([item.url]); else setVList(item.urls); setIdx(0); }, [item]);
  
  const curItem = vList[idx];
  
  // 安全檢查，防止當 vList 為空或索引錯誤時崩潰
  if (!curItem) {
     return (
       <div className="max-w-4xl mx-auto space-y-6 p-12 text-center text-gray-500">
          <button onClick={()=>setView('home')} className="flex items-center mx-auto mb-4 text-gray-500 hover:text-gray-900"><SkipBack size={16} className="mr-1"/> 返回列表</button>
          載入中或無影片資料...
       </div>
     );
  }

  const curUrl = getVideoUrl(curItem);
  const curTitle = getVideoTitle(curItem);
  const vid = getYouTubeID(curUrl);
  const embed = vid ? `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1` : '';
  const next = () => setIdx(shuffle ? Math.floor(Math.random()*vList.length) : (idx+1)%vList.length);
  const prev = () => setIdx((idx-1+vList.length)%vList.length);
  const openLink = () => { window.open(curUrl, '_blank'); recordDownload(item.id); };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between mb-4"><button onClick={()=>setView('home')} className="flex items-center text-gray-500"><SkipBack size={16} className="mr-1"/> 返回</button><button onClick={()=>setAudio(!audio)} className={`flex items-center px-3 py-1 rounded-full text-sm ${audio?'bg-purple-600 text-white':'bg-gray-200'}`}><Music size={16} className="mr-1"/> {audio?'純音樂 ON':'切換純音樂'}</button></div>
      <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
        {audio && <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center text-white p-8"><Music size={40} className="mb-4 animate-pulse"/><h3 className="text-xl font-bold">正在播放音訊</h3><p className="text-gray-400 text-sm">{curTitle}</p></div>}
        <div className={`${audio?'opacity-0 h-16 pointer-events-none':'aspect-video'} w-full`}><iframe width="100%" height="100%" src={embed} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe></div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between"><div><h1 className="text-2xl font-bold">{item.title}</h1><p className="text-gray-600">{item.description}</p></div><button onClick={openLink} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"><ExternalLink size={18} className="mr-2"/> 下載</button></div>
        {item.type === 'playlist' && (
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between mb-4"><h3 className="font-bold flex"><List size={18} className="mr-2"/> 播放清單</h3><div className="flex gap-2"><button onClick={()=>setShuffle(!shuffle)} className={`p-2 rounded ${shuffle?'bg-indigo-100 text-indigo-600':'text-gray-400'}`}><Shuffle size={20}/></button><button onClick={prev}><SkipBack size={20}/></button><button onClick={next}><SkipForward size={20}/></button></div></div>
            <div className="max-h-60 overflow-y-auto border rounded">{vList.map((v, i) => (<div key={i} onClick={()=>setIdx(i)} className={`p-3 cursor-pointer flex items-center ${i===idx?'bg-red-50 text-red-700':''}`}><span className="w-6 mr-2">{i===idx?<Play size={12}/>:i+1}</span><span className="truncate">{getVideoTitle(v)}</span></div>))}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between">
       <div className="flex gap-4 text-xs font-bold text-blue-800 items-center">
         <span className="flex items-center text-green-600"><Cloud size={12} className="mr-1"/> 雲端模式</span>
         <span className="flex items-center text-green-600"><CheckCircle size={12} className="mr-1"/> 連線正常</span>
         <span className="text-gray-400 font-mono">ID: yt-manager-global</span>
       </div>
    </div>
    <div className="p-6 border-b flex justify-between"><h2 className="text-xl font-bold flex items-center"><List className="mr-2"/> 管理</h2><div className="flex gap-2"><label className="cursor-pointer px-4 py-2 border rounded hover:bg-gray-50 flex items-center"><Upload size={16} className="mr-2"/> 匯入<input type="file" className="hidden" accept=".csv" onChange={handleImport}/></label><button onClick={handleExport} className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center"><Download size={16} className="mr-2"/> 匯出</button></div></div>
    <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">標題</th><th className="px-6 py-3 text-left">類型</th><th className="px-6 py-3 text-left">數據</th><th className="px-6 py-3 text-right">操作</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{items.map(i=>(<tr key={i.id}><td className="px-6 py-4"><div className="text-sm font-medium">{i.title}</div></td><td className="px-6 py-4"><span className={`px-2 text-xs rounded-full ${i.type==='playlist'?'bg-indigo-100 text-indigo-800':'bg-green-100 text-green-800'}`}>{i.type==='playlist'?'清單':'單曲'}</span></td><td className="px-6 py-4 text-sm text-gray-500">{i.visits||0}/{i.downloads||0}</td><td className="px-6 py-4 text-right space-x-2"><button onClick={()=>openEdit(i)} className="text-indigo-600"><Edit size={16}/></button><button onClick={()=>handleDelete(i.id)} className="text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table>
  </div>
);

const LoginView = ({ onLogin, setView }) => {
  const [p, setP] = useState('');
  return <div className="flex justify-center py-12"><div className="max-w-md w-full bg-white p-8 rounded shadow"><h2>管理員登入</h2><form className="mt-4" onSubmit={e=>{e.preventDefault();onLogin(p)}}><input type="password" required className="w-full p-2 border rounded mb-4" placeholder="密碼" value={p} onChange={e=>setP(e.target.value)}/><button type="submit" className="w-full py-2 bg-red-600 text-white rounded">登入</button><button type="button" onClick={()=>setView('home')} className="w-full py-2 mt-2 text-gray-500">返回</button></form></div></div>;
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
  
  const handleExport = () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF'+arrayToCSV(items)], {type:'text/csv;charset=utf-8;'}));
    const link = document.createElement('a'); link.href = url; link.download = 'backup.csv'; link.click();
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
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header setView={setView} isAdmin={isAdmin} handleLogout={handleLogout} isLoading={isLoading}/>
      {notification && <div className={`fixed top-4 right-4 p-4 rounded shadow text-white z-50 ${notification.type==='error'?'bg-red-500':'bg-green-500'}`}>{notification.msg}</div>}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {view === 'home' && <Dashboard items={items} viewItem={viewItem} isLoading={isLoading} permissionError={permErr}/>}
        {view === 'create' && <CreatePage items={items} handleCreate={handleCreate} setView={setView} showNotification={showNotification}/>}
        {view === 'edit' && editItem && <EditPage item={editItem} items={items} handleUpdate={handleUpdate} setView={setView} showNotification={showNotification}/>}
        {view === 'view' && activeItem && <PlayerView item={activeItem} setView={setView} recordDownload={recordDownload}/>}
        {view === 'login' && <LoginView onLogin={handleLogin} setView={setView}/>}
        {view === 'admin' && <AdminPanel items={items} handleDelete={handleDelete} openEdit={openEdit} handleImport={handleImport} handleExport={handleExport}/>}
      </main>
      <div className="fixed bottom-4 left-4 z-50 px-3 py-1 bg-white shadow rounded-full text-xs flex items-center text-gray-600"><Cloud size={12} className="mr-1 text-blue-500"/> 雲端模式 (Firebase)</div>
    </div>
  );
}