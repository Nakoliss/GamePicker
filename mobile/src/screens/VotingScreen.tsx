import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sessionsApi, type SessionState } from '../api/sessions';
import type { Game } from '../api/games';
import { usePoll } from '../hooks/usePoll';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Voting'>;

export default function VotingScreen({ navigation }: Props) {
  const { roomCode, participantId, votesPerRound } = useSessionStore();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data } = usePoll<SessionState>(
    () => sessionsApi.getState(roomCode!),
    3000,
    !!roomCode && !submitted
  );

  // Poll results after submitted until status flips to 'results'
  const { data: resultsPoll } = usePoll<SessionState>(
    () => sessionsApi.getState(roomCode!),
    3000,
    !!roomCode && submitted
  );

  const activeData = submitted ? resultsPoll : data;

  useEffect(() => {
    if (activeData?.session.status === 'results') {
      navigation.replace('Results');
    }
  }, [activeData?.session.status]);

  const toggle = (game: Game) => {
    if (submitted) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(game.id)) {
        next.delete(game.id);
        Haptics.selectionAsync();
      } else if (next.size < votesPerRound) {
        next.add(game.id);
        Haptics.selectionAsync();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return next;
    });
  };

  const submit = async () => {
    if (!roomCode || !participantId || selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await sessionsApi.submitVotes(
        roomCode,
        participantId,
        [...selectedIds],
        activeData?.session.current_round ?? 1
      );
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeData) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  const { session, games, participants, voted_count } = activeData;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="titleMedium">
          Round {session.current_round} — Pick {votesPerRound} game{votesPerRound !== 1 ? 's' : ''}
        </Text>
        <Text variant="bodySmall" style={styles.voteCount}>
          {voted_count}/{participants.length} voted
        </Text>
      </View>

      <FlatList
        data={games}
        keyExtractor={g => String(g.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => toggle(item)}
              activeOpacity={0.7}
              disabled={submitted}
            >
              <Surface style={[styles.cardSurface, selected && styles.cardSurfaceSelected]} elevation={selected ? 4 : 1}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
                <Text
                  variant="titleSmall"
                  style={[styles.cardText, selected && styles.cardTextSelected]}
                  numberOfLines={3}
                >
                  {item.name}
                </Text>
              </Surface>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        {submitted ? (
          <Text style={styles.waiting}>Waiting for other players…</Text>
        ) : (
          <Button
            mode="contained"
            onPress={submit}
            loading={submitting}
            disabled={selectedIds.size === 0 || submitting}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Submit ({selectedIds.size}/{votesPerRound})
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, alignItems: 'center' },
  voteCount: { color: '#888', marginTop: 4 },
  grid: { padding: 8, paddingBottom: 80 },
  card: { flex: 1, margin: 6 },
  cardSelected: {},
  cardSurface: {
    borderRadius: 12,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  cardSurfaceSelected: { backgroundColor: '#6750A4' },
  checkmark: { position: 'absolute', top: 8, right: 10, color: '#fff', fontSize: 16 },
  cardText: { textAlign: 'center' },
  cardTextSelected: { color: '#fff' },
  footer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  btn: {},
  btnContent: { paddingVertical: 6 },
  waiting: { textAlign: 'center', color: '#888', fontSize: 16, paddingVertical: 16 },
});
