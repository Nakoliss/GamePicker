import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        What are we playing?
      </Text>
      <Surface style={styles.card} elevation={2}>
        <Button
          mode="contained"
          icon="cards"
          onPress={() => navigation.navigate('Games')}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          My Games
        </Button>
        <Button
          mode="contained"
          icon="format-list-bulleted"
          onPress={() => navigation.navigate('Lists')}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          My Lists
        </Button>
      </Surface>
      <Surface style={styles.card} elevation={2}>
        <Button
          mode="contained-tonal"
          icon="play-circle"
          onPress={() => navigation.navigate('StartSession')}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Start a Vote
        </Button>
        <Button
          mode="contained-tonal"
          icon="account-arrow-right"
          onPress={() => navigation.navigate('JoinSession')}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Join a Vote
        </Button>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { textAlign: 'center', marginVertical: 24, fontWeight: 'bold' },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#fff' },
  btn: { marginVertical: 6 },
  btnContent: { paddingVertical: 6 },
});
