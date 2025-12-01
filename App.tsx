import React, { useState, useRef } from 'react';
import { CameraView } from './components/CameraView';
import { Dashboard } from './components/Dashboard';
import { ExerciseHUD } from './components/ExerciseHUD';
import { DietHUD } from './components/DietHUD';
import { Community } from './components/Community';
import { HealthReport } from './components/HealthReport';
import { AppMode, UserProfile, FoodAnalysis, FoodLog, TrafficLight, Emotion } from './types';
import { LayoutDashboard, Dumbbell, Utensils, Users, FileBarChart } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Mock User State with new features
  const [user, setUser] = useState<UserProfile>({
    weight: 70,
    height: 175,
    age: 28,
    gender: 'male',
    activityLevel: 'moderate',
    dailyCalorieTarget: 2200,
    caloriesBurnedToday: 350,
    caloriesConsumedToday: 850,
    waterIntake: 750, // ml
    waterGoal: 2500, // ml
    healthPlan: {
      weeklyWeightGoal: -0.5,
      dailyCalorieBudget: 2200,
      exerciseFocus: "有氧与核心训练",
      exerciseFrequency: "每周 4 次",
      safetyTip: "减重速度建议控制在每周 0.5-1kg，避免肌肉流失。"
    },
    activeChallenge: {
      id: 'sugar-free',
      title: '7天告别含糖饮料',
      durationDays: 7,
      currentDay: 3,
      tasks: [
        { day: 1, title: '识别隐形糖', description: '检查所有食品标签', knowledgeCard: '很多“健康”饮料其实含糖量惊人，留意配料表前三位。', completed: true },
        { day: 2, title: '替换下午茶', description: '用黑咖啡或茶代替奶茶', knowledgeCard: '咖啡因能提升代谢，但糖分会造成胰岛素波动。', completed: true },
        { day: 3, title: '多喝水', description: '今日饮水目标达成 100%', knowledgeCard: '缺水有时会被大脑误判为饥饿感。', completed: false },
      ]
    },
    foodLogs: [
      {
        id: 'mock-1',
        foodName: '燕麦拿铁',
        calories: 250,
        timestamp: new Date(new Date().setHours(8, 30)),
        trafficLight: TrafficLight.GREEN,
        emotion: Emotion.NEUTRAL
      },
      {
        id: 'mock-2',
        foodName: '牛肉芝士汉堡',
        calories: 600,
        timestamp: new Date(new Date().setHours(12, 15)),
        trafficLight: TrafficLight.RED,
        emotion: Emotion.STRESS
      }
    ],
    yesterdayFoodLogs: [
       {
        id: 'mock-old-1',
        foodName: '全麦面包',
        calories: 150,
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        trafficLight: TrafficLight.GREEN,
        emotion: Emotion.NEUTRAL
      },
      {
        id: 'mock-old-2',
        foodName: '炸鸡腿',
        calories: 800,
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
        trafficLight: TrafficLight.RED,
        emotion: Emotion.HAPPY
      }
    ]
  });

  const handleUpdateCalories = (amount: number) => {
    setUser(prev => ({
      ...prev,
      caloriesBurnedToday: prev.caloriesBurnedToday + amount
    }));
  };

  const handleLogFood = (food: FoodAnalysis, emotion: Emotion = Emotion.NEUTRAL) => {
    const newLog: FoodLog = {
      id: Date.now().toString(),
      foodName: food.foodName,
      calories: food.totalCalories,
      timestamp: new Date(),
      trafficLight: food.trafficLight,
      emotion: emotion
    };

    setUser(prev => ({
      ...prev,
      caloriesConsumedToday: prev.caloriesConsumedToday + food.totalCalories,
      foodLogs: [newLog, ...prev.foodLogs] // Add new log to the top
    }));
  };

  return (
    // Change h-screen to h-[100dvh] to handle mobile browser address bars correctly
    <div className="h-[100dvh] w-screen bg-black text-white relative overflow-hidden flex flex-col">
      
      {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full">
        {mode === AppMode.DASHBOARD && (
          <Dashboard user={user} setUser={setUser} />
        )}
        
        {mode === AppMode.COMMUNITY && (
          <Community />
        )}

        {mode === AppMode.REPORT && (
          <HealthReport />
        )}

        {(mode === AppMode.AR_EXERCISE || mode === AppMode.AR_DIET) && (
          /* AR Container */
          <div className="absolute inset-0">
            <CameraView videoRef={videoRef} />
            {mode === AppMode.AR_EXERCISE && (
              <ExerciseHUD user={user} updateCalories={handleUpdateCalories} videoRef={videoRef} />
            )}
            {mode === AppMode.AR_DIET && (
              <DietHUD user={user} onLogFood={handleLogFood} />
            )}
            {/* Dark Gradient Overlay at bottom for text readability if needed */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
          </div>
        )}
      </div>

      {/* Navigation Bar - Changed to FIXED positioning to ensure it stays visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-gray-800 safe-area-pb z-50 w-full">
        <div className="flex justify-between items-center px-4 py-2">
          
          <button 
            onClick={() => setMode(AppMode.DASHBOARD)}
            className={`flex flex-col items-center p-1 min-w-[3rem] transition-colors ${mode === AppMode.DASHBOARD ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">概览</span>
          </button>

          <button 
            onClick={() => setMode(AppMode.AR_EXERCISE)}
            className={`flex flex-col items-center p-1 min-w-[3rem] transition-colors ${mode === AppMode.AR_EXERCISE ? 'text-green-400' : 'text-gray-500'}`}
          >
            <Dumbbell className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">AR运动</span>
          </button>

          <button 
            onClick={() => setMode(AppMode.AR_DIET)}
            className={`flex flex-col items-center p-1 min-w-[3rem] transition-colors ${mode === AppMode.AR_DIET ? 'text-cyan-400' : 'text-gray-500'}`}
          >
            <Utensils className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">AR饮食</span>
          </button>

          <button 
            onClick={() => setMode(AppMode.COMMUNITY)}
            className={`flex flex-col items-center p-1 min-w-[3rem] transition-colors ${mode === AppMode.COMMUNITY ? 'text-yellow-400' : 'text-gray-500'}`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">社区</span>
          </button>

          <button 
            onClick={() => setMode(AppMode.REPORT)}
            className={`flex flex-col items-center p-1 min-w-[3rem] transition-colors ${mode === AppMode.REPORT ? 'text-purple-400' : 'text-gray-500'}`}
          >
            <FileBarChart className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">报告</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default App;