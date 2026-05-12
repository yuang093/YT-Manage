// 過濾器列
import { Search, X, History } from 'lucide-react';
import SortDropdown from './SortDropdown';

export const FilterBar = ({ filter, setFilter, searchTerm, setSearchTerm, sortBy, sortOrder, onSortChange, showHistory, setShowHistory, historyLength }) => (
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="flex items-center space-x-2">
      {/* 類型篩選 */}
      <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm p-1 rounded-xl">
        {['all', 'single', 'playlist'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === type
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md transform scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
            }`}
          >
            {type === 'all' ? '🎵 全部' : type === 'single' ? '🎤 單曲' : '📋 播放清單'}
          </button>
        ))}
      </div>
      
      {/* 歷史記錄按鈕 */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-all duration-200 ${
          showHistory 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <History size={14} className="mr-1" />
        歷史記錄
        {historyLength > 0 && (
          <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">{historyLength}</span>
        )}
      </button>
    </div>

    <div className="flex items-center space-x-2 w-full md:w-auto">
      <SortDropdown sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
      
      {/* 搜尋框 */}
      <div className="relative w-full md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="搜尋標題或說明..."
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:shadow-lg focus:shadow-red-500/20 transition-all duration-200"
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
  </div>
);

export default FilterBar;
