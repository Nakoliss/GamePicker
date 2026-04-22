import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sessionsApi, type RoundResult } from '../api/sessions';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ navigation }: Props) {
  const { roomCode, participantId, isSubmitter, clearSession } = useSessionStore();
  const [result, setResult] = useState<RoundResult | null>(null);
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const load = useCallback(async (r: number) => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const state = await sessionsApi.getState(roomCode);
      const res = await sessionsApi.getResults(roomCode, state.session.current_round);
      setRound(state.session.current_round);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => { load(round); }, [load]);

  const startNextRound = async () => {
    if (!roomCode || !participantId || !result) return;
    setAdvancing(true);
    try {
      await sessionsApi.nextRound(roomCode, participantId, result.tied.map(t => t.game_id));
      navigation.replace('Voting');
    } finally {
      setAdvancing(false);
    }
  };

  const finish = async () => {
    if (!roomCode) return;
    await sessionsApi.complete(roomCode);
    clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (loading || !result) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  const hasWinner = !!result.winner;
  const isTie = result.tied.length > 1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inner}>
        {hasWinner ? (
          <Surface style={styles.winnerCard} elevation={4}>
            <Text style={styles.trophy}>🏆</Text>
            <Text variant="headlineMedium" style={styles.winnerName}>
              {result.winner!.game_name}
            </Text>
            <Text variant="bodyMedium" style={styles.winnerVotes}>
              {result.winner!.vote_count} vote{result.winner!.vote_count !== 1 ? 's' : ''}
            </Text>
          </Surface>
        ) : (
          <Surface style={styles.tieCard} elevation={2}>
            <Text variant="titleLarge" style={styles.tieTitle}>It's a tie!</Text>
            <Text variant="bodyMedium" style={styles.tieSubtitle}>
              These games are tied for first place:
            </Text>
            {result.tied.map(t => (
              <Text key={t.game_id} variant="titleMedium" style={styles.tiedGame}>
                • {t.game_name} ({t.vote_count} votes)
              </Text>
            ))}
          </Surface>
        )}

        <Text variant="titleMedium" style={styles.allResultsLabel}>
          Round {round} Results
        </Text>
        <FlatList
          data={result.tallies}
          keyExtractor={t => String(t.game_id)}
          style={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.tallyRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text variant="bodyLarge" style={styles.tallyName}>{item.game_name}</Text>
              <Text variant="bodyLarge" style={styles.tallyVotes}>{item.vote_count}</Text>
            </View>
          )}
        />

        <View style={styles.actions}>
          {isSubmitter && isTie && (
            <Button
              mode="contained"
              onPress={startNextRound}
              loading={advancing}
              disabled={advancing}
              style={styles.btn}
              contentStyle={styles.btnContent}
            >
              Start Tie-Breaker Round
            </Button>
          )}
          {isSubmitter && hasWinner && (
            <Button
              mode="contained"
              onPress={finish}
              style={styles.btn}
              contentStyle={styles.btnContent}
            >
              Done — Go Home
            </Button>
          )}
          {!isSubmitter && (
            <Text style={styles.waiting}>
              {hasWinner ? 'Session complete!' : 'Waiting for host to start next round…'}
            </Text>
          )}
          {!isSubmitter && hasWinner && (
            <Button
              mode="outlined"
              onPress={() => {
                clearSession();
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }}
              style={styles.btn}
            >
              Go Home
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { flex: 1, padding: 20 },
  winnerCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  trophy: { fontSize: 48, marginBottom: 12 },
  winnerName: { fontWeight: 'bold', textAlign: 'center', color: '#6750A4' },
  winnerVotes: { color: '#888', marginTop: 4 },
  tieCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fff4e5',
    marginBottom: 20,
  },
  tieTitle: { fontWeight: 'bold', marginBottom: 4, color: '#e65100' },
  tieSubtitle: { color: '#666', marginBottom: 8 },
  tiedGame: { marginTop: 4 },
  allResultsLabel: { fontWeight: '600', marginBottom: 8 },
  list: { flexGrow: 0, maxHeight: 200 },
  tallyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: { width: 32, color: '#888', fontWeight: '600' },
  tallyName: { flex: 1 },
  tallyVotes: { fontWeight: 'bold', color: '#6750A4' },
  actions: { marginTop: 20 },
  btn: { marginBottom: 12 },
  btnContent: { paddingVertical: 6 },
  waiting: { textAlign: 'center', color: '#888', marginBottom: 8 },
});
