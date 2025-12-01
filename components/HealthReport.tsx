import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { AIReport, WeeklyStats } from '../types';
import { generateHealthReport } from '../services/geminiService';
import { BrainCircuit, Loader2, Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

export const HealthReport: React.FC = () => {
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock Historical Data for the last 7 days
  const weeklyStats: WeeklyStats = {
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    caloriesBurned: [350, 420, 300, 500, 450, 600, 380],
    caloriesConsumed: [2100, 1950, 2300, 2000, 1850, 2400, 1900],
    weight: [70.5, 70.4, 70.4, 70.2, 70.1, 70.3, 70.0],
  };

  const chartData = weeklyStats.dates.map((day, i) => ({
    name: day,
    burn: weeklyStats.caloriesBurned[i],
    eat: weeklyStats.caloriesConsumed[i],
    weight: weeklyStats.weight[i]
  }));

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await generateHealthReport(weeklyStats);
      setReport(result);
    } catch (e) {
      console.error(e);
      // Fallback if API fails or mock needed for offline dev
      setReport({
        healthScore: 85,
        summary: "本周表现稳中有进！运动量逐步提升，周末有轻微饮食放纵，但总体热量缺口保持良好。",
        strengths: ["周四运动量达到峰值", "平均每日热量摄入控制在目标范围内", "体重呈现缓慢下降趋势"],
        weaknesses: ["周三和周六摄入略高", "睡眠时间波动较大（推测）"],
        prediction: "按照目前趋势，预计下个月可减重 1.5kg。",
        advice: "尝试在周末保持与工作日相同的饮食节奏。下周可以增加一次高强度间歇训练（HIIT）。"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-black pb-24 overflow-y-auto scrollbar-hide">
      
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
          智能健康周报
        </h1>

        {/* Action Button */}
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
             <div className="w-32 h-32 rounded-full bg-purple-500/10 flex items-center justify-center animate-pulse">
                <BrainCircuit className="w-16 h-16 text-purple-400" />
             </div>
             <p className="text-gray-400 text-center text-sm px-8">
               AI 将分析您过去 7 天的运动与饮食数据，生成深度健康诊断与未来预测。
             </p>
             <button 
               onClick={handleGenerateReport}
               className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold shadow-lg shadow-purple-900/50 hover:scale-105 transition-transform"
             >
               生成 AI 报告
             </button>
          </div>
        )}

        {loading && (
           <div className="flex flex-col items-center justify-center py-20">
             <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
             <p className="text-gray-300">正在分析数据模型...</p>
             <p className="text-xs text-gray-500 mt-2">正在连接 Gemini 健康引擎</p>
           </div>
        )}

        {/* Report Content */}
        {report && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Score Card */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-t border-purple-500/30">
               <div>
                 <p className="text-gray-400 text-sm">本周健康评分</p>
                 <p className="text-4xl font-bold text-white">{report.healthScore}</p>
                 <p className="text-xs text-purple-300 mt-1">{report.summary.slice(0, 20)}...</p>
               </div>
               <div className="w-20 h-20 rounded-full border-4 border-purple-500 flex items-center justify-center bg-purple-900/20">
                  <span className="text-xl">S</span>
               </div>
            </div>

            {/* AI Summary */}
            <div className="glass-panel p-5 rounded-2xl">
               <div className="flex items-center mb-3">
                 <BrainCircuit className="w-5 h-5 text-purple-400 mr-2" />
                 <h3 className="font-bold text-gray-200">AI 综合诊断</h3>
               </div>
               <p className="text-sm text-gray-300 leading-relaxed mb-4">
                 {report.summary}
               </p>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                    <div className="flex items-center mb-2 text-green-400 text-xs font-bold uppercase">
                      <TrendingUp className="w-3 h-3 mr-1" /> 亮点
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                      {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                 </div>
                 <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <div className="flex items-center mb-2 text-red-400 text-xs font-bold uppercase">
                      <AlertTriangle className="w-3 h-3 mr-1" /> 待改进
                    </div>
                     <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                      {report.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                 </div>
               </div>
            </div>

            {/* Trend Charts */}
            <div className="glass-panel p-4 rounded-2xl">
               <h3 className="font-bold text-gray-200 mb-4 text-sm">热量收支趋势</h3>
               <div className="h-48 w-full text-xs">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                     <XAxis dataKey="name" stroke="#666" />
                     <Tooltip 
                        contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px'}}
                     />
                     <Bar dataKey="burn" name="运动消耗" fill="#34d399" radius={[4, 4, 0, 0]} stackId="a" />
                     <Bar dataKey="eat" name="饮食摄入" fill="#f87171" radius={[4, 4, 0, 0]} alpha={0.5} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl">
               <h3 className="font-bold text-gray-200 mb-4 text-sm">体重变化曲线</h3>
               <div className="h-40 w-full text-xs">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                     <XAxis dataKey="name" stroke="#666" />
                     <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#666" />
                     <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px'}} />
                     <Area type="monotone" dataKey="weight" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWeight)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Prediction & Advice */}
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-5 rounded-2xl border border-white/10">
               <div className="flex items-start mb-3">
                 <Target className="w-5 h-5 text-blue-400 mr-2 mt-1" />
                 <div>
                   <h3 className="font-bold text-blue-100 text-sm">未来趋势预测</h3>
                   <p className="text-sm text-blue-200 mt-1">{report.prediction}</p>
                 </div>
               </div>
               <div className="w-full h-px bg-white/10 my-3"></div>
               <div className="flex items-start">
                 <Lightbulb className="w-5 h-5 text-yellow-400 mr-2 mt-1" />
                 <div>
                   <h3 className="font-bold text-yellow-100 text-sm">下周建议</h3>
                   <p className="text-sm text-yellow-200 mt-1">{report.advice}</p>
                 </div>
               </div>
            </div>

            <button 
              onClick={() => setReport(null)}
              className="w-full py-3 text-gray-500 text-sm"
            >
              关闭报告
            </button>

          </div>
        )}
      </div>
    </div>
  );
};