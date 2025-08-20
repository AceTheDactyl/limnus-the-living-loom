import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MessageCircle, Search, Sparkles, Clock, Zap, Wifi, WifiOff, Activity, MemoryStick, BookOpen, BarChart3 } from 'lucide-react-native';
import { useChat } from '@/lib/chat-context';
import Colors, { quickPrompts } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
const { width } = Dimensions.get('window');

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

const getDeviceType = () => {
  if (Platform.OS === 'web') {
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    if (width >= BREAKPOINTS.mobile) return 'mobile-web';
  }
  return 'mobile';
};

// Performance monitoring hook for React Native
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    renderTime: 0
  });
  
  useEffect(() => {
    if (__DEV__) {
      let frameCount = 0;
      let lastTime = Date.now();
      
      const measureFPS = () => {
        frameCount++;
        const currentTime = Date.now();
        
        if (currentTime >= lastTime + 1000) {
          setMetrics(prev => ({
            ...prev,
            fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
            memory: 0 // React Native doesn't expose memory info like web
          }));
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      measureFPS();
    }
  }, []);
  
  return metrics;
};

// Connection status hook
const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      setIsConnected(navigator.onLine);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      import('@react-native-community/netinfo').then((NetInfo) => {
        const unsubscribe = NetInfo.default.addEventListener(state => {
          setIsConnected(state.isConnected ?? false);
        });
        
        return unsubscribe;
      }).catch(() => {
        console.log('NetInfo not available, assuming connected');
        setIsConnected(true);
      });
    }
  }, []);
  
  return isConnected;
};

