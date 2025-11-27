import React, { useState, useEffect } from 'react';
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
  FileText,
  CheckCircle2 // 新增圖示
} from 'lucide-react';

// --- 工具函數 ---

// 產生唯一 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 從 URL 提取 YouTube Video ID
const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 格式化日期
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- CSV 處理函數 ---

const arrayToCSV = (items) => {
  const headers = ['id', 'type', 'title', 'description', 'url', 'urls', 'createdAt', 'visits', 'downloads'];
  
  const csvRows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      // 處理陣列 (urls)
      if (header === 'urls') {
        val = JSON.stringify(val || []); 
      }
      // 處理空值
      if (val === undefined || val === null) {
        val = '';
      }
      // 轉字串並跳脫雙引號 (CSV 標準：將 " 轉為 "")
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
};

const csvToArray = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const values = [];
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      if (match[1] !== undefined) {
        values.push(match[1].replace(/""/g, '"'));
      } else {
        values.push(match[2]);
      }
    }

    if (values.length < headers.length) continue;

    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index];
      
      if (header === 'urls') {
        try { val = JSON.parse(val); } catch(e) { val = []; }
      } else if (['createdAt', 'visits', 'downloads'].includes(header)) {
        val = Number(val) || 0;
      }
      
      obj[header] = val;
    });
    result.push(obj);
  }
  return result;
};

// --- 子元件 ---

