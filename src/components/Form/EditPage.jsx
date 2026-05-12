// EditPage
import { useState, useEffect } from 'react';
import { Edit, X, CheckSquare, Square } from 'lucide-react';
import { getYouTubeID } from '../../utils/youtube';

export const EditPage = ({ item, items, handleUpdate, setView, showNotification }) => {
  const [type, setType] = useState(item.type);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [url, setUrl] = useState(item.type === 'single' ? item.url : '');
  const [playlistUrls, setPlaylistUrls] = useState(
    item.type === 'playlist' && Array.isArray(item.urls) ? item.urls.map(u => typeof u === 'string' ? { title: '', url: u } : u) : [{ title: '', url: '' }]
  );
  const [selectedExisting, setSelectedExisting] = useState([]);
  const singleItems = items.filter(i => i.type === 'single');

  useEffect(() => { if (type === 'playlist' && playlistUrls.length === 0) setPlaylistUrls([{ title: '', url: '' }]); }, [type, playlistUrls.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'single') {
      if (!getYouTubeID(url)) { showNotification('無效 URL', 'error'); return; }
      handleUpdate({ ...item, type, title, description, url });
    } else {
      const manualUrls = playlistUrls.filter(u => getYouTubeID(u.url)).map(u => ({ url: u.url, title: u.title || u.url }));
      const existingUrls = singleItems.filter(i => selectedExisting.includes(i.id)).map(i => ({ url: i.url, title: i.title }));
      if (manualUrls.length + existingUrls.length === 0) { showNotification('至少需一個連結', 'error'); return; }
      handleUpdate({ ...item, type, title, description, urls: [...manualUrls, ...existingUrls] });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white"><Edit className="mr-2" /> 修改</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">主旨</label>
          <input required type="text" className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">說明</label>
          <textarea className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {type === 'single' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
            <input required type="url" className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border rounded border-gray-200 dark:border-gray-600">
              <div className="flex justify-between mb-2">
                <label className="text-gray-700 dark:text-gray-300">從庫選擇</label>
                <button type="button" onClick={() => setSelectedExisting(singleItems.length === selectedExisting.length ? [] : singleItems.map(i => i.id))} className="text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedExisting.length === singleItems.length ? '取消全選' : '全選'}
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                {singleItems.map(i => (
                  <div key={i.id} onClick={() => setSelectedExisting(prev => prev.includes(i.id) ? prev.filter(id => id !== i.id) : [...prev, i.id])}
                    className={'cursor-pointer p-2 border rounded flex items-center ' + (selectedExisting.includes(i.id) ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-50')}>
                    <div className={'mr-2 text-red-600'}>{selectedExisting.includes(i.id) ? <CheckSquare size={16} /> : <Square size={16} />}</div>
                    <span className="truncate text-sm">{i.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-700 dark:text-gray-300">編輯列表</label>
              {playlistUrls.map((p, index) => (
                <div key={index} className="flex mb-2 gap-2">
                  <input placeholder="標題" className="w-1/3 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={p.title} onChange={e => { const u = [...playlistUrls]; u[index].title = e.target.value; setPlaylistUrls(u); }} />
                  <input placeholder="URL" className="flex-1 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={p.url} onChange={e => { const u = [...playlistUrls]; u[index].url = e.target.value; setPlaylistUrls(u); }} />
                  <button type="button" onClick={() => setPlaylistUrls(playlistUrls.filter((_, i) => i !== index))} className="px-3 bg-gray-100 dark:bg-gray-600 rounded border text-gray-600 dark:text-gray-300"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setPlaylistUrls([...playlistUrls, { title: '', url: '' }])} className="text-red-600 text-sm flex items-center"><X size={16} /> 新增</button>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => setView('admin')} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600">取消</button>
          <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">儲存</button>
        </div>
      </form>
    </div>
  );
};

export default EditPage;
