import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard, Building2, Trash2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function DebtManagement() {
  const navigate = useNavigate();
  const { 
    players, 
    debts, 
    addDebt, 
    repayDebt, 
    removeDebt 
  } = useGameStore();
  
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [selectedCreditor, setSelectedCreditor] = useState<string | null>(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [repayAmounts, setRepayAmounts] = useState<{ [key: string]: string }>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取债权人名称（包括银行）
  const getCreditorName = (creditorId: string) => {
    if (creditorId === 'bank') return '银行';
    const player = players.find(p => p.id === creditorId);
    return player?.name || '未知';
  };

  // 获取债务人名称
  const getDebtorName = (debtorId: string) => {
    const player = players.find(p => p.id === debtorId);
    return player?.name || '未知';
  };

  // 获取玩家颜色
  const getPlayerColor = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.color || '#666';
  };

  // 处理玩家头像点击
  const handlePlayerClick = (playerId: string) => {
    if (!selectedDebtor) {
      // 第一次点击选择债务人
      setSelectedDebtor(playerId);
      toast.info(`已选择债务人: ${players.find(p => p.id === playerId)?.name}`);
    } else if (!selectedCreditor) {
      // 第二次点击选择债权人
      if (playerId === selectedDebtor) {
        toast.error('债务人和债权人不能是同一人');
        return;
      }
      setSelectedCreditor(playerId);
      setShowAmountInput(true);
      toast.info(`已选择债权人: ${players.find(p => p.id === playerId)?.name}`);
    } else {
      // 重新选择
      setSelectedDebtor(playerId);
      setSelectedCreditor(null);
      setShowAmountInput(false);
      setDebtAmount('');
      toast.info(`重新选择债务人: ${players.find(p => p.id === playerId)?.name}`);
    }
  };

  // 处理银行点击
  const handleBankClick = () => {
    if (!selectedDebtor) {
      toast.error('请先选择债务人');
      return;
    }
    if (!selectedCreditor) {
      setSelectedCreditor('bank');
      setShowAmountInput(true);
      toast.info('已选择债权人: 银行');
    } else {
      setSelectedCreditor('bank');
      setShowAmountInput(true);
      toast.info('已重新选择债权人: 银行');
    }
  };

  // 添加新欠款
  const handleAddDebt = () => {
    if (!selectedDebtor || !selectedCreditor || !debtAmount) {
      toast.error('请完成选择并输入金额');
      return;
    }
    
    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的欠款金额');
      return;
    }
    
    addDebt(selectedDebtor, selectedCreditor, amount);
    toast.success('欠款记录已添加');
    
    // 重置状态
    setSelectedDebtor(null);
    setSelectedCreditor(null);
    setDebtAmount('');
    setShowAmountInput(false);
  };

  // 取消选择
  const handleCancel = () => {
    setSelectedDebtor(null);
    setSelectedCreditor(null);
    setDebtAmount('');
    setShowAmountInput(false);
  };

  // 全部偿还
  const handleFullRepay = (debtId: string) => {
    repayDebt(debtId);
    toast.success('债务已全部偿还');
  };

  // 部分偿还
  const handlePartialRepay = (debtId: string) => {
    const amount = parseFloat(repayAmounts[debtId] || '0');
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的偿还金额');
      return;
    }
    
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    
    if (amount > debt.remainingAmount) {
      toast.error('偿还金额不能超过剩余欠款');
      return;
    }
    
    repayDebt(debtId, amount);
    toast.success(`已偿还 ¥${amount.toFixed(2)}`);
    setRepayAmounts({ ...repayAmounts, [debtId]: '' });
  };

  // 删除债务记录
  const handleRemoveDebt = (debtId: string) => {
    if (window.confirm('确定要删除这条债务记录吗？')) {
      removeDebt(debtId);
      toast.success('债务记录已删除');
    }
  };

  // 获取玩家头像位置
  const getPlayerPosition = (index: number, total: number) => {
    const radius = 100;
    const centerX = 200;
    const centerY = 150;
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // 获取银行位置（放在左边，玩家圈外面）
  const getBankPosition = () => {
    return { x: 20, y: 150 }; // 进一步向外移动到左边边缘
  };

  // 绘制债务连线
  const renderDebtLines = () => {
    if (!containerRef.current) return null;
    
    return debts.map((debt) => {
      const debtorIndex = players.findIndex(p => p.id === debt.debtorId);
      const creditorIndex = debt.creditorId === 'bank' ? -1 : players.findIndex(p => p.id === debt.creditorId);
      
      if (debtorIndex === -1) return null;
      
      const debtorPos = getPlayerPosition(debtorIndex, players.length);
      const creditorPos = debt.creditorId === 'bank' 
        ? getBankPosition() // 使用新的银行位置函数
        : getPlayerPosition(creditorIndex, players.length);
      
      const lineColor = debt.creditorId === 'bank' ? '#3b82f6' : '#ef4444';
      const strokeWidth = Math.max(2, Math.min(8, debt.remainingAmount / 1000));
      
      return (
        <g key={debt.id}>
          <line
            x1={debtorPos.x}
            y1={debtorPos.y}
            x2={creditorPos.x}
            y2={creditorPos.y}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            strokeDasharray="5,5"
            opacity={0.7}
          />
          {/* 债务金额标签 */}
          <text
            x={(debtorPos.x + creditorPos.x) / 2}
            y={(debtorPos.y + creditorPos.y) / 2 - 5}
            fill={lineColor}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none"
          >
            ¥{debt.remainingAmount.toFixed(0)}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                <CreditCard className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">欠债管理</h1>
                <p className="text-sm text-gray-500">可视化债务关系管理</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* 可视化债务关系 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">债务关系图</h2>
            <p className="text-sm text-gray-500 mb-6">点击头像选择债务人和债权人</p>
            
            <div ref={containerRef} className="relative w-full h-80 mx-auto max-w-md">
              {/* SVG 画布 */}
              <svg ref={svgRef} className="absolute inset-0 w-full h-full">
                {renderDebtLines()}
              </svg>
              
              {/* 银行图标 */}
              <div 
                className={cn(
                  "absolute w-20 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500",
                  "rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:shadow-xl shadow-lg border-2 border-white/30",
                  "backdrop-blur-sm",
                  selectedCreditor === 'bank' && "ring-4 ring-blue-300 scale-105 shadow-2xl"
                )}
                style={{ 
                  left: `${getBankPosition().x - 40}px`, 
                  top: `${getBankPosition().y - 24}px`,
                  background: 'linear-gradient(to right, #3b82f6, #2563eb, #06b6d4)'
                }}
                onClick={handleBankClick}
              >
                <div className="flex items-center gap-1">
                  <Building2 className="text-white drop-shadow-sm" size={20} />
                  <span className="text-white text-xs font-semibold drop-shadow-sm">银行</span>
                </div>
              </div>
              
              {/* 玩家头像 */}
              {players.map((player, index) => {
                const position = getPlayerPosition(index, players.length);
                const isSelected = selectedDebtor === player.id || selectedCreditor === player.id;
                const isDebtor = selectedDebtor === player.id;
                const isCreditor = selectedCreditor === player.id;
                
                return (
                  <div
                    key={player.id}
                    className={cn(
                      "absolute w-16 h-16 rounded-full flex items-center justify-center",
                      "cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg",
                      "text-white font-bold text-lg",
                      isSelected && "ring-4 scale-110",
                      isDebtor && "ring-red-300",
                      isCreditor && "ring-green-300",
                      !isSelected && "hover:ring-2 hover:ring-gray-300"
                    )}
                    style={{
                      left: `${position.x - 32}px`,
                      top: `${position.y - 32}px`,
                      backgroundColor: player.color
                    }}
                    onClick={() => handlePlayerClick(player.id)}
                  >
                    {player.name.charAt(0)}
                  </div>
                );
              })}
            </div>
            
            {/* 选择状态显示 */}
            <div className="mt-6 space-y-3">
              {selectedDebtor && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>债务人: {players.find(p => p.id === selectedDebtor)?.name}</span>
                </div>
              )}
              {selectedCreditor && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>债权人: {selectedCreditor === 'bank' ? '银行' : players.find(p => p.id === selectedCreditor)?.name}</span>
                </div>
              )}
            </div>
            
            {/* 金额输入 */}
            {showAmountInput && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  欠款金额
                </label>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="输入欠款金额"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddDebt}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      添加
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 债务详情列表 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200/50">
              <h2 className="text-lg font-semibold text-gray-900">债务详情</h2>
              <p className="text-sm text-gray-500 mt-1">管理现有债务记录</p>
            </div>
            
            <div className="p-4 md:p-6 max-h-96 overflow-y-auto space-y-4">
              {debts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无债务记录</p>
                  <p className="text-sm">点击左侧头像添加新的欠款记录</p>
                </div>
              ) : (
                debts.map((debt) => {
                  const debtorName = getDebtorName(debt.debtorId);
                  const creditorName = getCreditorName(debt.creditorId);
                  const debtorColor = getPlayerColor(debt.debtorId);
                  const isBank = debt.creditorId === 'bank';
                  
                  return (
                    <div key={debt.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      {/* 债务信息 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: debtorColor }}
                          >
                            {debtorName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{debtorName}</span>
                              <span className="text-gray-500">欠</span>
                              {isBank ? (
                                <div className="flex items-center gap-1">
                                  <Building2 size={16} className="text-blue-600" />
                                  <span className="font-medium text-blue-600">{creditorName}</span>
                                </div>
                              ) : (
                                <span className="font-medium">{creditorName}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              原始: ¥{debt.originalAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDebt(debt.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {/* 剩余金额 */}
                      <div className="mb-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600">
                            ¥{debt.remainingAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">剩余未还</div>
                        </div>
                      </div>
                      
                      {/* 偿还操作 */}
                      <div className="space-y-3">
                        <input
                          type="number"
                          placeholder="偿还金额"
                          min="0.01"
                          max={debt.remainingAmount}
                          step="0.01"
                          value={repayAmounts[debt.id] || ''}
                          onChange={(e) => setRepayAmounts({ 
                            ...repayAmounts, 
                            [debt.id]: e.target.value 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePartialRepay(debt.id)}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                          >
                            部分偿还
                          </button>
                          <button
                            onClick={() => handleFullRepay(debt.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            全部偿还
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        
        {/* 说明信息 */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg mt-1">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 第一次点击头像选择债务人（红色边框）</li>
                <li>• 第二次点击头像或银行选择债权人（绿色边框）</li>
                <li>• 线条粗细表示债务金额大小，虚线连接债务关系</li>
                <li>• 蓝色线条表示欠银行，红色线条表示玩家间债务</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}