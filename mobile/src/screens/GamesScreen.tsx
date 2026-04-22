import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  FAB,
  IconButton,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gamesApi, type Game } from '../api/games';

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setGames(await gamesApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setDialogVisible(true);
  };

  const openEdit = (game: Game) => {
    setEditing(game);
    setName(game.name);
    setDescription(game.description ?? '');
    setDialogVisible(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await gamesApi.update(editing.id, name.trim(), description.trim() || undefined);
        setGames(prev => prev.map(g => g.id === updated.id ? updated : g));
      } else {
        const created = await gamesApi.create(name.trim(), description.trim() || undefined);
        setGames(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setDialogVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (game: Game) => {
    await gamesApi.remove(game.id);
    setGames(prev => prev.filter(g => g.id !== game.id));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={games}
        keyExtractor={g => String(g.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No games yet. Tap + to add one!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="titleMedium">{item.name}</Text>
              {item.description ? (
                <Text variant="bodySmall" style={styles.desc}>{item.description}</Text>
              ) : null}
            </View>
            <IconButton icon="pencil" onPress={() => openEdit(item)} />
            <IconButton icon="delete" iconColor="#e53935" onPress={() => remove(item)} />
          </View>
        )}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? 'Edit Game' : 'Add Game'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Game name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={save} loading={saving} disabled={!name.trim() || saving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openAdd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 80 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    paddingLeft: 16,
  },
  rowText: { flex: 1 },
  desc: { color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
  input: { marginBottom: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
