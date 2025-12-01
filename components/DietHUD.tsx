import React, { useState } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Info, Smile, Frown, Meh } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { captureFrame } from './CameraView';
import { FoodAnalysis, TrafficLight, UserProfile, Emotion } from '../types';

interface DietHUDProps {
  user: UserProfile;
  onLogFood: (food: FoodAnalysis, emotion: Emotion) => void;
}

export const DietHUD: React.FC<DietHUDProps> = ({ user, onLogFood }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(Emotion.NEUTRAL);

  const handleScan = async () => {
    const video = document.querySelector('video');
    if (!video) return;

    const frame = captureFrame(video);
    if (!frame) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSelectedEmotion(Emotion.NEUTRAL); // Reset emotion

    try {
      const data = await analyzeFoodImage(frame);
      setResult(data);
    } catch (err) {
      setError("无法识别食物，请重试。");
    } finally {
      setAnalyzing(false);
    }
  };

  const getLightColor = (light: TrafficLight) => {
    switch (light) {
      case TrafficLight.GREEN: return 'text-green-500 border-green-500';
      case TrafficLight.YELLOW: return 'text-yellow-500 border-yellow-500';
      case TrafficLight.RED: return 'text-red-500 border-red-500';
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

  const remainingCals = user.dailyCalorieTarget - user.caloriesConsumedToday;

  const emotionOptions = [
    { type: Emotion.NEUTRAL, icon: '😐', label: '平静' },
    { type: Emotion.HAPPY, icon: '😄', label: '开心' },
    { type: Emotion.STRESS, icon: '😫', label: '压力' },
    { type: Emotion.BOREDOM, icon: '🥱', label: '无聊' },
  ];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
      
      {/* Top Info */}
      <div className="mt-4 mx-4 glass-panel p-3 rounded-lg text-center pointer-events-auto">
         <h2 className="text-sm text-cyan-400 font-bold uppercase tracking-widest">AR 营养扫描仪</h2>
         <p className="text-xs text-gray-300">今日剩余配额: {remainingCals} kcal</p>
      </div>

      {/* Scanner Frame / Reticle */}
      {!result && !analyzing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-cyan-500/50 rounded-lg flex items-center justify-center">
           <div className="w-60 h-60 border border-white/20 rounded relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
           </div>
           <p className="absolute -bottom-8 text-xs text-cyan-300 animate-pulse">对准食物 • 包含参照物</p>
        </div>
      )}

      {/* Analysis Loading */}
      {analyzing && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <p className="text-cyan-400 font-mono">AI 分析成分中...</p>
              <p className="text-xs text-gray-400 mt-2">正在构建3D模型与估算热量</p>
            </div>
         </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="absolute top-20 left-4 right-4 bottom-24 overflow-y-auto pointer-events-auto">
          <div className={`glass-panel rounded-xl border-l-4 p-4 ${getLightColor(result.trafficLight).split(' ')[1]}`}>
            
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{result.foodName}</h3>
              <div className={`px-2 py-1 rounded text-xs font-bold border ${getLightColor(result.trafficLight)}`}>
                {getLightLabel(result.trafficLight)}
              </div>
            </div>

            <div className="text-3xl font-bold mb-4">
              {result.totalCalories} <span className="text-sm font-normal text-gray-400">kcal</span>
            </div>

            {/* Impact Calculation */}
            <div className="mb-4 bg-white/5 p-2 rounded">
               <p className="text-xs text-gray-300 mb-1">占今日剩余额度:</p>
               <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                 <div 
                   className={`h-full ${remainingCals < result.totalCalories ? 'bg-red-500' : 'bg-cyan-500'}`} 
                   style={{width: `${Math.min(100, (result.totalCalories / (remainingCals || 1)) * 100)}%`}}
                 ></div>
               </div>
               <p className="text-right text-xs mt-1 text-gray-400">{(result.totalCalories / (remainingCals || 1) * 100).toFixed(0)}%</p>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-400 uppercase">成分分解:</p>
              {result.components.map((c, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-white/10 pb-1">
                  <span>{c.name} {c.weight_g ? `(${c.weight_g}g)` : ''}</span>
                  <span>{c.calories} kcal</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
               <div className="flex items-start gap-2 text-sm text-gray-200 bg-blue-900/30 p-2 rounded">
                 <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                 {result.advice}
               </div>
            </div>

            {/* Emotion Tagging */}
            <div className="mb-4">
               <p className="text-xs text-gray-400 mb-2">现在的心情 (情绪化饮食记录):</p>
               <div className="flex justify-between gap-2">
                  {emotionOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setSelectedEmotion(opt.type)}
                      className={`flex-1 flex flex-col items-center p-2 rounded border transition-all ${selectedEmotion === opt.type ? 'bg-purple-600 border-purple-400' : 'bg-gray-800 border-gray-700 opacity-70'}`}
                    >
                       <span className="text-lg">{opt.icon}</span>
                       <span className="text-[10px] mt-1">{opt.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleScan()}
                className="flex-1 bg-gray-700 py-3 rounded-lg font-bold text-sm"
              >
                重试
              </button>
              <button 
                onClick={() => {
                  onLogFood(result, selectedEmotion);
                  setResult(null);
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-lg font-bold text-sm"
              >
                记录摄入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Button */}
      {!result && !analyzing && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-auto">
          <button
            onClick={handleScan}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-cyan-500/80 shadow-[0_0_20px_rgba(34,211,238,0.5)] active:scale-95 transition-transform"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};