// 骨架屏元件
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg animate-pulse border-l-4 border-gray-300 dark:border-gray-600">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 w-12 h-12"></div>
    </div>
  </div>
);

export const SkeletonListItem = () => (
  <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
    <div className="flex items-center flex-1">
      <div className="w-28 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mr-4"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* 統計卡片骨架 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
    </div>
    {/* 列表骨架 */}
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      {[1, 2, 3, 4, 5].map(i => <SkeletonListItem key={i} />)}
    </div>
  </div>
);