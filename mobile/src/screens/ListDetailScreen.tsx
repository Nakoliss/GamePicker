import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Dialog,
  FAB,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { listsApi, type GameListDetail } from '../api/lists';
import { gamesApi, type Game } from '../api/games';

type Props = NativeStackScreenProps<RootStackParamList, 'ListDetail'>;

export default function ListDetailScreen({ route, navigation }: Props) {
  const { listId } = route.params;
  const [detail, setDetail] = useState<GameListDetail | null>(null);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [d, gs] = await Promise.all([listsApi.get(listId), gamesApi.list()]);
    setDetail(d);
    setAllGames(gs);
    setLoading(false);
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    if (!detail) return;
    setEditName(detail.name);
    setSelectedIds(new Set(detail.games.map(g => g.id)));
    setEditVisible(true);
  };

  const toggleGame = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!editName.trim() || selectedIds.size === 0) return;
    setSaving(true);
    try {
      const updated = await listsApi.update(listId, editName.trim(), [...selectedIds]);
      setDetail(updated);
      navigation.setOptions({ title: updated.name });
      setEditVisible(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !detail) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={detail.games}
        keyExtractor={g => String(g.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No games in this list.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text variant="titleMedium" style={{ flex: 1 }}>{item.name}</Text>
            {item.description ? (
              <Text variant="bodySmall" style={styles.desc}>{item.description}</Text>
            ) : null}
          </View>
        )}
      />

      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)} style={styles.dialog}>
          <Dialog.Title>Edit List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="List name"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={styles.input}
            />
            <Text variant="labelLarge" style={styles.gamesLabel}>Games in list:</Text>
            <ScrollView style={styles.scroll}>
              {allGames.map(g => (
                <View key={g.id} style={styles.checkRow}>
                  <Checkbox
                    status={selectedIds.has(g.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleGame(g.id)}
                  />
                  <Text onPress={() => toggleGame(g.id)}>{g.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)}>Cancel</Button>
            <Button
              onPress={save}
              loading={saving}
              disabled={!editName.trim() || selectedIds.size === 0 || saving}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB icon="pencil" style={styles.fab} onPress={openEdit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 80 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
  },
  desc: { color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 60, color: '#888' },
  dialog: { maxHeight: '80%' },
  input: { marginBottom: 12 },
  gamesLabel: { marginBottom: 8 },
  scroll: { maxHeight: 250 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
