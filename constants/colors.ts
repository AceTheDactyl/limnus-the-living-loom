const tintColorLight = "#007AFF";
const tintColorDark = "#0A84FF";

export default {
  light: {
    text: "#1C1C1E",
    textSecondary: "#8E8E93",
    background: "#FFFFFF",
    backgroundSecondary: "#F2F2F7",
    tint: tintColorLight,
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorLight,
    border: "#E5E5EA",
    card: "#FFFFFF",
    notification: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    background: "#000000",
    backgroundSecondary: "#1C1C1E",
    tint: tintColorDark,
    tabIconDefault: "#8E8E93",
    tabIconSelected: tintColorDark,
    border: "#38383A",
    card: "#1C1C1E",
    notification: "#FF453A",
    success: "#30D158",
    warning: "#FF9F0A",
  },
};

export const gradients = {
  primary: ['#007AFF', '#5856D6'],
  secondary: ['#FF9500', '#FF6B35'],
  success: ['#34C759', '#30D158'],
  background: ['#F2F2F7', '#FFFFFF'],
};

export const quickPrompts = [
  {
    id: 'creative',
    title: 'Creative Writing',
    icon: 'Sparkles',
    color: '#007AFF',
    prompt: 'Help me write a creative story about',
  },
  {
    id: 'code',
    title: 'Code Help',
    icon: 'Zap',
    color: '#FF9500',
    prompt: 'Help me debug this code:',
  },
  {
    id: 'explain',
    title: 'Explain Concept',
    icon: 'BookOpen',
    color: '#34C759',
    prompt: 'Explain this concept in simple terms:',
  },
  {
    id: 'analyze',
    title: 'Data Analysis',
    icon: 'BarChart3',
    color: '#5856D6',
    prompt: 'Help me analyze this data:',
  },
];
