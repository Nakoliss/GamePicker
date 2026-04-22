import { api } from './client';
import type { Game } from './games';

export interface GameList {
  id: number;
  name: string;
  game_count: number;
  created_at: string;
}

export interface GameListDetail extends Omit<GameList, 'game_count'> {
  games: Game[];
}

export const listsApi = {
  list: () => api.get<GameList[]>('/lists'),
  get: (id: number) => api.get<GameListDetail>(`/lists/${id}`),
  create: (name: string, game_ids: number[]) =>
    api.post<GameListDetail>('/lists', { name, game_ids }),
  update: (id: number, name: string, game_ids: number[]) =>
    api.put<GameListDetail>(`/lists/${id}`, { name, game_ids }),
  remove: (id: number) => api.del<{ deleted: boolean }>(`/lists/${id}`),
};
