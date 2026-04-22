import { api } from './client';

export interface Game {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export const gamesApi = {
  list: () => api.get<Game[]>('/games'),
  create: (name: string, description?: string) =>
    api.post<Game>('/games', { name, description }),
  update: (id: number, name: string, description?: string) =>
    api.put<Game>(`/games/${id}`, { name, description }),
  remove: (id: number) => api.del<{ deleted: boolean }>(`/games/${id}`),
};
