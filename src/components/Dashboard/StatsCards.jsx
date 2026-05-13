// 統計卡片
import { Youtube, Eye, Download, List } from 'lucide-react';

export const StatsCards = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 group card-hover stats-card border-gradient">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">總項目數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</div>
        </div>
        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
          <Youtube className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 group card-hover stats-card border-gradient">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">總訪問次數</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVisits}</div>
        </div>
        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
          <Eye className="w-6 h-6 text-green-500" />
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500 group card-hover stats-card border-gradient">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">總下載/點擊</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</div>
        </div>
        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
          <Download className="w-6 h-6 text-purple-500" />
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-yellow-500 group card-hover stats-card border-gradient">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">清單 / 單曲</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.playlists} / {stats.singles}</div>
        </div>
        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 group-hover:scale-110 transition-transform">
          <List className="w-6 h-6 text-yellow-500" />
        </div>
      </div>
    </div>
  </div>
);

export default StatsCards;
