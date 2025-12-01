import React, { useState, useEffect, useRef } from 'react';
import { ARItem, ExerciseGameMode, UserProfile, RouteRecommendation, ActivityOpportunity } from '../types';
import { Play, Trophy, MapPin, Activity, Flame, Gauge, Zap, Navigation, Mountain, Sunrise, Scan, Volume2, Footprints } from 'lucide-react';
import { getRouteRecommendation, analyzeEnvironmentForActivity, generateSpeech } from '../services/geminiService';
import { captureFrame } from './CameraView';

interface ExerciseHUDProps {
  user: UserProfile;
  updateCalories: (amount: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const ExerciseHUD: React.FC<ExerciseHUDProps> = ({ user, updateCalories, videoRef }) => {
  const [gameMode, setGameMode] = useState<ExerciseGameMode>(ExerciseGameMode.NONE);
  const [items, setItems] = useState<ARItem[]>([]);
  const [score, setScore] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0); // km/h
  const [motionIntensity, setMotionIntensity] = useState(0); // 0-100
  const [currentRoute, setCurrentRoute] = useState<RouteRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<ActivityOpportunity[]>([]);
  const [isStable, setIsStable] = useState(true); // Sensor fusion: is device stable?
  
  // Audio Context for TTS
  const audioContextRef = useRef<AudioContext | null>(null);

  // Refs for Motion Detection
  const requestRef = useRef<number>();
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  
  // Initialize hidden canvas and Audio
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; 
    canvas.height = 32;
    motionCanvasRef.current = canvas;

    // Sensor Fusion: Device Motion
    const handleMotion = (event: DeviceMotionEvent) => {
        const a = event.accelerationIncludingGravity;
        if (!a) return;
        // Simple magnitude check
        const magnitude = Math.sqrt((a.x || 0)**2 + (a.y || 0)**2 + (a.z || 0)**2);
        // If deviating significantly from 9.8 (gravity), it's moving
        const movement = Math.abs(magnitude - 9.8);
        setIsStable(movement < 1.5); // Threshold for "stable enough to scan"
    };
    
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
        if (window.DeviceMotionEvent) window.removeEventListener('devicemotion', handleMotion);
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  // --- TTS Logic ---
  const playAudio = async (text: string) => {
      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const buffer = await generateSpeech(text);
          const audioBuffer = await audioContextRef.current.decodeAudioData(buffer);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.start(0);
      } catch (e) {
          console.error("Audio Play Error", e);
      }
  };

  // --- Environment Scan Logic ---
  const performEnvironmentScan = async () => {
      if (!videoRef.current || !isStable) return; // Only scan if stable
      
      const frame = captureFrame(videoRef.current);
      if (!frame) return;

      try {
          // No loading spinner here to keep it immersive, just subtle updates
          const opps = await analyzeEnvironmentForActivity(frame);
          if (opps.length > 0) {
            setOpportunities(opps);
          }
      } catch (e) {
          console.error("Scan failed", e);
      }
  };

  // Toggle Scanning when in SCAN mode
  useEffect(() => {
      if (gameMode === ExerciseGameMode.SCAN) {
          // Initial scan
          performEnvironmentScan();
          // Periodically scan (every 4s) to avoid API spam and overheating
          scanIntervalRef.current = window.setInterval(performEnvironmentScan, 4000);
      } else {
          setOpportunities([]); // Clear when leaving mode
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      }
      return () => {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      };
  }, [gameMode]);


