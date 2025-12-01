export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  AR_EXERCISE = 'AR_EXERCISE',
  AR_DIET = 'AR_DIET',
  COMMUNITY = 'COMMUNITY',
  REPORT = 'REPORT',
}

export enum ExerciseGameMode {
  NONE = 'NONE',
  CHASE = 'CHASE', // 追逐模式
  COLLECT = 'COLLECT', // 收集模式
  ROUTE = 'ROUTE', // 智能路线模式
  SCAN = 'SCAN', // 环境热量扫描模式 (New)
}

export enum TrafficLight {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum Emotion {
  NEUTRAL = '平静',
  HAPPY = '开心',
  STRESS = '压力',
  BOREDOM = '无聊',
  SAD = '难过',
}

export interface FoodComponent {
  name: string;
  calories: number;
  weight_g?: number;
}

export interface FoodAnalysis {
  foodName: string;
  totalCalories: number;
  trafficLight: TrafficLight;
  components: FoodComponent[];
  advice: string;
  suggestion?: string; // Alternative suggestion
}

export interface FoodLog {
  id: string;
  foodName: string;
  calories: number;
  timestamp: Date;
  trafficLight: TrafficLight;
  emotion?: Emotion; // New: Emotional eating tag
}

export interface ChallengeTask {
  day: number;
  title: string;
  description: string;
  knowledgeCard: string; // Tip or fact
  completed: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  currentDay: number;
  tasks: ChallengeTask[];
}

export interface HealthPlan {
  weeklyWeightGoal: number; // e.g., -0.5 kg
  dailyCalorieBudget: number;
  exerciseFocus: string; // e.g., "Low Impact Cardio"
  exerciseFrequency: string; // e.g., "3x / week"
  safetyTip: string;
}

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  dailyCalorieTarget: number;
  caloriesBurnedToday: number;
  caloriesConsumedToday: number;
  waterIntake: number; // ml (New)
  waterGoal: number; // ml (New)
  foodLogs: FoodLog[];
  yesterdayFoodLogs: FoodLog[]; // New: For comparison
  activeChallenge?: Challenge; // New
  healthPlan?: HealthPlan; // New
}

export interface ARItem {
  id: string;
  type: 'COIN' | 'GEM' | 'SPIRIT' | 'WAYPOINT';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  value: number;
  depth?: number; // 0-1 scale for perspective (1 is close, 0 is far)
}

export interface RouteRecommendation {
  routeName: string;
  description: string;
  reason: string; // e.g., "High Incline for Burn" or "Scenic Sunset"
  estimatedCalories: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  audioPrompt?: string; // Text for TTS
}

export interface ActivityOpportunity {
  id: string;
  type: 'STAIRS' | 'ELEVATOR' | 'PATH' | 'DESK' | 'EQUIPMENT' | 'OTHER';
  label: string; // e.g. "Take Stairs"
  calorieDiff: number; // e.g. +15 (burned) or -5 (saved/not burned)
  x: number; // 0-100 approximate screen position
  y: number; // 0-100
  description: string;
}

// Community & Social
export interface Post {
  id: string;
  userName: string;
  avatar: string;
  content: string;
  image?: string;
  type: 'RECIPE' | 'MOMENT' | 'EXERCISE';
  likes: number;
  comments: number;
  timeAgo: string;
}

export interface LeaderboardUser {
  rank: number;
  userName: string;
  avatar: string;
  score: number;
  trend: 'up' | 'down' | 'same';
}

// Analysis & Report
export interface WeeklyStats {
  dates: string[];
  caloriesBurned: number[];
  caloriesConsumed: number[];
  weight: number[];
}

export interface AIReport {
  healthScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  prediction: string;
  advice: string;
}