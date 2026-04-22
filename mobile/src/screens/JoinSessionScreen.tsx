import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { sessionsApi } from '../api/sessions';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinSession'>;

export default function JoinSessionScreen({ navigation }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const setSession = useSessionStore(s => s.setSession);

  const join = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code || !displayName.trim()) return;
    setJoining(true);
    setError('');
    try {
      const { session, participant } = await sessionsApi.join(code, displayName.trim());
      setSession({
        participantId: participant.id,
        sessionId: session.id,
        roomCode: session.room_code,
        isSubmitter: false,
        submitterId: session.submitter_id,
        votesPerRound: session.votes_per_round,
      });
      navigation.replace('Lobby');
    } catch (e: any) {
      setError(e?.message ?? 'Could not join session');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inner}>
        <Text variant="titleMedium" style={styles.label}>Room code</Text>
        <TextInput
          mode="outlined"
          value={roomCode}
          onChangeText={t => setRoomCode(t.toUpperCase())}
          placeholder="e.g. AB3K7X"
          autoCapitalize="characters"
          maxLength={6}
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.label}>Your name</Text>
        <TextInput
          mode="outlined"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your name"
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={join}
          loading={joining}
          disabled={!roomCode.trim() || !displayName.trim() || joining}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Join Session
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { padding: 24 },
  label: { marginBottom: 6, marginTop: 20, fontWeight: '600' },
  input: { marginBottom: 4 },
  btn: { marginTop: 28 },
  btnContent: { paddingVertical: 6 },
  error: { color: '#e53935', marginTop: 8, textAlign: 'center' },
});
