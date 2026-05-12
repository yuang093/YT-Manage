// CreatePage
import { useState } from 'react';
import { Plus, X, CheckSquare, Square } from 'lucide-react';
import { getYouTubeID } from '../../utils/youtube';

export const CreatePage = ({ items, handleCreate, setView, showNotification }) => {
  const [type, setType] = useState('single');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [playlistUrls, setPlaylistUrls] = useState([{ title: '', url: '' }]);
  const [selectedExisting, setSelectedExisting] = useState([]);
  const singleItems = items.filter(item => item.type === 'single');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'single') {
      if (!getYouTubeID(url)) { showNotification('無效的 YouTube 連結', 'error'); return; }
      handleCreate({ type, title, description, url });
    } else {
      const manualUrls = playlistUrls.filter(u => getYouTubeID(u.url)).map(u => ({ url: u.url, title: u.title || u.url }));
      const existingUrls = singleItems.filter(item => selectedExisting.includes(item.id)).map(item => ({ url: item.url, title: item.title }));
      if (manualUrls.length + existingUrls.length === 0) { showNotification('請至少輸入或選擇一個有效的 YouTube 連結', 'error'); return; }
      handleCreate({ type, title, description, urls: [...manualUrls, ...existingUrls] });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
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
          <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">說明</label>
          <textarea className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {type === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">YouTube 連結</label>
            <input required type="url" placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">從現有單曲庫選擇</label>
                {singleItems.length > 0 && (
                  <button type="button" onClick={() => setSelectedExisting(singleItems.length === selectedExisting.length ? [] : singleItems.map(i => i.id))} className="text-sm text-indigo-600 dark:text-indigo-400">全選</button>
                )}
              </div>
              {singleItems.length === 0 ? <p className="text-sm text-gray-500">目前沒有已建立的單曲。</p> : (
                <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                  {singleItems.map(item => (
                    <div key={item.id} onClick={() => setSelectedExisting(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                      className={'flex items-center p-2 rounded cursor-pointer border ' + (selectedExisting.includes(item.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-50')}>
                      <div className={'mr-2 ' + (selectedExisting.includes(item.id) ? 'text-red-600' : 'text-gray-400')}>
                        {selectedExisting.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <span className="text-sm truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">手動輸入</label>
              {playlistUrls.map((item, index) => (
                <div key={index} className="flex mb-2 space-x-2">
                  <input type="text" placeholder="標題 (選填)" className="w-1/3 rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700" value={item.title} onChange={e => { const u = [...playlistUrls]; u[index].title = e.target.value; setPlaylistUrls(u); }} />
                  <input type="url" placeholder="YouTube 連結" className="flex-1 rounded-md border-gray-300 dark:border-gray-600 border p-2 bg-white dark:bg-gray-700" value={item.url} onChange={e => { const u = [...playlistUrls]; u[index].url = e.target.value; setPlaylistUrls(u); }} />
                  <button type="button" onClick={() => setPlaylistUrls(playlistUrls.filter((_, i) => i !== index))} className="bg-gray-100 dark:bg-gray-600 px-3 rounded-md border border-gray-300 text-gray-600 dark:text-gray-300"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setPlaylistUrls([...playlistUrls, { title: '', url: '' }])} className="text-sm text-red-600 hover:text-red-800 font-medium"><Plus size={16} /> 新增欄位</button>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end space-x-3">
          <button type="button" onClick={() => setView('home')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700">取消</button>
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">建立</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePage;
