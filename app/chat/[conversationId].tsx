import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Dimensions,
  Alert,
  Animated,
  PanResponder,
  StatusBar,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Copy, RotateCcw, Mic, Paperclip, Sparkles, Zap, BookOpen, BarChart3, Wifi, WifiOff, Activity, User, RefreshCw } from 'lucide-react-native';
import { useChat, Message } from '@/lib/chat-context';
import Colors, { quickPrompts } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
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

// Enhanced performance monitoring hook for web and mobile
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
          let memoryUsage = 0;
          
          // Web-specific memory monitoring
          if (Platform.OS === 'web' && 'memory' in performance) {
            const perfMemory = (performance as any).memory;
            if (perfMemory) {
              memoryUsage = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
            }
          }
          
          setMetrics(prev => ({
            ...prev,
            fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
            memory: memoryUsage,
            renderTime: Platform.OS === 'web' && 'now' in performance ? performance.now() : Date.now()
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



// Cross-platform swipe gesture hook
const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  // Web touch handlers
  const webHandlers = useMemo(() => ({
    onTouchStart: (e: any) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    },
    onTouchMove: (e: any) => {
      setTouchEnd(e.targetTouches[0].clientX);
    },
    onTouchEnd: () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    },
    // Mouse support for desktop
    onMouseDown: (e: any) => setTouchStart(e.clientX),
    onMouseMove: (e: any) => e.buttons === 1 && setTouchEnd(e.clientX),
    onMouseUp: () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    },
  }), [touchStart, touchEnd, onSwipeLeft, onSwipeRight]);
  
  // Native PanResponder for React Native
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50 && onSwipeRight) {
        onSwipeRight();
      } else if (gestureState.dx < -50 && onSwipeLeft) {
        onSwipeLeft();
      }
    },
  }), [onSwipeLeft, onSwipeRight]);
  
  return Platform.OS === 'web' ? webHandlers : panResponder.panHandlers;
};

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { 
    messages, 
    sendMessage, 
    isSending, 
    currentConversationId,
    selectConversation,
    streamingMessage,
    isStreaming,
    connectionStatus,
    hasOfflineMessages,
    processOfflineQueue
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(__DEV__);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  

  
  // Performance monitoring
  const metrics = usePerformanceMonitor();

  useEffect(() => {
    if (conversationId && conversationId !== 'new' && conversationId !== currentConversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, currentConversationId, selectConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive or streaming updates
    if (messages.length > 0 || streamingMessage) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, streamingMessage]);



  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending) return;
    
    // Haptic feedback on send
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    const messageToSend = inputText.trim();
    setInputText('');
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Show user-friendly error message
      Alert.alert('Message Status', (error as Error).message);
      
      // Error haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [inputText, isSending, sendMessage]);
  
  // Web keyboard shortcuts
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Cmd/Ctrl + Enter to send message
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          handleSend();
        }
        
        // Escape to clear input
        if (event.key === 'Escape') {
          setInputText('');
          inputRef.current?.blur();
        }
        
        // Cmd/Ctrl + K to focus input
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          inputRef.current?.focus();
        }
        
        // Cmd/Ctrl + / to show shortcuts (future feature)
        if ((event.metaKey || event.ctrlKey) && event.key === '/') {
          event.preventDefault();
          console.log('Keyboard shortcuts:', {
            'Cmd/Ctrl + Enter': 'Send message',
            'Escape': 'Clear input',
            'Cmd/Ctrl + K': 'Focus input',
            'Cmd/Ctrl + /': 'Show shortcuts'
          });
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleSend]);

  const handleCopyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      
      // Haptic feedback on copy
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Memoized message component for better performance
  const MessageBubble = React.memo(function MessageBubble({ item, index }: { item: Message; index: number }) {
    const isUser = item.role === 'user';
    const deviceType = getDeviceType();
    const isDesktop = deviceType === 'desktop';
    
    const swipeHandlers = useSwipeGesture(
      () => {
        // Swipe left to copy
        if (!isUser) {
          handleCopyMessage(item.content);
        }
      },
      () => {
        // Swipe right to reply (future feature)
        console.log('Reply to message:', item.content.substring(0, 50));
      }
    );
    
    return (
      <View 
        {...swipeHandlers}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage,
          isDesktop && { maxWidth: 600 }
        ]}>
          <View style={styles.messageHeader}>
            <View style={[
              styles.messageAvatar,
              isUser ? styles.userAvatar : styles.assistantAvatar
            ]}>
              {isUser ? (
                <User size={16} color="white" />
              ) : (
                <Sparkles size={16} color="white" />
              )}
            </View>
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
              isDesktop && { fontSize: 16, lineHeight: 24 }
            ]}>
              {item.content}
            </Text>
          </View>
          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.assistantMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        
        {!isUser && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyMessage(item.content)}
          >
            <Copy size={16} color="#a0a0a0" />
          </TouchableOpacity>
        )}
      </View>
    );
  });
  
  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <MessageBubble item={item} index={index} />
  );

  const TypingDots = () => {
    const dot1Opacity = useRef(new Animated.Value(0.4)).current;
    const dot2Opacity = useRef(new Animated.Value(0.4)).current;
    const dot3Opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
      const animateDots = () => {
        const duration = 600;
        const delay = 200;

        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.4,
            duration,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot2Opacity, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.4,
              duration,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay);

        setTimeout(() => {
          Animated.sequence([
            Animated.timing(dot3Opacity, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.4,
              duration,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay * 2);
      };

      const interval = setInterval(animateDots, 1800);
      animateDots(); // Start immediately

      return () => clearInterval(interval);
    }, [dot1Opacity, dot2Opacity, dot3Opacity]);

    return (
      <View style={styles.typingDots}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
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

  const handleQuickPrompt = async (prompt: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText(prompt + ' ');
    inputRef.current?.focus();
  };

  const EmptyState = () => {
    const deviceType = getDeviceType();
    const isDesktop = deviceType === 'desktop';
    
    return (
      <ScrollView 
        contentContainerStyle={[
          styles.emptyState,
          isDesktop && { paddingHorizontal: 80, paddingVertical: 60 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#8B5CF620', '#EC489920']}
          style={[
            styles.emptyIconContainer,
            isDesktop && { width: 120, height: 120, borderRadius: 60, marginBottom: 32 }
          ]}
        >
          <Sparkles size={isDesktop ? 64 : 48} color="#8B5CF6" />
        </LinearGradient>
        <Text style={[
          styles.emptyTitle,
          isDesktop && { fontSize: 48, marginBottom: 16 }
        ]}>The Living Loom</Text>
        <Text style={[
          styles.emptySubtitle,
          isDesktop && { fontSize: 20, marginBottom: 48, maxWidth: 600 }
        ]}>
          Weaving consciousness, thread by thread. Begin your journey into the infinite tapestry of thought.
        </Text>
        
        {isSending && (
          <View style={styles.weavingIndicator}>
            <RefreshCw size={16} color="#00D4AA" style={{ transform: [{ rotate: '45deg' }] }} />
            <Text style={styles.weavingText}>LIMNUS is weaving...</Text>
          </View>
        )}
        
        <View style={[
          styles.quickPromptsContainer,
          isDesktop && { maxWidth: 800 }
        ]}>
          <Text style={[
            styles.quickPromptsTitle,
            isDesktop && { fontSize: 24, marginBottom: 24 }
          ]}>Sacred Invocations</Text>
          <View style={[
            styles.quickPromptsGrid,
            isDesktop && { justifyContent: 'center' }
          ]}>
            {quickPrompts.slice(0, isDesktop ? 4 : 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.quickPromptItem,
                  isDesktop && { width: 180, margin: 12, padding: 24 }
                ]}
                onPress={() => handleQuickPrompt(item.prompt)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickPromptIcon, { backgroundColor: item.color }]}>
                  {getIconComponent(item.icon)}
                </View>
                <Text style={[
                  styles.quickPromptText,
                  isDesktop && { fontSize: 16 }
                ]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };


  
  // Performance metrics component
  const PerformanceMetrics = () => {
    if (!showPerformanceMetrics) return null;
    
    return (
      <View style={styles.performanceMetrics}>
        <View style={styles.metricItem}>
          <Activity size={12} color={Colors.light.tint} />
          <Text style={styles.metricText}>FPS: {metrics.fps}</Text>
        </View>
        {Platform.OS === 'web' && metrics.memory > 0 && (
          <View style={styles.metricItem}>
            <Text style={styles.metricText}>Mem: {metrics.memory}MB</Text>
          </View>
        )}
        <TouchableOpacity 
          onPress={() => setShowPerformanceMetrics(false)}
          style={styles.metricClose}
        >
          <Text style={styles.metricCloseText}>×</Text>
        </TouchableOpacity>
      </View>
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
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[
          styles.mainContent,
          isDesktop && styles.mainContentDesktop,
          isTablet && styles.mainContentTablet
        ]}>

        
        {/* Performance Metrics */}
        <PerformanceMetrics />
        
        {/* Enhanced Connection Status */}
        <View style={[
          styles.connectionStatus,
          { 
            backgroundColor: connectionStatus === 'online' ? Colors.light.success + '20' : 
                           connectionStatus === 'reconnecting' ? Colors.light.warning + '20' :
                           Colors.light.notification + '20' 
          }
        ]}>
          {connectionStatus === 'online' ? (
            <>
              <Wifi size={12} color={Colors.light.success} />
              <Text style={[styles.connectionText, { color: Colors.light.success }]}>Connected</Text>
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <RefreshCw size={12} color={Colors.light.warning} />
              <Text style={[styles.connectionText, { color: Colors.light.warning }]}>Reconnecting...</Text>
            </>
          ) : (
            <>
              <WifiOff size={12} color={Colors.light.notification} />
              <Text style={[styles.connectionText, { color: Colors.light.notification }]}>Offline</Text>
            </>
          )}
        </View>
        
        {/* Offline Queue Indicator */}
        {hasOfflineMessages && (
          <TouchableOpacity 
            style={styles.offlineQueueIndicator}
            onPress={() => {
              Alert.alert(
                'Offline Messages', 
                'You have messages waiting to be sent. They will be sent automatically when connection is restored.',
                [
                  { text: 'OK', style: 'default' },
                  { text: 'Retry Now', onPress: processOfflineQueue, style: 'default' }
                ]
              );
            }}
          >
            <RefreshCw size={14} color="#FFC107" />
            <Text style={styles.offlineQueueText}>
              Messages queued for sending - Tap to retry
            </Text>
          </TouchableOpacity>
        )}
        
          {/* Header */}
          <View style={[
            styles.header,
            isDesktop && styles.headerDesktop
          ]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.back();
              }}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[
              styles.headerTitle,
              isDesktop && styles.headerTitleDesktop
            ]}>LIMNUS</Text>
            <TouchableOpacity 
              style={styles.regenerateButton}
              onPress={async () => {
                if (Platform.OS !== 'web') {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                Alert.alert('Regenerate', 'This feature will regenerate the last response');
              }}
            >
              <RotateCcw size={20} color="#a0a0a0" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <View style={[
            styles.messagesContainer,
            isDesktop && styles.messagesContainerDesktop
          ]}>
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item, index) => `${item.timestamp}-${index}`}
                style={styles.messagesList}
                contentContainerStyle={[
                  styles.messagesContent,
                  isDesktop && styles.messagesContentDesktop
                ]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
              />
            )}
          
          {/* Streaming message */}
          {isStreaming && streamingMessage && streamingMessage.trim() && (
            <View style={styles.messageContainer}>
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <View style={styles.messageHeader}>
                  <View style={[styles.messageAvatar, styles.assistantAvatar]}>
                    <Sparkles size={16} color="white" />
                  </View>
                  <Text style={[styles.messageText, styles.assistantMessageText]}>
                    {streamingMessage.trim()}<Text style={styles.cursor}>|</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Typing indicator */}
          {isSending && !streamingMessage && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <TypingDots />
              </View>
            </View>
          )}
        </View>

          {/* Input */}
          <View style={[
            styles.inputContainer,
            isDesktop && styles.inputContainerDesktop
          ]}>
            <View style={[
              styles.inputWrapper,
              isDesktop && styles.inputWrapperDesktop
            ]}>
              <TouchableOpacity 
                style={styles.attachButton}
                onPress={() => Alert.alert('Attachments', 'File attachment feature coming soon!')}
              >
                <Paperclip size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={[
                  styles.textInput,
                  isDesktop && styles.textInputDesktop
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Whisper to LIMNUS..."
                placeholderTextColor="#666"
                multiline
                maxLength={4000}
                textAlignVertical="top"
                onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
                blurOnSubmit={false}
                returnKeyType={Platform.OS === 'ios' ? 'default' : 'send'}
              />
              
              {inputText.trim() ? (
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (isSending || connectionStatus === 'reconnecting') && styles.sendButtonDisabled,
                    isDesktop && styles.sendButtonDesktop
                  ]}
                  onPress={handleSend}
                  disabled={isSending || connectionStatus === 'reconnecting'}
                >
                  <Send 
                    size={20} 
                    color={isSending ? Colors.light.textSecondary : 'white'} 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.voiceButton}
                  onPress={() => Alert.alert('Voice Input', 'Voice recording feature coming soon!')}
                >
                  <Mic size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    letterSpacing: 2,
  },
  regenerateButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.85,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#2a2a3e',
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  userAvatar: {
    backgroundColor: '#EC4899',
  },
  assistantAvatar: {
    backgroundColor: '#00D4AA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 36,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMessageTime: {
    color: '#a0a0a0',
  },
  copyButton: {
    marginTop: 4,
    padding: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
    marginHorizontal: 2,
  },

  cursor: {
    color: '#00D4AA',
    fontWeight: 'bold' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#1a1a2e',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'transparent',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  weavingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 20,
  },
  weavingText: {
    fontSize: 14,
    color: '#00D4AA',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  quickPromptsContainer: {
    width: '100%',
  },
  quickPromptsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickPromptItem: {
    width: '48%',
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickPromptText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#ffffff',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a3e',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  voiceButton: {
    padding: 8,
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
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
    bottom: 80,
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
  },
  metricText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricClose: {
    marginLeft: 12,
    padding: 4,
  },
  metricCloseText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: 'bold' as const,
  },
  offlineQueueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  offlineQueueText: {
    fontSize: 14,
    color: '#FFC107',
    textAlign: 'center',
    fontWeight: '500' as const,
    marginLeft: 8,
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
    paddingVertical: 20,
  },
  headerTitleDesktop: {
    fontSize: 24,
  },
  messagesContainerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  messagesContentDesktop: {
    paddingHorizontal: 40,
  },
  inputContainerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  inputWrapperDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  textInputDesktop: {
    fontSize: 18,
    lineHeight: 24,
  },
  sendButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});