  const handleStartRoute = async () => {
    setLoading(true);
    setGameMode(ExerciseGameMode.ROUTE);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            // 1. Get Route Recommendation
            const route = await getRouteRecommendation(latitude, longitude);
            setCurrentRoute(route);
            setLoading(false);
            
            // 2. Play Audio Description
            if (route.audioPrompt) {
                playAudio(route.audioPrompt);
            }
            
            // 3. Generate Visual Path
            const waypoints: ARItem[] = [];
            for(let i=0; i<6; i++) {
                waypoints.push({
                    id: `wp-${i}`,
                    type: 'WAYPOINT',
                    x: 50 + (Math.random() * 20 - 10), // Winding path
                    y: 70 - (i * 10),
                    value: 0,
                    depth: 1 - (i * 0.12)
                });
            }
            setItems(waypoints);
            setNotification(`已规划: ${route.routeName}`);

        }, (err) => {
            console.error(err);
            setLoading(false);
            setNotification("定位失败，使用模拟路线。");
            setItems([{ id: 'wp-0', type: 'WAYPOINT', x: 50, y: 50, value: 0, depth: 1 }]);
        });
    } else {
        setLoading(false);
        setNotification("设备不支持定位。");
    }
  };

  // Main Loop (Visuals & Motion)
  useEffect(() => {
    const loop = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !motionCanvasRef.current) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }

      // --- Optical Flow (Motion Estimation) ---
      const ctx = motionCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 32, 32);
        const frame = ctx.getImageData(0, 0, 32, 32);
        const data = frame.data;
        let diff = 0;

        if (prevFrameData.current) {
          const prev = prevFrameData.current;
          for (let i = 0; i < data.length; i += 16) { 
            const val = data[i] + data[i+1] + data[i+2];
            const prevVal = prev[i] + prev[i+1] + prev[i+2];
            diff += Math.abs(val - prevVal);
          }
        }
        prevFrameData.current = data;

        const rawMotion = Math.min(100, diff / 500); 
        setMotionIntensity(prev => prev * 0.8 + rawMotion * 0.2);
        
        let currentSpeed = 0;
        if (rawMotion > 5) currentSpeed = rawMotion / 4;
        if (currentSpeed > 15) currentSpeed = 15;
        
        setSpeed(prev => {
            const next = prev * 0.9 + currentSpeed * 0.1; 
            return next < 0.1 ? 0 : next;
        });

        // --- Game Logic ---
        if (currentSpeed > 2) updateCalories(currentSpeed * 0.002);

        if (gameMode !== ExerciseGameMode.NONE) {
          setItems(prev => {
            if (gameMode === ExerciseGameMode.CHASE) {
                // ... Existing Chase Logic ...
                if (prev.length === 0) return [{ id: 'spirit', type: 'SPIRIT', x: 50, y: 50, value: 0 }];
                return prev.map(item => {
                    const moveSpeed = speed > 5 ? 0.2 : 2; 
                    let newX = item.x + (Math.random() - 0.5) * moveSpeed;
                    let newY = item.y + (Math.random() - 0.5) * moveSpeed;
                    return { ...item, x: Math.max(10, Math.min(90, newX)), y: Math.max(10, Math.min(90, newY)) };
                });
            } else if (gameMode === ExerciseGameMode.COLLECT) {
                // ... Existing Collect Logic ...
                if (prev.length < 3 && Math.random() > 0.98 && speed > 3) {
                    return [...prev, { id: Math.random().toString(), type: Math.random() > 0.8 ? 'GEM' : 'COIN', x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, value: 10 }];
                }
            } else if (gameMode === ExerciseGameMode.ROUTE) {
                if (speed > 2) {
                   return prev.map(item => {
                      if (item.type === 'WAYPOINT') {
                          const newY = item.y + (speed * 0.05); 
                          const newDepth = (item.depth || 0.5) + (speed * 0.001);
                          if (newY > 100) return { ...item, y: 30, depth: 0.2, x: 50 + (Math.random()*20-10) };
                          return { ...item, y: newY, depth: newDepth };
                      }
                      return item;
                   });
                }
            }
            return prev;
          });
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gameMode, speed, updateCalories, videoRef]);

  const handleCollect = (item: ARItem) => {
     // ... Existing Collect Handler ...
     setItems(prev => prev.filter(i => i.id !== item.id));
     setScore(s => s + 10);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <div className="glass-panel p-3 rounded-lg flex flex-col items-start min-w-[120px]">
          <div className="text-xs text-gray-400 uppercase">今日消耗</div>
          <div className="text-xl font-bold text-green-400 flex items-center">
             <Flame className="w-5 h-5 mr-1" />
             {Number(user.caloriesBurnedToday.toFixed(1))} / {Math.round(user.dailyCalorieTarget)}
          </div>
        </div>
        
        {/* Route Info / Audio Controls */}
        {gameMode === ExerciseGameMode.ROUTE && currentRoute && (
            <div className="glass-panel p-2 rounded-full flex items-center animate-pulse border border-green-500/50" onClick={() => currentRoute.audioPrompt && playAudio(currentRoute.audioPrompt)}>
                <Volume2 className="w-5 h-5 text-green-400 mx-2" />
                <span className="text-xs mr-2">播放语音导航</span>
            </div>
        )}
      </div>

      {/* Center: Scan Mode Overlays */}
      {gameMode === ExerciseGameMode.SCAN && (
          <>
            {/* Scan Reticle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyan-500/30 rounded-lg flex flex-col items-center justify-center opacity-70">
                {!isStable && <div className="text-red-400 text-xs bg-black/50 px-2 py-1 rounded mb-2">请保持相机稳定</div>}
                <Scan className={`w-32 h-32 ${isStable ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
                <p className="text-xs text-cyan-300 mt-2 bg-black/50 px-2 rounded">正在寻找燃脂机会...</p>
            </div>
            
            {/* Identified Opportunities */}
            {opportunities.map((opp, idx) => (
                <div 
                    key={idx}
                    className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
                    style={{ left: `${opp.x}%`, top: `${opp.y}%` }}
                >
                    <div className={`p-2 rounded-lg border shadow-lg backdrop-blur-md flex flex-col items-center max-w-[120px] text-center
                        ${opp.calorieDiff > 0 ? 'bg-green-900/60 border-green-500' : 'bg-red-900/60 border-red-500'}`}>
                        <div className="text-lg mb-1">{opp.type === 'STAIRS' ? '🪜' : opp.type === 'ELEVATOR' ? '🛗' : '📍'}</div>
                        <div className="text-xs font-bold text-white leading-tight">{opp.label}</div>
                        <div className={`text-xs font-mono mt-1 ${opp.calorieDiff > 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {opp.calorieDiff > 0 ? '+' : ''}{opp.calorieDiff} kcal
                        </div>
                    </div>
                    {/* Heatmap-like glow */}
                    <div className={`absolute inset-0 rounded-full blur-xl -z-10 ${opp.calorieDiff > 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`} style={{width: '150%', height: '150%', left: '-25%', top: '-25%'}}></div>
                </div>
            ))}
          </>
      )}

      {/* Center: Route Waypoints */}
      {gameMode === ExerciseGameMode.ROUTE && (
         <div className="absolute inset-0 pointer-events-auto perspective-1000">
             {items.map(item => (
                <div key={item.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) scale(${item.depth || 1})` }}>
                    {item.type === 'WAYPOINT' && (
                       <div className="flex flex-col items-center opacity-80">
                           <div className="w-24 h-8 bg-green-500/30 border-x border-green-400 transform skew-x-12 blur-[1px]"></div>
                           <Footprints className="w-8 h-8 text-green-400 -mt-2 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" />
                       </div>
                    )}
                </div>
             ))}
         </div>
      )}

      {/* Loading State */}
      {loading && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto backdrop-blur-sm z-50">
             <div className="text-center">
                 <Activity className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                 <h3 className="text-green-400 font-bold text-lg">AI 正在规划路线</h3>
                 <p className="text-sm text-gray-300 mt-2">分析地形 • 估算热量 • 生成语音导航</p>
             </div>
         </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-3 pointer-events-auto px-4 overflow-x-auto pb-4">
         <button 
           onClick={() => { setGameMode(ExerciseGameMode.CHASE); setCurrentRoute(null); }}
           className={`flex-shrink-0 p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center w-20 ${gameMode === ExerciseGameMode.CHASE ? 'bg-blue-600 border-white' : 'bg-black/60 border-gray-600'}`}
         >
           <Activity className="w-5 h-5 text-white mb-1" />
           <span className="text-[10px]">游戏模式</span>
         </button>
         
         <button 
           onClick={() => { setGameMode(ExerciseGameMode.SCAN); setCurrentRoute(null); }}
           className={`flex-shrink-0 p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center w-20 ${gameMode === ExerciseGameMode.SCAN ? 'bg-cyan-600 border-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-black/60 border-gray-600'}`}
         >
           <Scan className="w-5 h-5 text-white mb-1" />
           <span className="text-[10px]">环境扫描</span>
         </button>

         <button 
           onClick={handleStartRoute}
           className={`flex-shrink-0 p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center w-20 ${gameMode === ExerciseGameMode.ROUTE ? 'bg-green-600 border-white shadow-[0_0_15px_rgba(22,163,74,0.5)]' : 'bg-black/60 border-gray-600'}`}
         >
           <Navigation className="w-5 h-5 text-white mb-1" />
           <span className="text-[10px]">智能路线</span>
         </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-4/5 pointer-events-auto z-50">
           <div className="glass-panel p-4 rounded-xl border-l-4 border-yellow-500 animate-slide-down bg-black/90 shadow-xl">
              <p className="text-sm font-medium text-white">{notification}</p>
              <button onClick={() => setNotification(null)} className="text-xs text-gray-400 mt-2 w-full text-right">关闭</button>
           </div>
        </div>
      )}
    </div>
  );
};