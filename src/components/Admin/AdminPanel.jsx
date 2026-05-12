// AdminPanel
import { Trash2, Edit, Download, Upload, Settings, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';

export const AdminPanel = ({ items, handleDelete, openEdit, handleImport, handleExport, handleBatchDelete }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const toggleSelect = (id) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedItems(selectedItems.length === items.length ? [] : items.map(i => i.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><Settings className="mr-2" /> 後台管理</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => document.getElementById('import-input').click()} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center text-sm"><Upload size={16} className="mr-2" /> 匯入 CSV</button>
          <input id="import-input" type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={() => handleExport(items)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center text-sm"><Download size={16} className="mr-2" /> 匯出 CSV</button>
          {selectedItems.length > 0 && <button onClick={() => handleBatchDelete(selectedItems)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center text-sm"><Trash2 size={16} className="mr-2" /> 刪除選中 ({selectedItems.length})</button>}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <button onClick={selectAll} className="mr-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">{selectedItems.length === items.length ? <CheckSquare size={20} /> : <Square size={20} />}</button>
          <span className="text-sm text-gray-500 dark:text-gray-400">全選</span>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">共 {items.length} 項</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map(item => (
            <div key={item.id} className="p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <button onClick={() => toggleSelect(item.id)} className="mr-4 text-gray-400 hover:text-gray-600">{selectedItems.includes(item.id) ? <CheckSquare size={20} className="text-red-600" /> : <Square size={20} />}</button>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">{item.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.type === 'playlist' ? '📋 ' + (item.urls?.length || 0) + ' 首歌' : '🎵 單曲'}</div>
              </div>
              <div className="flex items-center space-x-4 ml-4">
                <span className="text-xs text-gray-400">{item.visits || 0} 瀏覽</span>
                <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                <button onClick={() => { if (confirm('確定刪除？')) handleDelete(item.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
