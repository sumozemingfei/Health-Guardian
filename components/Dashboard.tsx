import React, { useState } from 'react';
import { UserProfile, TrafficLight, Emotion, HealthPlan } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Settings, User, TrendingUp, Droplets, Trophy, Calendar, Zap, ChevronRight, Info, Plus } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dietTab, setDietTab] = useState<'today' | 'yesterday'>('today');

  // Mifflin-St Jeor Equation
  const calculateBMR = (w: number, h: number, a: number, g: 'male' | 'female') => {
    if (g === 'male') return 10 * w + 6.25 * h - 5 * a + 5;
    return 10 * w + 6.25 * h - 5 * a - 161;
  };

  const generateSmartPlan = (w: number, h: number, a: number, g: 'male' | 'female', activity: string): HealthPlan => {
    const bmr = calculateBMR(w, h, a, g);
    // Activity factor
    let factor = 1.2;
    if (activity === 'light') factor = 1.375;
    if (activity === 'moderate') factor = 1.55;
    if (activity === 'active') factor = 1.725;

    const tdee = Math.round(bmr * factor);
    const deficit = 500; // Standard safe deficit
    const target = Math.max(1200, tdee - deficit); // Don't go below 1200

    return {
      weeklyWeightGoal: -0.5,
      dailyCalorieBudget: target,
      exerciseFocus: activity === 'sedentary' ? "低冲击有氧 (步行/游泳)" : "HIIT & 力量训练",
      exerciseFrequency: activity === 'sedentary' ? "每日 30 分钟" : "每周 4-5 次",
      safetyTip: `根据您的BMI数据，建议每周减重 0.5kg 为宜。${target < 1400 ? '注意补充维生素。' : ''}`
    };
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const w = Number(formData.get('weight'));
    const h = Number(formData.get('height'));
    const a = Number(formData.get('age'));
    const g = formData.get('gender') as 'male' | 'female';
    const activity = formData.get('activity') as string;
    
    const newPlan = generateSmartPlan(w, h, a, g, activity);

    setUser({
      ...user,
      weight: w,
      height: h,
      age: a,
      gender: g,
      activityLevel: activity as any,
      dailyCalorieTarget: newPlan.dailyCalorieBudget,
      healthPlan: newPlan
    });
    setIsEditing(false);
  };

  const handleDrinkWater = () => {
    setUser({
      ...user,
      waterIntake: Math.min(user.waterGoal, user.waterIntake + 250)
    });
  };

  const data = [
    { name: 'Consumed', value: user.caloriesConsumedToday },
    { name: 'Remaining', value: Math.max(0, user.dailyCalorieTarget - user.caloriesConsumedToday) },
  ];
  
  const COLORS = ['#ef4444', '#374151']; 

  const getEmotionIcon = (e?: Emotion) => {
    switch(e) {
      case Emotion.HAPPY: return '😄';
      case Emotion.STRESS: return '😫';
      case Emotion.BOREDOM: return '🥱';
      case Emotion.SAD: return '😢';
      default: return '😐';
    }
  };

  const getLightLabel = (light: TrafficLight) => {
      switch (light) {
          case TrafficLight.GREEN: return '绿灯';
          case TrafficLight.YELLOW: return '黄灯';
          case TrafficLight.RED: return '红灯';
          default: return light;
      }
  };

  const currentDietLogs = dietTab === 'today' ? user.foodLogs : user.yesterdayFoodLogs;
  const currentDietTotal = currentDietLogs.reduce((acc, log) => acc + log.calories, 0);

  if (isEditing) {
    return (
      <div className="h-full overflow-y-auto p-6 bg-gray-900 pb-24">
        <h2 className="text-2xl font-bold mb-6 text-cyan-400">定制您的健康计划</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
           {/* Form inputs same as before but added Activity Level */}
           <div>
             <label className="block text-sm text-gray-400">体重 (kg)</label>
             <input name="weight" type="number" defaultValue={user.weight} className="w-full bg-gray-800 p-3 rounded text-white border border-gray-700" />
           </div>
           <div>
             <label className="block text-sm text-gray-400">身高 (cm)</label>
             <input name="height" type="number" defaultValue={user.height} className="w-full bg-gray-800 p-3 rounded text-white border border-gray-700" />
           </div>
           <div>
             <label className="block text-sm text-gray-400">年龄</label>
             <input name="age" type="number" defaultValue={user.age} className="w-full bg-gray-800 p-3 rounded text-white border border-gray-700" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm text-gray-400">性别</label>
               <select name="gender" defaultValue={user.gender} className="w-full bg-gray-800 p-3 rounded text-white border border-gray-700">
                 <option value="male">男</option>
                 <option value="female">女</option>
               </select>
             </div>
             <div>
               <label className="block text-sm text-gray-400">活动量</label>
               <select name="activity" defaultValue={user.activityLevel} className="w-full bg-gray-800 p-3 rounded text-white border border-gray-700">
                 <option value="sedentary">久坐不动</option>
                 <option value="light">轻度活动</option>
                 <option value="moderate">中度活动</option>
                 <option value="active">高强度</option>
               </select>
             </div>
           </div>
           
           <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30 text-sm text-blue-200 mt-4">
              <Info className="w-4 h-4 inline mr-2" />
              我们将根据您的资料为您生成专属的安全减脂计划。
           </div>

           <button type="submit" className="w-full bg-cyan-600 p-3 rounded font-bold mt-4 shadow-lg shadow-cyan-900/50">生成智能计划</button>
           <button type="button" onClick={() => setIsEditing(false)} className="w-full bg-gray-700 p-3 rounded font-bold">取消</button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black pb-24 scrollbar-hide">
      
      {/* Header */}
      <div className="p-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            AR 健康守卫
          </h1>
          <p className="text-gray-400 text-xs">第 12 天 • 保持连胜 🔥</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="p-2 bg-gray-800 rounded-full border border-gray-700">
          <Settings className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* 1. Personalized Plan Summary */}
      {user.healthPlan && (
        <div className="mx-4 mt-2 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-xl p-4 border border-indigo-500/30">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-indigo-100 flex items-center">
               <Zap className="w-4 h-4 mr-2 text-yellow-400" /> 您的专属计划
             </h3>
             <span className="text-xs bg-indigo-500/30 px-2 py-0.5 rounded text-indigo-200">进行中</span>
          </div>
          <div className="flex justify-between text-center divide-x divide-indigo-500/30">
             <div className="px-2">
               <p className="text-[10px] text-gray-300">每周目标</p>
               <p className="font-bold text-white text-sm">{user.healthPlan.weeklyWeightGoal} kg</p>
             </div>
             <div className="px-2">
               <p className="text-[10px] text-gray-300">热量预算</p>
               <p className="font-bold text-white text-sm">{user.healthPlan.dailyCalorieBudget}</p>
             </div>
             <div className="px-2">
               <p className="text-[10px] text-gray-300">运动建议</p>
               <p className="font-bold text-white text-sm truncate max-w-[80px]">{user.healthPlan.exerciseFrequency}</p>
             </div>
          </div>
          <p className="text-[10px] text-indigo-200 mt-3 flex items-center bg-black/20 p-2 rounded">
             <Info className="w-3 h-3 mr-1" /> {user.healthPlan.safetyTip}
          </p>
        </div>
      )}

      {/* 2. Micro-Habit Challenge */}
      {user.activeChallenge && (
        <div className="mx-4 mt-4 bg-gray-900 rounded-xl p-4 border border-gray-800">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-white flex items-center">
                 <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                 {user.activeChallenge.title}
              </h3>
              <span className="text-xs text-gray-400">Day {user.activeChallenge.currentDay}/{user.activeChallenge.durationDays}</span>
           </div>
           
           {/* Progress Bar */}
           <div className="w-full bg-gray-800 h-1.5 rounded-full mb-3">
              <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{width: `${(user.activeChallenge.currentDay / user.activeChallenge.durationDays) * 100}%`}}></div>
           </div>

           {/* Today's Task */}
           <div className="bg-black/40 rounded-lg p-3 flex items-start">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center mt-0.5 ${user.activeChallenge.tasks[user.activeChallenge.currentDay-1].completed ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                  {user.activeChallenge.tasks[user.activeChallenge.currentDay-1].completed && <span className="text-[10px] text-black font-bold">✓</span>}
              </div>
              <div>
                 <p className="text-sm font-medium text-gray-200">{user.activeChallenge.tasks[user.activeChallenge.currentDay-1].title}</p>
                 <p className="text-xs text-gray-400 mt-0.5">{user.activeChallenge.tasks[user.activeChallenge.currentDay-1].description}</p>
                 
                 {/* Knowledge Card */}
                 <div className="mt-2 text-[10px] text-blue-300 bg-blue-900/20 px-2 py-1 rounded inline-block">
                    💡 知识卡片: {user.activeChallenge.tasks[user.activeChallenge.currentDay-1].knowledgeCard}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 3. Water Tracker */}
      <div className="mx-4 mt-4 bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
         <div className="flex items-center">
             <div className="relative w-12 h-12 mr-3 flex items-center justify-center">
                 <Droplets className="w-6 h-6 text-blue-400 z-10" />
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" className="text-gray-800 stroke-current" strokeWidth="4" fill="none"/>
                    <circle cx="24" cy="24" r="20" className="text-blue-500 stroke-current" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset={125 - (125 * (user.waterIntake / user.waterGoal))} />
                 </svg>
             </div>
             <div>
                <p className="text-sm font-bold text-gray-200">饮水追踪</p>
                <p className="text-xs text-gray-400">{user.waterIntake} / {user.waterGoal} ml</p>
             </div>
         </div>
         <button 
           onClick={handleDrinkWater}
           className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white p-2 rounded-lg flex items-center text-xs font-bold"
         >
           <Plus className="w-4 h-4 mr-1" /> 250ml
         </button>
      </div>

      {/* Stats Cards (Condensed) */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 relative overflow-hidden">
           <p className="text-gray-400 text-[10px] uppercase">剩余热量</p>
           <p className="text-xl font-bold text-white">{Math.max(0, user.dailyCalorieTarget - user.caloriesConsumedToday)}</p>
           <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="bg-white h-full" style={{width: `${(user.caloriesConsumedToday/user.dailyCalorieTarget)*100}%`}}></div>
           </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 relative overflow-hidden">
           <p className="text-gray-400 text-[10px] uppercase">运动消耗</p>
           <p className="text-xl font-bold text-green-400">{Number(user.caloriesBurnedToday.toFixed(1))}</p>
           <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
             <div className="bg-green-500 h-full" style={{width: '60%'}}></div>
           </div>
        </div>
      </div>

      {/* 4. Diet Comparison & Log */}
      <div className="mx-4 bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-sm font-bold text-gray-300">饮食记录</h3>
           <div className="bg-gray-800 p-0.5 rounded-lg flex text-[10px]">
              <button 
                onClick={() => setDietTab('yesterday')}
                className={`px-3 py-1 rounded-md transition-colors ${dietTab === 'yesterday' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                昨日
              </button>
              <button 
                onClick={() => setDietTab('today')}
                className={`px-3 py-1 rounded-md transition-colors ${dietTab === 'today' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
              >
                今日
              </button>
           </div>
        </div>

        {/* Daily Summary Line */}
        <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg mb-3">
           <span className="text-xs text-gray-400">总摄入</span>
           <span className={`text-sm font-bold ${currentDietTotal > user.dailyCalorieTarget ? 'text-red-400' : 'text-green-400'}`}>
             {currentDietTotal} / {user.dailyCalorieTarget} kcal
           </span>
        </div>

        {currentDietLogs.length === 0 ? (
           <p className="text-xs text-gray-500 text-center py-4">暂无记录</p>
        ) : (
           <div className="space-y-3">
             {currentDietLogs.map(log => (
               <div key={log.id} className="flex items-center justify-between border-b border-gray-800 pb-2 last:border-0">
                  <div className="flex flex-col">
                     <p className="font-bold text-sm text-gray-200 flex items-center">
                        {log.foodName}
                        {log.emotion && log.emotion !== Emotion.NEUTRAL && (
                          <span className="ml-2 text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                             {getEmotionIcon(log.emotion)} {log.emotion}
                          </span>
                        )}
                     </p>
                     <p className="text-[10px] text-gray-500">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <p className="font-bold text-white text-sm">{log.calories} kcal</p>
                     <span className={`text-[10px] px-1.5 py-0.5 rounded border mt-1 scale-90 origin-right ${
                       log.trafficLight === TrafficLight.GREEN ? 'text-green-400 border-green-900 bg-green-900/20' :
                       log.trafficLight === TrafficLight.YELLOW ? 'text-yellow-400 border-yellow-900 bg-yellow-900/20' :
                       'text-red-400 border-red-900 bg-red-900/20'
                     }`}>
                       {getLightLabel(log.trafficLight)}
                     </span>
                  </div>
               </div>
             ))}
           </div>
        )}
      </div>

    </div>
  );
};