// 項目列表
import { Play, Heart, Eye, Download, ShieldAlert, Loader2, X, Trash, List, Youtube } from 'lucide-react';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { formatDate } from '../../utils/format';

export const ItemList = ({ items, viewItem, favorites, toggleFavorite, showHistory, historyItems, onPlayFromHistory }) => {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        此分類目前沒有資料。
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map((item, idx) => {
        const thumbnail = item.type === 'playlist' 
          ? (item.urls?.[0]?.url ? getYouTubeThumbnail(item.urls[0].url) : null)
          : getYouTubeThumbnail(item.url);
        const isFavorite = favorites.includes(item.id);

        return (
          <li
            key={item.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 hover:shadow-md group item-card"
          >
            <div className="px-6 py-4 flex items-center justify-between">
              {/* 左側：縮圖 + 標題 */}
              <div className="flex items-center flex-1 cursor-pointer" onClick={() => viewItem(item)}>
                {thumbnail ? (
                  <div className="relative mr-4 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <img 
                      src={thumbnail} 
                      alt={item.title}
                      className="w-28 h-16 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-all duration-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 rounded-xl">
                      <Play size={28} className="text-white drop-shadow-lg" />
                    </div>
                    {item.type === 'playlist' && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {item.urls?.length || 0}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl mr-4 ${item.type === 'playlist' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'} group-hover:scale-110 transition-transform duration-200`}>
                    {item.type === 'playlist' ? <List size={22} /> : <Youtube size={22} />}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                    {item.description}
                  </div>
                </div>
              </div>

              {/* 右側：操作 */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 ml-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                  className={`p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${isFavorite ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'animate-pulse' : ''} />
                </button>
                
                <div className="flex flex-col items-end">
                  <span className="flex items-center text-xs">
                    <Eye size={12} className="mr-1" /> {item.visits || 0}
                  </span>
                  <span className="flex items-center text-xs">
                    <Download size={12} className="mr-1" /> {item.downloads || 0}
                  </span>
                </div>
                
                <span className="hidden md:inline text-xs opacity-60">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ItemList;
