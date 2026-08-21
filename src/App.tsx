import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, Users, Dice6, Shield, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';
import CloudRoomControl from './components/CloudRoomControl';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/stocks', icon: TrendingUp, label: '股票市场' },
    { path: '/players', icon: Users, label: '玩家管理' },
    { path: '/insurance', icon: Shield, label: '官方保险' },
    { path: '/lottery', icon: Dice6, label: '七星彩' },
    { path: '/chance-fate', icon: Sparkles, label: '机会命运' }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 flex flex-col">
      {/* 主内容区域 */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <CloudRoomControl />
      
      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white px-2 py-2">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'min-w-0 flex flex-col items-center rounded-lg px-1 py-2 transition-colors',
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon size={20} />
                <span className="mt-1 whitespace-nowrap text-[11px] sm:text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
