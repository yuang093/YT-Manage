// EditPage
import { useState, useEffect } from 'react';
import { Edit, X, CheckSquare, Square, Plus } from 'lucide-react';
import { getYouTubeID } from '../../utils/youtube';

export const EditPage = ({ item, items, handleUpdate, setView, showNotification }) => {
  const [type, setType] = useState(item.type);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [url, setUrl] = useState(item.type === 'single' ? item.url : '');
  const [manualItems, setManualItems] = useState(() => {
    if (item.type === 'playlist' && Array.isArray(item.urls)) return item.urls.map(u => typeof u === 'string' ? { title: '', url: u } : u);
    return [{ title: '', url: '' }];
  });
  const existingSingles = items.filter(i => i.type === 'single');
  const [selectedExistingIds, setSelectedExistingIds] = useState([]);

  useEffect(() => { if (type === 'playlist' && manualItems.length === 0) setManualItems([{ title: '', url: '' }]); }, []);

  const handleManualItemChange = (index, field, value) => {
    const n = [...manualItems];
    n[index] = { ...n[index], [field]: value };
    setManualItems(n);
  };
  const addPlaylistField = () => setManualItems([...manualItems, { title: '', url: '' }]);
  const removePlaylistField = (index) => setManualItems(manualItems.filter((_, i) => i !== index));
  const toggleSelection = (id) => {
    if (selectedExistingIds.includes(id)) setSelectedExistingIds(selectedExistingIds.filter(x => x !== id));
    else setSelectedExistingIds([...selectedExistingIds, id]);
  };
  const handleSelectAll = () => {
    if (selectedExistingIds.length === existingSingles.length) setSelectedExistingIds([]);
    else setSelectedExistingIds(existingSingles.map(i => i.id));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'single') {
      if (!getYouTubeID(url)) return showNotification('無效 URL', 'error');
      handleUpdate({ ...item, type, title, description, url });
    } else {
      const m = manualItems.filter(u => getYouTubeID(u.url)).map(i => ({ url: i.url, title: i.title || i.url }));
      const s = existingSingles.filter(i => selectedExistingIds.includes(i.id)).map(i => ({ url: i.url, title: i.title }));
      const f = [...m, ...s];
      if (f.length === 0) return showNotification('至少需一個連結', 'error');
      handleUpdate({ ...item, type, title, description, urls: f });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-white"><Edit className="mr-2" /> 修改</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">主旨</label>
          <input required type="text" className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">說明</label>
          <textarea className="mt-1 block w-full border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
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
                <button type="button" onClick={handleSelectAll} className="text-indigo-600 dark:text-indigo-400 text-sm">{selectedExistingIds.length === existingSingles.length ? '取消全選' : '全選'}</button>
              </div>
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                {existingSingles.map(i => (
                  <div key={i.id} onClick={() => toggleSelection(i.id)} className={`cursor-pointer p-2 border rounded flex items-center ${selectedExistingIds.includes(i.id) ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    <div className="mr-2 text-red-600 dark:text-red-400">{selectedExistingIds.includes(i.id) ? <CheckSquare size={16} /> : <Square size={16} />}</div>
                    <span className="truncate text-sm text-gray-900 dark:text-gray-100">{i.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-700 dark:text-gray-300">編輯列表</label>
              {manualItems.map((m, i) => (
                <div key={i} className="flex mb-2 gap-2">
                  <input placeholder="標題" className="w-1/3 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={m.title} onChange={e => handleManualItemChange(i, 'title', e.target.value)} />
                  <input placeholder="URL" className="flex-1 border p-2 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={m.url} onChange={e => handleManualItemChange(i, 'url', e.target.value)} />
                  <button type="button" onClick={() => removePlaylistField(i)} className="px-3 bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={addPlaylistField} className="text-red-600 dark:text-red-400 text-sm flex items-center"><Plus size={16} /> 新增</button>
            </div>
          </div>
        )}
        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => setView('admin')} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">取消</button>
          <button type="submit" className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600">儲存</button>
        </div>
      </form>
    </div>
  );
};

export default EditPage;