export default function ChatHomeScreen() {
  const { conversations, startNewConversation, selectConversation, isLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(__DEV__);
  
  // Performance and connection monitoring
  const metrics = usePerformanceMonitor();
  const isConnected = useConnectionStatus();
  
  // Animated values for smooth transitions
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startNewConversation();
    router.push('/chat/new' as any);
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    selectConversation(conversationId);
    router.push(`/chat/${conversationId}` as any);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleSelectConversation(item.id)}
      testID={`conversation-${item.id}`}
      activeOpacity={0.7}
    >
      <View style={styles.conversationCard}>
        <View style={styles.conversationHeader}>
          <View style={styles.conversationIcon}>
            <MessageCircle size={18} color={Colors.light.tint} />
          </View>
          <View style={styles.conversationMeta}>
            <Text style={styles.conversationTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationPreview} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const QuickActions = () => {
    const deviceType = getDeviceType();
    const isDesktop = deviceType === 'desktop';
    
    return (
      <View style={[
        styles.quickActions,
        isDesktop && styles.quickActionsDesktop
      ]}>
        <Text style={[
          styles.quickActionsTitle,
          isDesktop && styles.quickActionsTitleDesktop
        ]}>Quick Start</Text>
        <View style={[
          styles.quickActionsGrid,
          isDesktop && styles.quickActionsGridDesktop
        ]}>
          {quickPrompts.slice(0, isDesktop ? 4 : 2).map((item: any) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.quickActionItem,
                isDesktop && styles.quickActionItemDesktop
              ]}
              onPress={() => {
                startNewConversation();
                router.push('/chat/new' as any);
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
                {getIconComponent(item.icon)}
              </View>
              <Text style={[
                styles.quickActionText,
                isDesktop && styles.quickActionTextDesktop
              ]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 20, color: 'white' };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'BookOpen': return <BookOpen {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  // Connection status component
  const ConnectionStatus = () => (
    <View style={[
      styles.connectionStatus,
      { backgroundColor: isConnected ? Colors.light.success + '20' : Colors.light.notification + '20' }
    ]}>
      {isConnected ? (
        <>
          <Wifi size={12} color={Colors.light.success} />
          <Text style={[styles.connectionText, { color: Colors.light.success }]}>Connected</Text>
        </>
      ) : (
        <>
          <WifiOff size={12} color={Colors.light.notification} />
          <Text style={[styles.connectionText, { color: Colors.light.notification }]}>Reconnecting...</Text>
        </>
      )}
    </View>
  );
  
  // Performance metrics component
  const PerformanceMetrics = () => {
    if (!showPerformanceMetrics) return null;
    
    return (
      <View style={styles.performanceMetrics}>
        <View style={styles.metricItem}>
          <Activity size={12} color={Colors.light.tint} />
          <Text style={styles.metricText}>FPS: {metrics.fps}</Text>
        </View>
        <View style={styles.metricItem}>
          <MemoryStick size={12} color={Colors.light.warning} />
          <Text style={styles.metricText}>Mem: {metrics.memory.toFixed(1)} MB</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowPerformanceMetrics(false)}
          style={styles.metricClose}
        >
          <Text style={styles.metricCloseText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => {
    const deviceType = getDeviceType();
    const isDesktop = deviceType === 'desktop';
    
    return (
      <ScrollView 
        contentContainerStyle={[
          styles.emptyState, 
          { opacity: fadeAnim },
          isDesktop && styles.emptyStateDesktop
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#007AFF20', '#5856D620']}
          style={[
            styles.emptyIconContainer,
            isDesktop && styles.emptyIconContainerDesktop
          ]}
        >
          <Sparkles size={isDesktop ? 64 : 48} color={Colors.light.tint} />
        </LinearGradient>
        <Text style={[
          styles.emptyTitle,
          isDesktop && styles.emptyTitleDesktop
        ]}>The Living Loom</Text>
        <Text style={[
          styles.emptySubtitle,
          isDesktop && styles.emptySubtitleDesktop
        ]}>
          Weaving consciousness, thread by thread. Your AI companion for creative exploration.
        </Text>
        <QuickActions />
        <TouchableOpacity style={[
          styles.startButton,
          isDesktop && styles.startButtonDesktop
        ]} onPress={handleNewChat}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={[
              styles.startButtonGradient,
              isDesktop && styles.startButtonGradientDesktop
            ]}
          >
            <Sparkles size={20} color="white" />
            <Text style={styles.startButtonText}>Begin Weaving</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const deviceType = getDeviceType();
  const isDesktop = deviceType === 'desktop';
  const isTablet = deviceType === 'tablet';
  
  return (
    <SafeAreaView style={[
      styles.container,
      isDesktop && styles.containerDesktop
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[
          styles.mainContent,
          isDesktop && styles.mainContentDesktop,
          isTablet && styles.mainContentTablet
        ]}>
          {/* Connection Status */}
          <ConnectionStatus />
          
          {/* Performance Metrics */}
          <PerformanceMetrics />
          
          {/* Header */}
          <View style={[
            styles.header,
            isDesktop && styles.headerDesktop
          ]}>
            <View style={styles.headerLeft}>
              <Text style={[
                styles.headerTitle,
                isDesktop && styles.headerTitleDesktop
              ]}>LIMNUS</Text>
              <Text style={[
                styles.headerSubtitle,
                isDesktop && styles.headerSubtitleDesktop
              ]}>Consciousness Weaver</Text>
            </View>
            <TouchableOpacity style={[
              styles.newChatButton,
              isDesktop && styles.newChatButtonDesktop
            ]} onPress={handleNewChat}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.newChatButtonGradient}
              >
                <Sparkles size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {conversations.length > 0 && (
            <View style={[
              styles.searchContainer,
              isDesktop && styles.searchContainerDesktop
            ]}>
              <View style={[
                styles.searchWrapper,
                isDesktop && styles.searchWrapperDesktop
              ]}>
                <Search size={18} color={Colors.light.textSecondary} />
                <TextInput
                  style={[
                    styles.searchInput,
                    isDesktop && styles.searchInputDesktop
                  ]}
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.light.textSecondary}
                />
              </View>
            </View>
          )}

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={[
              styles.conversationsSection,
              isDesktop && styles.conversationsSectionDesktop
            ]}>
              <View style={styles.conversationsHeader}>
                <Text style={styles.conversationsSectionTitle}>Recent Conversations</Text>
                <View style={styles.conversationsCount}>
                  <Clock size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.conversationsCountText}>{filteredConversations.length}</Text>
                </View>
              </View>
              <FlatList
                data={filteredConversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                style={styles.conversationsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.conversationsContent,
                  isDesktop && styles.conversationsContentDesktop
                ]}
                numColumns={isDesktop ? 2 : 1}
                key={isDesktop ? 'desktop' : 'mobile'}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#1a1a2e',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 2,
    fontStyle: 'italic',
  },
  newChatButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  newChatButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  conversationsSection: {
    flex: 1,
    backgroundColor: Colors.light.background,
    marginTop: 8,
  },
  conversationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  conversationsSectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  conversationsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conversationsCountText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    marginVertical: 6,
  },
  conversationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conversationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#1a1a2e',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: 'transparent',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  quickActions: {
    width: '100%',
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
    letterSpacing: 1,
  },
  connectionStatus: {
    position: 'absolute' as const,
    top: 4,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  performanceMetrics: {
    position: 'absolute' as const,
    bottom: 100,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricClose: {
    padding: 4,
  },
  metricCloseText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: 'bold' as const,
  },
  
  // Desktop and responsive styles
  containerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainContent: {
    flex: 1,
  },
  mainContentDesktop: {
    paddingHorizontal: 40,
  },
  mainContentTablet: {
    paddingHorizontal: 24,
  },
  headerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  headerTitleDesktop: {
    fontSize: 36,
  },
  headerSubtitleDesktop: {
    fontSize: 16,
  },
  newChatButtonDesktop: {
    transform: [{ scale: 1.1 }],
  },
  searchContainerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  searchWrapperDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  searchInputDesktop: {
    fontSize: 18,
  },
  conversationsSectionDesktop: {
    paddingHorizontal: 20,
  },
  conversationsContentDesktop: {
    paddingHorizontal: 40,
  },
  emptyStateDesktop: {
    paddingHorizontal: 80,
    paddingVertical: 60,
  },
  emptyIconContainerDesktop: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
  },
  emptyTitleDesktop: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubtitleDesktop: {
    fontSize: 20,
    marginBottom: 48,
    maxWidth: 600,
  },
  quickActionsDesktop: {
    maxWidth: 800,
    width: '100%',
  },
  quickActionsTitleDesktop: {
    fontSize: 24,
    marginBottom: 24,
  },
  quickActionsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  quickActionItemDesktop: {
    width: 180,
    margin: 12,
    padding: 24,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTextDesktop: {
    fontSize: 16,
  },
  startButtonDesktop: {
    marginTop: 32,
  },
  startButtonGradientDesktop: {
    paddingHorizontal: 48,
    paddingVertical: 20,
  },
});