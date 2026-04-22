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
  Checkbox,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listsApi, type GameList } from '../api/lists';
import { gamesApi, type Game } from '../api/games';

type Props = NativeStackScreenProps<RootStackParamList, 'Lists'>;

export default function ListsScreen({ navigation }: Props) {
  const [lists, setLists] = useState<GameList[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [ls, gs] = await Promise.all([listsApi.list(), gamesApi.list()]);
    setLists(ls);
    setAllGames(gs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setListName('');
    setSelectedIds(new Set());
    setDialogVisible(true);
  };

  const toggleGame = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!listName.trim() || selectedIds.size === 0) return;
    setSaving(true);
    try {
      const created = await listsApi.create(listName.trim(), [...selectedIds]);
      const asGameList: GameList = {
        id: created.id,
        name: created.name,
        game_count: selectedIds.size,
        created_at: created.created_at,
      };
      setLists(prev => [...prev, asGameList].sort((a, b) => a.name.localeCompare(b.name)));
      setDialogVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (list: GameList) => {
    await listsApi.remove(list.id);
    setLists(prev => prev.filter(l => l.id !== list.id));
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={lists}
        keyExtractor={l => String(l.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No lists yet. Tap + to create one!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text
                variant="titleMedium"
                onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
              >
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.sub}>
                {item.game_count} game{item.game_count !== 1 ? 's' : ''}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
            />
            <IconButton icon="delete" iconColor="#e53935" onPress={() => remove(item)} />
          </View>
        )}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Create List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List name"
              value={listName}
              onChangeText={setListName}
              mode="outlined"
              style={styles.input}
            />
            <Text variant="labelLarge" style={styles.gamesLabel}>Select games:</Text>
            <ScrollView style={styles.gameScroll}>
              {allGames.map(g => (
                <View key={g.id} style={styles.checkRow}>
                  <Checkbox
                    status={selectedIds.has(g.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleGame(g.id)}
                  />
                  <Text onPress={() => toggleGame(g.id)}>{g.name}</Text>
                </View>
              ))}
              {allGames.length === 0 && (
                <Text style={styles.noGames}>Add games first from "My Games"</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={save}
              loading={saving}
              disabled={!listName.trim() || selectedIds.size === 0 || saving}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />
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
  sub: { color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
  dialog: { maxHeight: '80%' },
  input: { marginBottom: 12 },
  gamesLabel: { marginBottom: 8 },
  gameScroll: { maxHeight: 250 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  noGames: { color: '#888', fontStyle: 'italic' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
