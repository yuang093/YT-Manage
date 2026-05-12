// Dashboard 主元件
import { useState, useMemo } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import StatsCards from './StatsCards';
import FilterBar from './FilterBar';
import ItemList from './ItemList';
import { formatDate } from '../../utils/format';

export const Dashboard = ({ items, viewItem, isLoading, permissionError, favorites, toggleFavorite, playHistory, onPlayFromHistory }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showHistory, setShowHistory] = useState(false);

  // 安全確保 items 是陣列
  const safeItems = Array.isArray(items) ? items : [];

  // 計算統計
  const stats = useMemo(() => ({
    totalItems: safeItems.length,
    totalVisits: safeItems.reduce((sum, item) => sum + (item.visits || 0), 0),
    totalDownloads: safeItems.reduce((sum, item) => sum + (item.downloads || 0), 0),
    playlists: safeItems.filter(item => item.type === 'playlist').length,
    singles: safeItems.filter(item => item.type === 'single').length,
  }), [safeItems]);

  // 過濾並排序
  const filteredItems = useMemo(() => {
    return safeItems
      .filter(item => {
        const matchesFilter = filter === 'all' || item.type === filter;
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = item.title?.toLowerCase().includes(lowerSearch) || 
                            item.description?.toLowerCase().includes(lowerSearch);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'title') {
          aVal = (aVal || '').toLowerCase();
          bVal = (bVal || '').toLowerCase();
          return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
  }, [safeItems, filter, searchTerm, sortBy, sortOrder]);

  // 歷史記錄中的項目
  const historyItems = useMemo(() => {
    return playHistory
      .map(historyItem => {
        const fullItem = safeItems.find(i => i.id === historyItem.id);
        return fullItem ? { ...fullItem, playedAt: historyItem.playedAt } : null;
      })
      .filter(Boolean)
      .slice(0, 20);
  }, [playHistory, safeItems]);

  // 空狀態
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
    if (isLoading) return (
      <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </div>
    );
    if (safeItems.length === 0) return <div className="text-gray-500 dark:text-gray-400">目前雲端資料庫是空的，請點擊右上角「新增頁面」開始建立。</div>;
    if (filteredItems.length === 0) return <div className="text-gray-500 dark:text-gray-400">找不到符合「{searchTerm}」的資料。</div>;
    return <div className="text-gray-500 dark:text-gray-400">此分類目前沒有資料。</div>;
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <StatsCards stats={stats} />
      
      {/* 主內容區 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300">
        <FilterBar 
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
          showHistory={showHistory}
          historyLength={playHistory?.length || 0}
        />
        
        {/* 歷史記錄面板 */}
        {showHistory && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
                📜 最近播放 (最多 20 首)
              </h3>
              {playHistory?.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('確定清除所有播放歷史？')) {
                      localStorage.removeItem('yt_play_history');
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center"
                >
                  🗑️ 清除
                </button>
              )}
            </div>
            {historyItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">尚無播放記錄</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {historyItems.map((hItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => onPlayFromHistory(hItem)}
                    className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    ▶️ <span className="truncate max-w-[150px] ml-1">{hItem.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 列表或空狀態 */}
        {filteredItems.length === 0 ? renderEmptyState() : (
          <ItemList 
            items={filteredItems}
            viewItem={viewItem}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
