import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  RadioButton,
  Text,
  TextInput,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listsApi, type GameList } from '../api/lists';
import { sessionsApi } from '../api/sessions';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'StartSession'>;

export default function StartSessionScreen({ navigation }: Props) {
  const [lists, setLists] = useState<GameList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [votesPerRound, setVotesPerRound] = useState('1');
  const [submitterName, setSubmitterName] = useState('');
  const [creating, setCreating] = useState(false);
  const setSession = useSessionStore(s => s.setSession);

  const load = useCallback(async () => {
    const ls = await listsApi.list();
    setLists(ls);
    if (ls.length > 0) setSelectedListId(ls[0].id);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!selectedListId || !submitterName.trim()) return;
    const vpr = Math.max(1, parseInt(votesPerRound, 10) || 1);
    setCreating(true);
    try {
      const { session, participant } = await sessionsApi.create(
        selectedListId,
        vpr,
        submitterName.trim()
      );
      setSession({
        participantId: participant.id,
        sessionId: session.id,
        roomCode: session.room_code,
        isSubmitter: true,
        submitterId: session.submitter_id,
        votesPerRound: session.votes_per_round,
      });
      navigation.replace('Lobby');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (lists.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.empty}>
          You need at least one list to start a vote.
        </Text>
        <Button onPress={() => navigation.navigate('Lists')}>Go to My Lists</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="titleMedium" style={styles.label}>Your name</Text>
        <TextInput
          mode="outlined"
          value={submitterName}
          onChangeText={setSubmitterName}
          placeholder="Enter your name"
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.label}>Votes per round</Text>
        <TextInput
          mode="outlined"
          value={votesPerRound}
          onChangeText={setVotesPerRound}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.label}>Pick a list</Text>
        <Surface style={styles.listPicker} elevation={1}>
          <RadioButton.Group
            onValueChange={v => setSelectedListId(Number(v))}
            value={String(selectedListId ?? '')}
          >
            {lists.map(l => (
              <RadioButton.Item
                key={l.id}
                label={`${l.name} (${l.game_count} games)`}
                value={String(l.id)}
              />
            ))}
          </RadioButton.Group>
        </Surface>

        <Button
          mode="contained"
          onPress={create}
          loading={creating}
          disabled={!selectedListId || !submitterName.trim() || creating}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Create Session
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 20 },
  label: { marginBottom: 6, marginTop: 16, fontWeight: '600' },
  input: { marginBottom: 4 },
  listPicker: { borderRadius: 8, backgroundColor: '#fff', marginBottom: 8 },
  btn: { marginTop: 24 },
  btnContent: { paddingVertical: 6 },
  empty: { textAlign: 'center', marginBottom: 16, color: '#555' },
});
