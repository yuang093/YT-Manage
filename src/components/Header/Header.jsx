// Header 元件
import { Youtube, Zap, Sun, Moon, Clock, Plus, Settings, LogOut, Lock, Loader2, Heart } from 'lucide-react';

export const Header = ({ setView, isAdmin, handleLogout, isLoading, isDarkMode, toggleTheme, autoDarkMode, setAutoDarkMode }) => (
  <nav className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 dark:from-red-900 dark:via-red-800 dark:to-red-900 text-white shadow-lg transition-all duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
          <div className="relative">
            <Youtube className="w-8 h-8 mr-2" />
            <Zap className="w-4 h-4 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-tight">YT 管理大師 V18.4</span>
          {isLoading && <span className="ml-3 flex items-center text-xs bg-red-700 dark:bg-red-950 px-2 py-1 rounded text-white opacity-80"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> 同步中...</span>}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-red-700 dark:hover:bg-red-800 transition-colors focus:outline-none"
            title={isDarkMode ? "切換亮色模式" : "切換深色模式"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setAutoDarkMode(a => !a)} 
            className={`p-2 rounded-full transition-colors focus:outline-none ${autoDarkMode ? 'bg-purple-600 text-white' : 'hover:bg-red-700 dark:hover:bg-red-800'}`}
            title={autoDarkMode ? "自動深夜模式: 開 (22:00-06:00 強制暗色)" : "自動深夜模式: 關"}
          >
            {autoDarkMode ? <Clock size={16} /> : <Clock size={16} className="opacity-50"/>}
          </button>
          
          <a
            href="https://service.jkopay.com/r/transfer?j=Transfer:901055756"
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-3 py-2 rounded-md text-sm font-bold overflow-hidden group transition-all duration-300"
            title="斗內"
          >
            {/* 科技風格背景 */}
            <span className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 opacity-90 group-hover:opacity-100 transition-opacity rounded-md"></span>
            {/* 格子光澤效果 */}
            <span className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:200%_100%] group-hover:bg-[position:100%_0] transition-all duration-500"></span>
            {/* 底部發光 */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-green-400 blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></span>
            {/* 按鈕內容 */}
            <span className="relative z-10 flex items-center text-green-900 font-bold tracking-wide">
              <Heart className="w-4 h-4 mr-1 animate-pulse" />
              <span className="hidden sm:inline">斗內</span>
            </span>
          </a>
          
          <button onClick={() => setView('create')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">新增頁面</span>
          </button>
          {isAdmin ? (
            <div className="flex items-center space-x-2">
               <button onClick={() => setView('admin')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
                <Settings className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">後台</span>
              </button>
              <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium bg-red-800 dark:bg-red-950 hover:bg-red-900 dark:hover:bg-red-900 flex items-center transition-colors">
                <LogOut className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">登出</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setView('login')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-800 flex items-center transition-colors">
              <Lock className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">管理員</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

export default Header;
