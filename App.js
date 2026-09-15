import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoticeCard from './components/NoticeCard';

// =============================================================
// CONSTANTS
// =============================================================

// Training API from Week 7. Each "post" is treated as a UJ notice.
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// Namespaced AsyncStorage keys, as required by the brief (Q2, step 2).
// Namespacing (the "@uj/notices/..." prefix) avoids clashing with other
// keys some other part of the app might save later.
const CACHE_KEY = '@uj/notices/cache';
const LAST_UPDATED_KEY = '@uj/notices/lastUpdated';

export default function App() {
  // -----------------------------------------------------------
  // STATE  (Q1 step 2)
  // -----------------------------------------------------------
  const [notices, setNotices] = useState([]); // the list we render
  const [loading, setLoading] = useState(true); // is a request in flight?
  const [error, setError] = useState(null); // friendly error message

  // Extra state needed for the offline-first behaviour (Q2)
  const [isShowingCache, setIsShowingCache] = useState(false); // are we looking at saved data?
  const [lastUpdated, setLastUpdated] = useState(null); // when was that saved data captured?

  // -----------------------------------------------------------
  // Small helper: turn the stored ISO date into "09:42"
  // -----------------------------------------------------------
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // -----------------------------------------------------------
  // Q2 step 5-6: read whatever is already saved on this device.
  // getItem() returns null the very first time the app is ever opened,
  // so we always check for that before calling JSON.parse().
  // -----------------------------------------------------------
  const loadCachedNotices = async () => {
    try {
      const cachedJson = await AsyncStorage.getItem(CACHE_KEY);
      const cachedTime = await AsyncStorage.getItem(LAST_UPDATED_KEY);

      if (cachedJson !== null) {
        const parsedNotices = JSON.parse(cachedJson);
        setNotices(parsedNotices);
        setIsShowingCache(true);
        setLastUpdated(cachedTime);
      }
    } catch (err) {
      // Reading the cache should never crash the app — just log it.
      console.log('Could not read cached notices:', err);
    }
  };

  // -----------------------------------------------------------
  // Q1 steps 3-4 + Q2 steps 3-4 & 7-9: get fresh data from the API,
  // and fall back to cache if that fails.
  // -----------------------------------------------------------
  const fetchNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL);

      // Q1 step 4: always check response.ok before trusting the body.
      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await response.json();
      const firstTen = data.slice(0, 10); // Q1 step 5: only first 10 records

      // Fresh data replaces whatever we were showing.
      setNotices(firstTen);
      setIsShowingCache(false);

      // Q2 steps 3-4: a successful response is the ONLY thing we cache.
      const now = new Date().toISOString();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(firstTen));
      await AsyncStorage.setItem(LAST_UPDATED_KEY, now);
      setLastUpdated(now);
    } catch (err) {
      console.log('Live fetch failed:', err.message);

      // Q2 step 8: if we still have a cached copy, keep showing it
      // and just switch the status banner on.
      const cachedJson = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedJson !== null) {
        setIsShowingCache(true);
      } else {
        // Q1 step 9 / Q2 step 9: no cache and no live data -> friendly message.
        setError('Unable to load notices. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  // Q1 step 3 + offline-first flow: runs once when the screen mounts.
  //   1. Show cached notices immediately (if any) so the screen isn't blank.
  //   2. Then attempt the live request, which will upgrade or fall back.
  // -----------------------------------------------------------
  useEffect(() => {
    const startUp = async () => {
      await loadCachedNotices();
      await fetchNotices();
    };
    startUp();
  }, []);

  // -----------------------------------------------------------
  // Q2 step 10: remove ONLY our two keys — never AsyncStorage.clear(),
  // which would wipe unrelated data belonging to other features.
  // -----------------------------------------------------------
  const clearSavedNotices = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(LAST_UPDATED_KEY);
      setIsShowingCache(false);
      setLastUpdated(null);
      Alert.alert('Cleared', 'Saved notices have been removed from this device.');
    } catch (err) {
      console.log('Could not clear cache:', err);
    }
  };

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>UJ Campus Notices</Text>
      </View>

      {/* Q2 step 8: honest "this is old data" banner */}
      {isShowingCache && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            Saved copy • Last updated {formatTime(lastUpdated)}
          </Text>
        </View>
      )}

      {/* Q1 step 8: visible loading state */}
      {loading && notices.length === 0 && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F5822A" />
          <Text style={styles.loadingText}>Loading notices...</Text>
        </View>
      )}

      {/* Q1 step 9-10: friendly error + retry, only when we have nothing else to show */}
      {!loading && error && notices.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotices}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Q1 steps 6-7: FlatList of reusable NoticeCard components */}
      {notices.length > 0 && (
        <FlatList
          data={notices}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <NoticeCard notice={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchNotices}>
          <Text style={styles.refreshButtonText}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearSavedNotices}>
          <Text style={styles.clearButtonText}>Clear Saved Notices</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =============================================================
// STYLES
// =============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#001C3D',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusBanner: {
    backgroundColor: '#FFE8CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: { color: '#8A4B00', fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#555' },
  errorText: { color: '#B00020', textAlign: 'center', marginBottom: 16, fontSize: 15 },
  retryButton: {
    backgroundColor: '#F5822A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  refreshButton: {
    backgroundColor: '#001C3D',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  refreshButtonText: { color: '#fff', fontWeight: '600' },
  clearButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  clearButtonText: { color: '#B00020', fontWeight: '600' },
});
