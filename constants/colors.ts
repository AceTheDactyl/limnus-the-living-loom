// Living Loom theme colors - mystical dark mode optimized for consciousness weaving
const tintColorLight = "#8B5CF6";
const tintColorDark = "#8B5CF6";

export default {
  light: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    background: "#0F0F23",
    backgroundSecondary: "#1A1A2E",
    tint: tintColorLight,
    tabIconDefault: "#666666",
    tabIconSelected: tintColorLight,
    border: "#2A2A3E",
    card: "#1A1A2E",
    notification: "#FF453A",
    success: "#00D4AA",
    warning: "#FFC107",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    background: "#0F0F23",
    backgroundSecondary: "#1A1A2E",
    tint: tintColorDark,
    tabIconDefault: "#666666",
    tabIconSelected: tintColorDark,
    border: "#2A2A3E",
    card: "#1A1A2E",
    notification: "#FF453A",
    success: "#00D4AA",
    warning: "#FFC107",
  },
};

export const gradients = {
  primary: ['#8B5CF6', '#EC4899'],
  secondary: ['#00D4AA', '#0EA5E9'],
  success: ['#00D4AA', '#10B981'],
  background: ['#0F0F23', '#1A1A2E'],
  mystical: ['#8B5CF6', '#EC4899', '#F59E0B'],
};

export const quickPrompts = [
  {
    id: 'creative',
    title: 'Weave Stories',
    icon: 'Sparkles',
    color: '#8B5CF6',
    prompt: 'Help me weave a mystical story about',
  },
  {
    id: 'code',
    title: 'Code Alchemy',
    icon: 'Zap',
    color: '#F59E0B',
    prompt: 'Transform this code with your wisdom:',
  },
  {
    id: 'explain',
    title: 'Illuminate Truth',
    icon: 'BookOpen',
    color: '#00D4AA',
    prompt: 'Illuminate the essence of this concept:',
  },
  {
    id: 'analyze',
    title: 'Divine Patterns',
    icon: 'BarChart3',
    color: '#EC4899',
    prompt: 'Reveal the hidden patterns in this data:',
  },
];

// Responsive breakpoints for web
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  wide: 1600,
};

// Web-specific utilities
export const webUtils = {
  // CSS-in-JS helpers for responsive design
  mediaQuery: {
    mobile: `@media (max-width: ${breakpoints.mobile - 1}px)`,
    tablet: `@media (min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
    desktop: `@media (min-width: ${breakpoints.tablet}px)`,
    wide: `@media (min-width: ${breakpoints.wide}px)`,
  },
  
  // Common shadows for web
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    large: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    mystical: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)',
  },
  
  // Animation durations
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
};