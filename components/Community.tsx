import React, { useState } from 'react';
import { Post, LeaderboardUser } from '../types';
import { Heart, MessageSquare, TrendingUp, TrendingDown, Minus, Medal } from 'lucide-react';

export const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'rank'>('feed');
  const [rankPeriod, setRankPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Mock Data
  const posts: Post[] = [
    {
      id: '1',
      userName: 'FitAlice',
      avatar: '👩‍🎤',
      type: 'MOMENT',
      content: '今天在AR模式下追了那个能量精灵2公里！太累了但超有成就感！🏃‍♀️💨',
      likes: 24,
      comments: 5,
      timeAgo: '2小时前'
    },
    {
      id: '2',
      userName: 'ChefBob',
      avatar: '👨‍🍳',
      type: 'RECIPE',
      content: '分享一个低卡路里午餐：藜麦鸡胸肉沙拉。关键是酱汁要用油醋汁！🥗 #健康饮食',
      likes: 156,
      comments: 32,
      timeAgo: '5小时前'
    },
    {
      id: '3',
      userName: 'RunningMan',
      avatar: '🏃',
      type: 'EXERCISE',
      content: '解锁了新的AR收集成就！这个周末有没有人一起去滨江公园刷金币？',
      likes: 89,
      comments: 12,
      timeAgo: '1天前'
    }
  ];

  const ranking: LeaderboardUser[] = [
    { rank: 1, userName: 'IronMike', avatar: '🏋️‍♂️', score: 15400, trend: 'up' },
    { rank: 2, userName: 'YogaSara', avatar: '🧘‍♀️', score: 14250, trend: 'up' },
    { rank: 3, userName: 'You', avatar: '😎', score: 12100, trend: 'same' },
    { rank: 4, userName: 'FastTom', avatar: '🚴', score: 11800, trend: 'down' },
    { rank: 5, userName: 'HealthGuru', avatar: '🥬', score: 10500, trend: 'same' },
  ];

  const renderTrend = (trend: 'up' | 'down' | 'same') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="h-full bg-black pb-24 overflow-y-auto scrollbar-hide">
      
      {/* Header */}
      <div className="p-4 bg-black/80 backdrop-blur sticky top-0 z-10 border-b border-gray-800">
        <div className="flex justify-center space-x-1 bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'feed' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          >
            社区动态
          </button>
          <button
            onClick={() => setActiveTab('rank')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'rank' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          >
            排行榜
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <div className="p-4 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="glass-panel p-4 rounded-xl">
               <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-xl mr-3">
                    {post.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{post.userName}</h3>
                    <p className="text-xs text-gray-400">{post.timeAgo} • {post.type === 'RECIPE' ? '食谱' : post.type === 'MOMENT' ? '动态' : '运动'}</p>
                  </div>
               </div>
               <p className="text-sm text-gray-200 mb-3 leading-relaxed">{post.content}</p>
               <div className="flex items-center space-x-6 text-gray-400 text-xs">
                 <button className="flex items-center space-x-1 hover:text-red-400">
                   <Heart className="w-4 h-4" /> <span>{post.likes}</span>
                 </button>
                 <button className="flex items-center space-x-1 hover:text-blue-400">
                   <MessageSquare className="w-4 h-4" /> <span>{post.comments}</span>
                 </button>
               </div>
            </div>
          ))}
          
          {/* FAB */}
          <button className="fixed bottom-24 right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
             <span className="text-2xl font-bold">+</span>
          </button>
        </div>
      ) : (
        <div className="p-4">
           {/* Rank Toggle */}
           <div className="flex justify-end mb-4">
              <div className="flex bg-gray-800 rounded-lg p-0.5">
                 <button onClick={() => setRankPeriod('weekly')} className={`px-3 py-1 text-xs rounded-md ${rankPeriod === 'weekly' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>周榜</button>
                 <button onClick={() => setRankPeriod('monthly')} className={`px-3 py-1 text-xs rounded-md ${rankPeriod === 'monthly' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>月榜</button>
              </div>
           </div>

           <div className="space-y-3">
              {ranking.map((user) => (
                <div key={user.rank} className={`flex items-center p-3 rounded-xl ${user.rank === 3 ? 'glass-panel border-cyan-500/50' : 'bg-gray-900 border border-gray-800'}`}>
                   <div className={`w-8 font-bold text-center ${user.rank <= 3 ? 'text-yellow-400 text-xl' : 'text-gray-500'}`}>
                      {user.rank <= 3 ? <Medal className={`w-6 h-6 mx-auto ${user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-300' : 'text-amber-700'}`} /> : user.rank}
                   </div>
                   <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg mx-3 border-2 border-gray-800">
                      {user.avatar}
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-sm">{user.userName} {user.rank === 3 && <span className="text-xs text-cyan-400 ml-1">(我)</span>}</h4>
                      <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1.5">
                         <div className="bg-cyan-600 h-full rounded-full" style={{ width: `${(user.score / 16000) * 100}%` }}></div>
                      </div>
                   </div>
                   <div className="ml-4 text-right">
                      <p className="font-mono font-bold text-sm">{user.score}</p>
                      <div className="flex items-center justify-end mt-1">
                         {renderTrend(user.trend)}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};