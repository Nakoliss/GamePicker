import React, { useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { ActivityIndicator, Button, Chip, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sessionsApi, type SessionState } from '../api/sessions';
import { usePoll } from '../hooks/usePoll';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export default function LobbyScreen({ navigation }: Props) {
  const { roomCode, participantId, isSubmitter } = useSessionStore();

  const { data } = usePoll<SessionState>(
    () => sessionsApi.getState(roomCode!),
    2500,
    !!roomCode
  );

  useEffect(() => {
    if (data?.session.status === 'voting') {
      navigation.replace('Voting');
    }
  }, [data?.session.status]);

  const start = async () => {
    if (!roomCode || !participantId) return;
    await sessionsApi.start(roomCode, participantId);
  };

  const copyCode = async () => {
    if (roomCode) await Clipboard.setStringAsync(roomCode);
  };

  if (!data) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  const { session, participants } = data;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inner}>
        <Text variant="titleMedium" style={styles.sectionLabel}>Room Code</Text>
        <Surface style={styles.codeSurface} elevation={2}>
          <Text variant="displaySmall" style={styles.code}>{session.room_code}</Text>
          <Button compact onPress={copyCode} icon="content-copy">Copy</Button>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Players ({participants.length})
        </Text>
        <FlatList
          data={participants}
          keyExtractor={p => String(p.id)}
          style={styles.participantList}
          renderItem={({ item }) => (
            <Chip
              icon={item.id === session.submitter_id ? 'crown' : 'account'}
              style={styles.chip}
            >
              {item.display_name}
              {item.id === session.submitter_id ? ' (host)' : ''}
            </Chip>
          )}
        />

        <Text variant="bodySmall" style={styles.hint}>
          {isSubmitter
            ? 'Tap "Start Vote" when everyone has joined.'
            : 'Waiting for the host to start…'}
        </Text>

        {isSubmitter && (
          <Button
            mode="contained"
            onPress={start}
            disabled={participants.length < 1}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Start Vote
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { flex: 1, padding: 24 },
  sectionLabel: { fontWeight: '600', marginTop: 20, marginBottom: 8 },
  codeSurface: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  code: { letterSpacing: 8, fontWeight: 'bold', color: '#6750A4', marginBottom: 8 },
  participantList: { marginBottom: 12, flexGrow: 0 },
  chip: { marginBottom: 6 },
  hint: { color: '#888', textAlign: 'center', marginTop: 12 },
  btn: { marginTop: 20 },
  btnContent: { paddingVertical: 6 },
});
