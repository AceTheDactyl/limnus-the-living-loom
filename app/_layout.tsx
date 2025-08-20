// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import { ChatProvider } from "@/lib/chat-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Web-specific CSS injection for enhanced styling
if (Platform.OS === 'web') {
  // Inject custom CSS for web
  const style = document.createElement('style');
  style.textContent = `
    /* Custom scrollbar for webkit browsers */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(42, 42, 62, 0.3);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.6);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 92, 246, 0.8);
    }
    
    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
    }
    
    /* Better text rendering */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      background-color: #0f0f23;
      color: #ffffff;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Focus styles for accessibility */
    *:focus {
      outline: 2px solid rgba(139, 92, 246, 0.6);
      outline-offset: 2px;
    }
    
    /* Selection styles */
    ::selection {
      background: rgba(139, 92, 246, 0.3);
      color: white;
    }
    
    /* Disable text selection on UI elements */
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Responsive viewport handling */
    @media (max-width: 768px) {
      body {
        overflow-x: hidden;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      * {
        border-color: currentColor !important;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    /* PWA-like full height */
    #root, #__next {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[conversationId]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    
    // Web-specific optimizations
    if (Platform.OS === 'web') {
      // Set viewport meta tag for mobile responsiveness
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
      
      // Set theme color for browser UI
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        themeColor.setAttribute('content', '#0f0f23');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#0f0f23';
        document.head.appendChild(meta);
      }
      
      // Add PWA manifest link if not exists
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifest = document.createElement('link');
        manifest.rel = 'manifest';
        manifest.href = '/manifest.json';
        document.head.appendChild(manifest);
      }
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ChatProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ChatProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
