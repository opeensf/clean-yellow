import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Users, Dice6, CreditCard, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/stocks', icon: TrendingUp, label: '股票市场' },
    { path: '/players', icon: Users, label: '玩家管理' },
    { path: '/debts', icon: CreditCard, label: '欠债管理' },
    { path: '/lottery', icon: Dice6, label: '七星彩' },
    { path: '/chance-fate', icon: Sparkles, label: '机会命运' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 主内容区域 */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      
      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-lg transition-colors',
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
