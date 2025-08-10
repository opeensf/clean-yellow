import { useState, useRef } from 'react';
import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

type LotteryMode = 'senior' | 'aggressive';

interface LotteryConfig {
  name: string;
  multipliers: number[];
  colors: string[];
}

const lotteryConfigs: Record<LotteryMode, LotteryConfig> = {
  senior: {
    name: '老年版',
    multipliers: [0, 0, 1, 1.5, 2, 2],
    colors: ['#87CEEB', '#87CEEB', '#1E40AF', '#8B5CF6', '#FF9999', '#CC0000']
  },
  aggressive: {
    name: '激进版',
    multipliers: [-1, -0.5, 0, 1, 3, 4],
    colors: ['#87CEEB', '#4682B4', '#1E40AF', '#8B5CF6', '#FF9999', '#CC0000']
  }
};

export default function LotteryGame() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LotteryMode>('senior');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const config = lotteryConfigs[mode];
  const sectorAngle = 360 / config.multipliers.length;

  // 旋转轮盘
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 随机旋转角度（多转几圈）
    const spins = 5 + Math.random() * 3; // 5-8圈
    const randomAngle = Math.random() * 360; // 随机停止角度
    const finalRotation = rotation + spins * 360 + randomAngle;
    
    setRotation(finalRotation);

    // 动画结束后根据最终角度计算结果
    setTimeout(() => {
      setIsSpinning(false);
      
      // 计算最终角度（取模360度）
      const finalAngle = finalRotation % 360;
      
      // 重要：指针固定在正上方（0度），轮盘旋转
      // 所以我们需要计算轮盘旋转后，哪个扇形转到了正上方
      // 轮盘顺时针旋转，所以指针相对于轮盘是逆时针移动
      const pointerRelativeAngle = (360 - finalAngle) % 360;
      
      // 扇形从0度开始（第一个扇形在正上方），每个扇形占sectorAngle度
      const sectorIndex = Math.floor(pointerRelativeAngle / sectorAngle) % config.multipliers.length;
      
      const multiplier = config.multipliers[sectorIndex];
      setResult(multiplier);
      
      if (multiplier > 0) {
        toast.success(`恭喜！获得 ${multiplier}x 倍数！`);
      } else if (multiplier === 0) {
        toast.info('平局，倍数为 0');
      } else {
        toast.error(`很遗憾，倍数为 ${multiplier}x`);
      }
    }, 3000);
  };

  // 重置轮盘
  const resetWheel = () => {
    if (isSpinning) return;
    setRotation(0);
    setResult(null);
  };

  // 生成轮盘扇形路径
  const generateSectorPath = (index: number) => {
    // 从正上方（-90度）开始，顺时针分布
    const startAngle = index * sectorAngle - 90;
    const endAngle = (index + 1) * sectorAngle - 90;
    const radius = 120;
    const centerX = 150;
    const centerY = 150;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = sectorAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // 计算文字位置
  const getTextPosition = (index: number) => {
    // 从正上方（-90度）开始，计算每个扇形中心的文字位置
    const angle = (index * sectorAngle + sectorAngle / 2 - 90) * Math.PI / 180;
    const radius = 80;
    const centerX = 150;
    const centerY = 150;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      mode === 'aggressive' ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gray-50'
    )}>
      {/* 头部 */}
      <div className={cn(
        "border-b px-4 py-3 transition-colors duration-300",
        mode === 'aggressive' 
          ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-800 text-white' 
          : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              mode === 'aggressive'
                ? 'hover:bg-red-500 text-white'
                : 'hover:bg-gray-100'
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">七星彩</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* 模式选择 */}
        <div className={cn(
          "rounded-xl p-4 shadow-sm transition-colors duration-300",
          mode === 'aggressive' 
            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
            : 'bg-white'
        )}>
          <h2 className="font-semibold mb-3">选择游戏模式</h2>
          <div className="flex gap-2">
            {Object.entries(lotteryConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setMode(key as LotteryMode)}
                disabled={isSpinning}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                  mode === key
                    ? (mode === 'aggressive' 
                        ? 'bg-red-800 text-white shadow-lg' 
                        : 'bg-blue-500 text-white')
                    : (mode === 'aggressive'
                        ? 'bg-red-500 text-red-100 hover:bg-red-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'),
                  isSpinning && 'opacity-50 cursor-not-allowed'
                )}
              >
                {config.name}
              </button>
            ))}
          </div>
          
          {/* 倍数说明 */}
          <div className={cn(
            "mt-3 p-3 rounded-lg transition-colors duration-300",
            mode === 'aggressive' 
              ? 'bg-red-800/30 backdrop-blur-sm' 
              : 'bg-gray-50'
          )}>
            <p className={cn(
              "text-sm mb-2",
              mode === 'aggressive' ? 'text-red-100' : 'text-gray-600'
            )}>倍数范围:</p>
            <div className="flex flex-wrap gap-1">
              {config.multipliers.map((multiplier, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: config.colors[index], 
                    color: 'white' 
                  }}
                >
                  {multiplier > 0 ? '+' : ''}{multiplier}x
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 轮盘 */}
        <div className={cn(
          "rounded-xl p-6 shadow-sm transition-colors duration-300",
          mode === 'aggressive' 
            ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-200' 
            : 'bg-white'
        )}>
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              {/* 指针 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                <div className="relative">
                  {/* 指针主体 - 更明显的箭头形状 */}
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg"></div>
                  {/* 指针圆点 */}
                  <div className="absolute top-[-5px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white drop-shadow-lg"></div>
                </div>
              </div>
              
              {/* 轮盘 */}
              <div 
                ref={wheelRef}
                className="relative"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 3s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
                }}
              >
                <svg width="300" height="300" className="drop-shadow-lg">
                  {config.multipliers.map((multiplier, index) => {
                    const textPos = getTextPosition(index);
                    return (
                      <g key={index}>
                        <path
                          d={generateSectorPath(index)}
                          fill={config.colors[index]}
                          stroke="white"
                          strokeWidth="2"
                        />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="16"
                          fontWeight="bold"
                        >
                          {multiplier > 0 ? '+' : ''}{multiplier}x
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* 中心圆 */}
                  <circle
                    cx="150"
                    cy="150"
                    r="20"
                    fill="white"
                    stroke="#374151"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex gap-3">
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-lg',
                  isSpinning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : (mode === 'aggressive'
                        ? 'bg-red-800 text-white hover:bg-red-900 shadow-red-300'
                        : 'bg-blue-500 text-white hover:bg-blue-600')
                )}
              >
                <Play size={20} />
                {isSpinning ? '旋转中...' : '开始旋转'}
              </button>
              
              <button
                onClick={resetWheel}
                disabled={isSpinning}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg transition-colors',
                  isSpinning
                    ? 'opacity-50 cursor-not-allowed'
                    : (mode === 'aggressive'
                        ? 'border border-red-300 text-red-100 hover:bg-red-500'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50')
                )}
              >
                <RotateCcw size={20} />
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 结果显示 */}
        {result !== null && (
          <div className={cn(
            "rounded-xl p-4 shadow-sm transition-colors duration-300",
            mode === 'aggressive' 
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-200' 
              : 'bg-white'
          )}>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">旋转结果</h3>
              <div className={cn(
                'text-4xl font-bold mb-2',
                result > 0 ? 'text-green-600' : result === 0 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {result > 0 ? '+' : ''}{result}x
              </div>
              <p className={cn(
                mode === 'aggressive' ? 'text-red-100' : 'text-gray-600'
              )}>
                {result > 0 ? '恭喜获得正倍数！' : result === 0 ? '平局，无倍数变化' : '很遗憾，获得负倍数'}
              </p>
            </div>
          </div>
        )}

        {/* 游戏说明 */}
        <div className={cn(
          "rounded-xl p-4 shadow-sm transition-colors duration-300",
          mode === 'aggressive' 
            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-200' 
            : 'bg-white'
        )}>
          <h3 className="font-semibold mb-3">游戏说明</h3>
          <div className={cn(
            "space-y-2 text-sm",
            mode === 'aggressive' ? 'text-red-100' : 'text-gray-600'
          )}>
            <p>• <strong>老年版</strong>: 倍数范围较温和，适合保守玩家</p>
            <p>• <strong>激进版</strong>: 倍数范围较极端，风险与收益并存</p>
            <p>• 点击"开始旋转"按钮转动轮盘</p>
            <p>• 轮盘停止后显示最终倍数结果</p>
            <p>• 可以随时重置轮盘重新开始</p>
          </div>
        </div>
      </div>
    </div>
  );
}