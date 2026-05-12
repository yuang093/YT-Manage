// LoginView
import { Lock } from 'lucide-react';

export const LoginView = ({ onLogin, setView }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
      <div className="flex flex-col items-center mb-6">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">管理員登入</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">輸入管理員密碼以存取後台功能</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onLogin(e.target.password.value); }}>
        <input type="password" name="password" placeholder="請輸入密碼" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500" autoFocus />
        <button type="submit" className="w-full mt-4 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">登入</button>
      </form>
      <button onClick={() => setView('home')} className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">返回首頁</button>
    </div>
  </div>
);

export default LoginView;
