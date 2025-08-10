import { useState } from 'react';
import { ArrowLeft, Shield, Plus, Minus, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Insurance() {
  const navigate = useNavigate();
  const { players, updatePlayerInsuranceFee, togglePlayerInsurance } = useGameStore();

  // 处理单个玩家保费增加
  const handleIncreasePlayerFee = (playerId: string, playerName: string) => {
    updatePlayerInsuranceFee(playerId, 1500);
  };

  // 处理单个玩家保费减少
  const handleDecreasePlayerFee = (playerId: string, playerName: string) => {
    updatePlayerInsuranceFee(playerId, -1500);
  };

  // 处理玩家保险状态切换
  const handleTogglePlayerInsurance = (playerId: string) => {
    togglePlayerInsurance(playerId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 sm:py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-full sm:max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">官方保险界面</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">管理玩家保险费用</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-full sm:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
        {/* 玩家保费列表 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200/50">
            <h2 className="text-lg font-semibold text-gray-900">玩家保费详情</h2>
            <p className="text-sm text-gray-500 mt-1">查看和管理每位玩家的保险费用</p>
          </div>
          
          <div className="divide-y divide-gray-200/50">
            {players.map((player, index) => (
              <div key={player.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex flex-col gap-4">
                  {/* 玩家信息和保费 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: player.color }}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
                        <p className="text-sm text-gray-500">玩家 #{index + 1}</p>
                      </div>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-lg sm:text-xl font-bold text-blue-600 truncate">¥{player.insuranceFee.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">当前保费</p>
                    </div>
                  </div>
                  
                  {/* 保险状态和操作按钮 */}
                  <div className="flex items-center justify-between gap-4">
                    {/* 保险状态显示 */}
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors duration-200",
                        player.insuranceEnabled ? "bg-green-500" : "bg-gray-400"
                      )}></div>
                      <span className={cn(
                        "text-xs sm:text-sm font-medium transition-colors duration-200",
                        player.insuranceEnabled ? "text-green-600" : "text-gray-500"
                      )}>
                        {player.insuranceEnabled ? "已启用" : "已停用"}
                      </span>
                      {/* 保险切换按钮 */}
                      <button
                        onClick={() => handleTogglePlayerInsurance(player.id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg font-medium text-xs transition-all duration-200 hover:scale-105",
                          player.insuranceEnabled 
                            ? "bg-red-100 text-red-700 hover:bg-red-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        )}
                      >
                        <Power size={12} />
                        <span className="hidden sm:inline">
                          {player.insuranceEnabled ? "停用" : "启用"}
                        </span>
                      </button>
                    </div>
                    
                    {/* 保费调整按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecreasePlayerFee(player.id, player.name)}
                        className={cn(
                          "flex items-center gap-1 px-2 sm:px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600",
                          "text-white rounded-lg font-medium transition-all duration-200 text-sm",
                          "hover:from-red-600 hover:to-pink-700 hover:scale-105 hover:shadow-lg",
                          "flex-1 sm:flex-none justify-center min-w-0"
                        )}
                      >
                        <Minus size={14} />
                        <span className="hidden sm:inline">1500</span>
                        <span className="sm:hidden text-xs">-1.5K</span>
                      </button>
                      
                      <button
                        onClick={() => handleIncreasePlayerFee(player.id, player.name)}
                        className={cn(
                          "flex items-center gap-1 px-2 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600",
                          "text-white rounded-xl font-medium transition-all duration-200",
                          "hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg",
                          "flex-1 sm:flex-none justify-center min-w-0"
                        )}
                      >
                        <Plus size={16} />
                        <span className="hidden sm:inline">+¥1,500</span>
                        <span className="sm:hidden text-xs">+1.5K</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* 说明信息 */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-200/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg mt-1 flex-shrink-0">
              <Shield className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">保险机制说明</h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>• 每名玩家的初始保费为 ¥1,500</li>
                <li>• 保费会随着游戏进程递增：¥1,500 → ¥3,000 → ¥4,500...</li>
                <li>• 可以单独调整某位玩家的保费，支持增加和减少操作</li>
                <li>• 保费调整会实时保存到游戏数据中</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}