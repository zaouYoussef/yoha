import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, BackHandler, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  initialPath?: string;
};

export function WebContainer({ initialPath = '/browse' }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetUrl = `https://yoha.ma${initialPath.startsWith('/') ? initialPath : '/' + initialPath}`;

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const webViewProps: any = {
    ref: webViewRef,
    source: { uri: targetUrl },
    style: styles.webview,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    pullToRefreshEnabled: true,
    allowsInlineMediaPlayback: true,
    onNavigationStateChange: (navState: any) => {
      setCanGoBack(navState?.canGoBack);
    },
    onLoadStart: () => setLoading(true),
    onLoadEnd: () => setLoading(false),
    userAgent: 'YoHaMobileApp/1.0 (Android)',
  };

  const WebViewComp = WebView as any;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loaderText}>Chargement de YoHa...</Text>
        </View>
      ) : null}

      <WebViewComp {...webViewProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loaderBox: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
