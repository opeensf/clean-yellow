import { useState } from 'react';
import { ArrowLeft, Shield, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Insurance() {
  const navigate = useNavigate();
  const { players, updatePlayerInsuranceFee } = useGameStore();

  // 处理单个玩家保费增加
  const handleIncreasePlayerFee = (playerId: string, playerName: string) => {
    updatePlayerInsuranceFee(playerId, 1500);
    toast.success(`${playerName} 的保费已增加 ¥1,500`);
  };

  // 处理单个玩家保费减少
  const handleDecreasePlayerFee = (playerId: string, playerName: string) => {
    updatePlayerInsuranceFee(playerId, -1500);
    toast.success(`${playerName} 的保费已减少 ¥1,500`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">官方保险界面</h1>
                <p className="text-sm text-gray-500">管理玩家保险费用</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto p-6">
        {/* 玩家保费列表 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <h2 className="text-lg font-semibold text-gray-900">玩家保费详情</h2>
            <p className="text-sm text-gray-500 mt-1">查看和管理每位玩家的保险费用</p>
          </div>
          
          <div className="divide-y divide-gray-200/50">
            {players.map((player, index) => (
              <div key={player.id} className="p-6 hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: player.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-500">玩家 #{index + 1}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">¥{player.insuranceFee.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">当前保费</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecreasePlayerFee(player.id, player.name)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600",
                          "text-white rounded-lg font-medium transition-all duration-200 text-sm",
                          "hover:from-red-600 hover:to-pink-700 hover:scale-105 hover:shadow-lg"
                        )}
                      >
                        <Minus size={14} />
                        1500
                      </button>
                      
                      <button
                        onClick={() => handleIncreasePlayerFee(player.id, player.name)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600",
                          "text-white rounded-xl font-medium transition-all duration-200",
                          "hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg"
                        )}
                      >
                        <Plus size={16} />
                        +¥1,500
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 说明信息 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg mt-1">
              <Shield className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">保险机制说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
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