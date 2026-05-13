// CreatePage
import { useState } from 'react';
import { Plus, X, CheckSquare, Square } from 'lucide-react';
import { getYouTubeID } from '../../utils/youtube';

export const CreatePage = ({ items, handleCreate, setView, showNotification }) => {
  const [type, setType] = useState('single');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [manualItems, setManualItems] = useState([{ title: '', url: '' }]);
  const [selectedExistingIds, setSelectedExistingIds] = useState([]);
  const existingSingles = items.filter(i => i.type === 'single');

  const handleManualItemChange = (index, field, value) => {
    const newItems = [...manualItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualItems(newItems);
  };
  const addPlaylistField = () => setManualItems([...manualItems, { title: '', url: '' }]);
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
      const videoId = getYouTubeID(url);
      const isDuplicate = items.some(i => {
        if (i.type === 'single') return getYouTubeID(i.url) === videoId;
        return i.urls?.some(u => getYouTubeID(u.url || u) === videoId);
      });
      if (isDuplicate && !confirm('偵測到相同的 YouTube 連結，是否仍要新增？')) return;
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
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300">
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
                      <div className={`mr-2 ${selectedExistingIds.includes(item.id) ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>{selectedExistingIds.includes(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}</div>
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
              <button type="button" onClick={addPlaylistField} className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium flex items-center mt-2"><Plus size={16} className="mr-1" /> 新增欄位</button>
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

export default CreatePage;