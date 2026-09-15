import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// A "dumb" presentational component: it just receives one notice
// through props and displays it. It doesn't know or care whether
// that notice came from the live API or from AsyncStorage — this
// is what makes it reusable for both Question 1 and Question 2.
export default function NoticeCard({ notice }) {
  return (
    <View style={styles.card}>
      <Text style={styles.idTag}>Notice #{notice.id}</Text>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.body}>{notice.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F5822A',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  idTag: { fontSize: 11, color: '#999', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#001C3D', marginBottom: 6 },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
});
