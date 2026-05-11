// 排序下拉選單
import { useState } from 'react';
import { ArrowUpDown, Clock, Eye, Download } from 'lucide-react';

export const SortDropdown = ({ sortBy, sortOrder, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const sortOptions = [
    { value: 'createdAt', label: '建立時間', icon: Clock },
    { value: 'visits', label: '訪問量', icon: Eye },
    { value: 'downloads', label: '下載量', icon: Download },
    { value: 'title', label: '標題', icon: ArrowUpDown },
  ];
  
  const currentOption = sortOptions.find(o => o.value === sortBy) || sortOptions[0];
  const CurrentIcon = currentOption.icon;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <ArrowUpDown size={16} className="mr-2 text-gray-500" />
        <CurrentIcon size={14} className="mr-1" />
        <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>
        <span className="ml-1">{currentOption.label}</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {sortOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  if (sortBy === option.value) {
                    onSortChange(option.value, sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    onSortChange(option.value, 'desc');
                  }
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${sortBy === option.value ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-gray-700 dark:text-gray-300'}`}
              >
                <IconComponent size={14} className="mr-2" />
                {option.label}
                {sortBy === option.value && (
                  <span className="ml-auto">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
