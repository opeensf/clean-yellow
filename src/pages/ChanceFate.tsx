import { useState } from 'react';
import { ArrowLeft, Dice6, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// 事件类型定义
interface ChanceEvent {
  id: string;
  description: string;
  effects: {
    stockType: 'property' | 'education';
    change: number; // 百分比变化
  }[];
}

// 贴近中国大学生生活的机会命运事件（32个，完全均衡，期望值为正）
const chanceEvents: ChanceEvent[] = [
  // 房产股+3%，教育股-2%（8个事件）
  {
    id: 'dormitory_wifi_down',
    description: '宿舍WiFi大面积故障，学生涌向网吧和咖啡厅',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'campus_renovation',
    description: '多所高校同时进行校园改造，建筑材料需求暴涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'internship_housing',
    description: '实习季到来，一线城市短租房需求暴涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'startup_boom',
    description: '大学生创业政策利好，众创空间和孵化器需求激增',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'milk_tea_craze',
    description: '新式茶饮店在校园周边疯狂扩张，商铺租金上涨',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'esports_tournament',
    description: '大学生电竞联赛火爆，网吧和电竞馆生意兴隆',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'housing_policy',
    description: '人才引进政策出台，大学生购房补贴推动房地产市场',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  {
    id: 'campus_expansion',
    description: '多所大学宣布扩建计划，周边土地价值水涨船高',
    effects: [
      { stockType: 'property', change: 3 },
      { stockType: 'education', change: -2 }
    ]
  },
  
  // 教育股+3%，房产股-2%（8个事件）
  {
    id: 'final_exam_week',
    description: '期末考试周来临，图书馆爆满，教育培训需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'scholarship_policy',
    description: '国家奖学金政策调整，学生学习积极性大幅提升',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'graduate_job_fair',
    description: '春招秋招火爆，职业培训和简历辅导需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'civil_service_exam',
    description: '公务员考试报名人数创新高，公考培训机构爆满',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'study_group_trend',
    description: '学习小组和读书会成为新潮流，图书馆座位一位难求',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'education_reform',
    description: '教育部发布新政策，职业教育和技能培训获得大力支持',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'campus_5g_upgrade',
    description: '校园5G网络全覆盖，智慧教室和VR教学设备需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  {
    id: 'mental_health_awareness',
    description: '心理健康教育受到重视，相关课程和咨询服务需求激增',
    effects: [
      { stockType: 'education', change: 3 },
      { stockType: 'property', change: -2 }
    ]
  },
  
  // 房产股+1%，教育股+1%（8个事件）
  {
    id: 'dating_app_boom',
    description: '校园交友软件用户激增，约会场所和娱乐设施需求增加',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'new_iphone_release',
    description: '苹果发布新款iPhone，学生消费热情高涨带动整体市场',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'fitness_trend',
    description: '健身成为大学生新时尚，运动场馆和健康教育双双受益',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'idol_concert',
    description: '知名偶像团体校园巡演，带动周边商业和文化教育发展',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'campus_festival',
    description: '校园文化节盛大举办，商业区和教育活动同时繁荣',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'summer_vacation_travel',
    description: '暑期旅游hotspot，住宿业火爆，旅游教育课程也受欢迎',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'graduation_season',
    description: '毕业季到来，租房需求激增，职业规划课程也很热门',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  {
    id: 'winter_olympics_effect',
    description: '冬奥会效应持续，体育场馆建设和体育教育双双受益',
    effects: [
      { stockType: 'property', change: 1 },
      { stockType: 'education', change: 1 }
    ]
  },
  
  // 教育股-1%，房产股-1%（8个事件）
  {
    id: 'online_course_boom',
    description: '袁大屎买了恒大烂尾楼',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'traditional_culture_revival',
    description: '田琳会见许家印',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'language_learning_trend',
    description: '多语言学习成为趋势，语言培训机构和学习空间都很火爆',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'skill_certification_boom',
    description: '职业技能认证需求激增，培训中心和考试场地都很紧俏',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'research_competition',
    description: '大学生科研竞赛火热，学术培训和实验室空间需求上升',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'art_education_trend',
    description: '艺术教育受到重视，艺术培训和创作空间都很受欢迎',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'entrepreneurship_education',
    description: '创业教育兴起，相关课程火爆，创业空间也供不应求',
    effects: [
      { stockType: 'education', change:-1 },
      { stockType: 'property', change:-1 }
    ]
  },
  {
    id: 'digital_literacy_push',
    description: '数字素养教育推广，计算机培训和数字化场所双双受益',
    effects: [
      { stockType: 'education', change: -1},
      { stockType: 'property', change: -1}
    ]
  }
];

export default function ChanceFate() {
  const navigate = useNavigate();
  const { stocks, adjustStockPrice } = useGameStore();
  const [isRolling, setIsRolling] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ChanceEvent | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastPriceChanges, setLastPriceChanges] = useState<{[key: string]: number}>({});

  // 生成随机事件
  const generateRandomEvent = (): ChanceEvent => {
    // 随机选择一个预定义事件，直接使用其配置的价格变化
    const selectedEvent = chanceEvents[Math.floor(Math.random() * chanceEvents.length)];
    
    // 直接返回选中的事件，不再重新生成随机变化
    return selectedEvent;
  };

  // 执行机会命运
  const handleChanceFate = async () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setShowResult(false);
    setCurrentEvent(null);

    // 模拟转盘动画延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 生成随机事件
    const event = generateRandomEvent();
    setCurrentEvent(event);

    // 记录价格变化
    const changes: {[key: string]: number} = {};
    event.effects.forEach(effect => {
      changes[effect.stockType] = effect.change;
    });
    setLastPriceChanges(changes);

    // 应用股票价格变化
    event.effects.forEach(effect => {
      adjustStockPrice(effect.stockType, effect.change);
    });

    setShowResult(true);
    setIsRolling(false);

    // 显示成功提示
    toast.success('机会命运已触发！', {
      description: '股票价格已更新'
    });
  };

  // 重置状态
  const resetState = () => {
    setCurrentEvent(null);
    setShowResult(false);
    setLastPriceChanges({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <h1 className="text-2xl font-bold text-gray-800">机会命运</h1>
          <div className="w-20" /> {/* 占位符保持居中 */}
        </div>

        {/* 当前股票价格显示 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{stocks.property.name}</h3>
                <div className="relative inline-block">
                  <p className="text-2xl font-bold text-blue-600">¥{stocks.property.price.toFixed(2)}</p>
                  {/* 股价变化显示在数字右上角 */}
                  {lastPriceChanges.property && (
                    <div className={cn(
                      "absolute -top-1 -right-1 translate-x-full px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                      lastPriceChanges.property > 0 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {lastPriceChanges.property > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {lastPriceChanges.property > 0 ? '+' : ''}{lastPriceChanges.property}%
                    </div>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{stocks.education.name}</h3>
                <div className="relative inline-block">
                  <p className="text-2xl font-bold text-green-600">¥{stocks.education.price.toFixed(2)}</p>
                  {/* 股价变化显示在数字右上角 */}
                  {lastPriceChanges.education && (
                    <div className={cn(
                      "absolute -top-1 -right-1 translate-x-full px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                      lastPriceChanges.education > 0 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {lastPriceChanges.education > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {lastPriceChanges.education > 0 ? '+' : ''}{lastPriceChanges.education}%
                    </div>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 机会命运转盘区域 */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <div className="text-center">
            <div className="mb-6">
              <div className={cn(
                "w-32 h-32 mx-auto rounded-full border-8 border-purple-200 flex items-center justify-center transition-transform duration-2000",
                isRolling && "animate-spin"
              )}>
                <Sparkles className={cn(
                  "w-16 h-16 transition-colors duration-500",
                  isRolling ? "text-purple-600" : "text-purple-400"
                )} />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-800 mb-4">命运转盘</h2>
            <p className="text-gray-600 mb-6">
              点击下方按钮触发机会命运，随机选择事件影响两个股票的价格
            </p>
            
            <button
              onClick={handleChanceFate}
              disabled={isRolling}
              className={cn(
                "px-8 py-3 rounded-lg font-semibold transition-all duration-200",
                isRolling
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105"
              )}
            >
              <div className="flex items-center gap-2">
                <Dice6 className="w-5 h-5" />
                {isRolling ? '命运降临中...' : '触发机会命运'}
              </div>
            </button>
          </div>
        </div>

        {/* 事件结果显示 */}
        {showResult && currentEvent && (
          <div className="bg-white rounded-xl p-6 shadow-sm animate-fade-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">命运事件</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {currentEvent.description}
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={resetState}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                继续游戏
              </button>
            </div>
          </div>
        )}

        {/* 说明文字 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>每次触发机会命运都会随机影响两个股票的价格</p>
          <p>价格变化范围：±1%、±2%、±3%（数学期望约1%）</p>
        </div>
      </div>
    </div>
  );
}