const Header = ({ setView, isAdmin, handleLogout }) => (
  <nav className="bg-red-600 text-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
          <Youtube className="w-8 h-8 mr-2" />
          <span className="font-bold text-xl tracking-tight">YT 管理大師</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setView('create')}
            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> 新增頁面
          </button>
          {isAdmin ? (
            <div className="flex items-center space-x-2">
               <button 
                onClick={() => setView('admin')}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
              >
                <Settings className="w-4 h-4 mr-1" /> 管理後台
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium bg-red-800 hover:bg-red-900 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" /> 登出
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setView('login')}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
            >
              <Lock className="w-4 h-4 mr-1" /> 管理員
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Dashboard = ({ items, viewItem }) => {
  const [filter, setFilter] = useState('all'); 

  const stats = {
    totalItems: items.length,
    totalVisits: items.reduce((acc, curr) => acc + (curr.visits || 0), 0),
    totalDownloads: items.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
    playlists: items.filter(i => i.type === 'playlist').length,
    singles: items.filter(i => i.type === 'single').length,
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

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
             <button 
               onClick={() => setFilter('all')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               全部
             </button>
             <button 
               onClick={() => setFilter('single')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'single' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               單曲
             </button>
             <button 
               onClick={() => setFilter('playlist')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'playlist' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
               播放清單
             </button>
          </div>
          <span className="text-xs font-normal text-gray-500 hidden sm:block">點擊標題進入</span>
        </div>
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            此分類目前沒有資料。
          </div>
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
  const [playlistUrls, setPlaylistUrls] = useState(['']); 
  const [selectedExistingIds, setSelectedExistingIds] = useState([]); 

  const existingSingles = items.filter(i => i.type === 'single');

  const handlePlaylistUrlChange = (index, value) => {
    const newUrls = [...playlistUrls];
    newUrls[index] = value;
    setPlaylistUrls(newUrls);
  };

  const addPlaylistField = () => setPlaylistUrls([...playlistUrls, '']);
  const removePlaylistField = (index) => {
    const newUrls = playlistUrls.filter((_, i) => i !== index);
    setPlaylistUrls(newUrls);
  };

  const toggleSelection = (itemId) => {
    if (selectedExistingIds.includes(itemId)) {
      setSelectedExistingIds(selectedExistingIds.filter(id => id !== itemId));
    } else {
      setSelectedExistingIds([...selectedExistingIds, itemId]);
    }
  };

  // 全選/取消全選功能
  const handleSelectAll = () => {
    if (selectedExistingIds.length === existingSingles.length) {
      setSelectedExistingIds([]);
    } else {
      setSelectedExistingIds(existingSingles.map(i => i.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'single') {
      if (!getYouTubeID(url)) {
        showNotification('無效的 YouTube 連結', 'error');
        return;
      }
      handleCreate({ type, title, description, url });
    } else {
      const manualValidUrls = playlistUrls.filter(u => getYouTubeID(u));
      const selectedUrls = existingSingles
        .filter(item => selectedExistingIds.includes(item.id))
        .map(item => item.url);

      const finalUrls = [...manualValidUrls, ...selectedUrls];

      if (finalUrls.length === 0) {
        showNotification('請至少輸入或選擇一個有效的 YouTube 連結', 'error');
        return;
      }
      handleCreate({ type, title, description, urls: finalUrls });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">建立新頁面</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">類型</label>
          <div className="mt-1 flex space-x-4">
            <label className="inline-flex items-center cursor-pointer">
              <input type="radio" className="form-radio text-red-600" name="type" value="single" checked={type === 'single'} onChange={() => setType('single')} />
              <span className="ml-2">單一連結</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input type="radio" className="form-radio text-red-600" name="type" value="playlist" checked={type === 'playlist'} onChange={() => setType('playlist')} />
              <span className="ml-2">播放清單</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">主旨 (標題)</label>
          <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">說明</label>
          <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>

        {type === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube 連結</label>
            <input required type="url" placeholder="https://www.youtube.com/watch?v=..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">從現有單曲庫選擇</label>
                {existingSingles.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    {selectedExistingIds.length === existingSingles.length ? (
                      <>取消全選</>
                    ) : (
                      <>全選 ({existingSingles.length})</>
                    )}
                  </button>
                )}
              </div>
              {existingSingles.length === 0 ? (
                <p className="text-sm text-gray-500">目前沒有已建立的單曲可供選擇。</p>
              ) : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingSingles.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center p-2 rounded cursor-pointer border ${selectedExistingIds.includes(item.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <div className={`mr-2 ${selectedExistingIds.includes(item.id) ? 'text-red-600' : 'text-gray-400'}`}>
                          {selectedExistingIds.includes(item.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </div>
                      <span className="text-sm truncate select-none">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">或手動輸入其他 YouTube 連結</label>
              {playlistUrls.map((pUrl, idx) => (
                <div key={idx} className="flex mb-2">
                  <input 
                    type="url" 
                    placeholder={`影片連結 ${idx + 1}`}
                    className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-red-500 focus:border-red-500"
                    value={pUrl}
                    onChange={e => handlePlaylistUrlChange(idx, e.target.value)}
                  />
                  <button type="button" onClick={() => removePlaylistField(idx)} className="bg-gray-100 px-3 border border-l-0 rounded-r-md hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addPlaylistField} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center mt-2">
                <Plus size={16} className="mr-1"/> 新增連結欄位
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={() => setView('home')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">建立</button>
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
  const [playlistUrls, setPlaylistUrls] = useState(item.type === 'playlist' ? item.urls : ['']); 
  
  const existingSingles = items.filter(i => i.type === 'single');
  const [selectedExistingIds, setSelectedExistingIds] = useState([]); 

  useEffect(() => {
    if (type === 'playlist' && playlistUrls.length === 0) {
      setPlaylistUrls(['']);
    }
  }, []);

  const handlePlaylistUrlChange = (index, value) => {
    const newUrls = [...playlistUrls];
    newUrls[index] = value;
    setPlaylistUrls(newUrls);
  };

  const addPlaylistField = () => setPlaylistUrls([...playlistUrls, '']);
  const removePlaylistField = (index) => {
    const newUrls = playlistUrls.filter((_, i) => i !== index);
    setPlaylistUrls(newUrls);
  };

  const toggleSelection = (itemId) => {
    if (selectedExistingIds.includes(itemId)) {
      setSelectedExistingIds(selectedExistingIds.filter(id => id !== itemId));
    } else {
      setSelectedExistingIds([...selectedExistingIds, itemId]);
    }
  };

  // 全選/取消全選功能 (EditPage 也加上)
  const handleSelectAll = () => {
    if (selectedExistingIds.length === existingSingles.length) {
      setSelectedExistingIds([]);
    } else {
      setSelectedExistingIds(existingSingles.map(i => i.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'single') {
      if (!getYouTubeID(url)) {
        showNotification('無效的 YouTube 連結', 'error');
        return;
      }
      handleUpdate({ ...item, type, title, description, url });
    } else {
      const manualValidUrls = playlistUrls.filter(u => getYouTubeID(u));
      const selectedUrls = existingSingles
        .filter(item => selectedExistingIds.includes(item.id))
        .map(item => item.url);

      const finalUrls = [...manualValidUrls, ...selectedUrls];

      if (finalUrls.length === 0) {
        showNotification('請至少輸入或選擇一個有效的 YouTube 連結', 'error');
        return;
      }
      handleUpdate({ ...item, type, title, description, urls: finalUrls });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
        <Edit className="mr-2" /> 修改頁面
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">類型 (不可修改)</label>
          <div className="mt-1">
            <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${type === 'playlist' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
              {type === 'playlist' ? '播放清單' : '單曲'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">主旨 (標題)</label>
          <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">說明</label>
          <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>

        {type === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube 連結</label>
            <input required type="url" placeholder="https://www.youtube.com/watch?v=..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border p-2" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">加入更多單曲 (從現有庫)</label>
                {existingSingles.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    {selectedExistingIds.length === existingSingles.length ? (
                      <>取消全選</>
                    ) : (
                      <>全選 ({existingSingles.length})</>
                    )}
                  </button>
                )}
              </div>
              {existingSingles.length === 0 ? (
                <p className="text-sm text-gray-500">目前沒有其他單曲可供選擇。</p>
              ) : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingSingles.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center p-2 rounded cursor-pointer border ${selectedExistingIds.includes(item.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <div className={`mr-2 ${selectedExistingIds.includes(item.id) ? 'text-red-600' : 'text-gray-400'}`}>
                          {selectedExistingIds.includes(item.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </div>
                      <span className="text-sm truncate select-none">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">編輯連結列表</label>
              {playlistUrls.map((pUrl, idx) => (
                <div key={idx} className="flex mb-2">
                  <input 
                    type="url" 
                    placeholder={`影片連結 ${idx + 1}`}
                    className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-red-500 focus:border-red-500"
                    value={pUrl}
                    onChange={e => handlePlaylistUrlChange(idx, e.target.value)}
                  />
                  <button type="button" onClick={() => removePlaylistField(idx)} className="bg-gray-100 px-3 border border-l-0 rounded-r-md hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addPlaylistField} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center mt-2">
                <Plus size={16} className="mr-1"/> 新增連結欄位
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={() => setView('admin')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">儲存修改</button>
        </div>
      </form>
    </div>
  );
};

const PlayerView = ({ item, setView, recordDownload }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [videoList, setVideoList] = useState([]);
  const [audioMode, setAudioMode] = useState(true);

  useEffect(() => {
    if (item.type === 'single') {
      setVideoList([item.url]);
    } else {
      setVideoList(item.urls);
    }
    setCurrentIndex(0);
  }, [item]);

  const currentVideoId = getYouTubeID(videoList[currentIndex]);
  // 建構實際使用的 nocookie URL
  const embedUrl = currentVideoId 
    ? `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1` 
    : '';

  const handleNext = () => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * videoList.length);
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex((prev) => (prev + 1) % videoList.length);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videoList.length) % videoList.length);
  };

  const handleDownloadClick = () => {
    window.open(videoList[currentIndex], '_blank');
    recordDownload(item.id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
          <button onClick={() => setView('home')} className="text-gray-500 hover:text-gray-900 flex items-center">
          <SkipBack size={16} className="mr-1"/> 返回列表
        </button>
        <button 
          onClick={() => setAudioMode(!audioMode)} 
          className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${audioMode ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          <Music size={16} className="mr-1" />
          {audioMode ? '純音樂模式 ON' : '切換純音樂'}
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
        {audioMode && (
          <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center text-white p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-red-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Music size={40} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">正在播放音訊</h3>
            <p className="text-gray-400 text-sm max-w-md text-center truncate">
              {item.type === 'playlist' ? `項目 ${currentIndex + 1}: ` : ''} 
              {videoList[currentIndex]}
            </p>
            <div className="mt-8 text-xs text-gray-500">影片仍在背景執行以維持音訊串流</div>
          </div>
        )}

        <div className={`${audioMode ? 'opacity-0 h-16 pointer-events-none' : 'aspect-video'} w-full transition-all duration-300`}>
          {currentVideoId ? (
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              // 注意：這裡移除了 referrerPolicy 屬性，改用全域 meta tag 處理，避免屬性衝突
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-white">無效的影片連結</div>
          )}
        </div>
      </div>
      
      {/* 新增：明確顯示目前的嵌入連結 */}
      <div className="bg-gray-800 text-green-400 p-2 text-xs rounded font-mono break-all flex items-center">
        <span className="mr-2 text-gray-400 shrink-0">目前嵌入連結:</span>
        {embedUrl}
      </div>

      <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded flex items-start">
          <span className="mr-1">💡</span> 
          <span>若出現「影片無法播放」或「錯誤 153」，表示該影片擁有者禁止在外部網站播放。請點擊下方的「前往/下載」按鈕至 YouTube 觀看。</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h1>
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{item.description}</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <button 
              onClick={handleDownloadClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <ExternalLink size={18} className="mr-2"/> 前往/下載
            </button>
          </div>
        </div>

        {item.type === 'playlist' && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <List size={18} className="mr-2"/> 播放清單 ({currentIndex + 1} / {videoList.length})
              </h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2 rounded ${isShuffle ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  title="隨機播放"
                >
                  <Shuffle size={20} />
                </button>
                <button onClick={handlePrev} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                  <SkipBack size={20} />
                </button>
                <button onClick={handleNext} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md">
              {videoList.map((url, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 text-sm cursor-pointer flex items-center truncate ${idx === currentIndex ? 'bg-red-50 text-red-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                    <span className="w-6 text-center mr-2">{idx === currentIndex ? <Play size={12} className="inline"/> : idx + 1}</span>
                    <span className="truncate flex-1">{url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-400 flex space-x-4">
          <span>累積訪問: {item.visits || 0}</span>
          <span>累積下載/點擊: {item.downloads || 0}</span>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Settings className="mr-2" /> 管理後台
        </h2>
        <div className="flex space-x-2">
            <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
              <Upload size={16} className="mr-2"/> 匯入 CSV
              <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
              <Download size={16} className="mr-2"/> 匯出 CSV
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數據 (訪/點)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500 truncate w-48">{item.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'playlist' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                    {item.type === 'playlist' ? '播放清單' : '單曲'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.visits || 0} / {item.downloads || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                    <Edit size={16} className="mr-1" /> 修改
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                    <Trash2 size={16} className="mr-1" /> 刪除
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">無資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LoginView = ({ onLogin, setView }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">管理員登入</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="請輸入管理密碼"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              登入
            </button>
          </div>
          <div className="text-center mt-2">
            <button type="button" onClick={() => setView('home')} className="text-sm text-gray-500 hover:text-gray-900">返回首頁</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 主 App 元件 ---

export default function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('home');
  const [activeItem, setActiveItem] = useState(null);
  const [editItem, setEditItem] = useState(null); // 新增狀態：當前編輯的項目
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('yt_manager_items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("資料讀取錯誤", e);
      }
    }

    // --- 新增：強制設定 Referrer Policy Meta Tag ---
    // 解決 Error 153 問題
    const meta = document.createElement('meta');
    meta.name = "referrer";
    meta.content = "strict-origin-when-cross-origin";
    document.head.appendChild(meta);

    return () => {
      // 雖然 App 通常不會卸載，但為了良好習慣，這裡可以清除
      try {
        document.head.removeChild(meta);
      } catch(e) {
        // 忽略移除錯誤
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('yt_manager_items', JSON.stringify(items));
  }, [items]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = (newItem) => {
    const item = {
      ...newItem,
      id: generateId(),
      createdAt: Date.now(),
      visits: 0,
      downloads: 0,
    };
    setItems([item, ...items]);
    showNotification('建立成功！');
    setView('home');
  };

  // 新增：處理更新邏輯
  const handleUpdate = (updatedItem) => {
    const newItems = items.map(i => i.id === updatedItem.id ? { ...i, ...updatedItem } : i);
    setItems(newItems);
    showNotification('更新成功！');
    setEditItem(null);
    setView('admin');
  };

  // 新增：進入編輯模式
  const openEdit = (item) => {
    setEditItem(item);
    setView('edit');
  };

  const handleDelete = (id) => {
    if (window.confirm('確定要刪除這個項目嗎？')) {
      setItems(items.filter(i => i.id !== id));
      showNotification('已刪除項目');
    }
  };

  const handleLogin = (password) => {
    if (password === '1qaz2wsx') {
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

  const handleExport = () => {
    // 改為 CSV 匯出
    const csvContent = arrayToCSV(items);
    // 加入 BOM 以支援 Excel 中文顯示
    const bom = "\uFEFF"; 
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(bom + csvContent);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "youtube_manager_backup.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotification('CSV 匯出成功');
  };

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const parsedItems = csvToArray(e.target.result);
        if (parsedItems && parsedItems.length > 0) {
          setItems(parsedItems);
          showNotification('CSV 匯入成功');
        } else {
          showNotification('CSV 格式錯誤或無資料', 'error');
        }
      } catch (error) {
        console.error(error);
        showNotification('CSV 解析錯誤', 'error');
      }
    };
  };

  const viewItem = (item) => {
    const updatedItems = items.map(i => 
      i.id === item.id ? { ...i, visits: (i.visits || 0) + 1 } : i
    );
    setItems(updatedItems);
    setActiveItem(item);
    setView('view');
  };

  const recordDownload = (itemId) => {
    const updatedItems = items.map(i => 
      i.id === itemId ? { ...i, downloads: (i.downloads || 0) + 1 } : i
    );
    setItems(updatedItems);
    showNotification('已記錄下載/點擊次數');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Header setView={setView} isAdmin={isAdmin} handleLogout={handleLogout} />
      
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg text-white z-50 ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.msg}
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {view === 'home' && <Dashboard items={items} viewItem={viewItem} />}
          {view === 'create' && <CreatePage items={items} handleCreate={handleCreate} setView={setView} showNotification={showNotification} />}
          {view === 'edit' && editItem && <EditPage item={editItem} items={items} handleUpdate={handleUpdate} setView={setView} showNotification={showNotification} />}
          {view === 'view' && activeItem && <PlayerView item={activeItem} setView={setView} recordDownload={recordDownload} />}
          {view === 'login' && <LoginView onLogin={handleLogin} setView={setView} />}
          {view === 'admin' && <AdminPanel items={items} handleDelete={handleDelete} openEdit={openEdit} handleImport={handleImport} handleExport={handleExport} />}
        </div>
      </main>
    </div>
  );
}