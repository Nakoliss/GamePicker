import { api } from './client';
import type { Game } from './games';

export type SessionStatus = 'lobby' | 'voting' | 'results' | 'complete';

export interface Participant {
  id: number;
  session_id: number;
  display_name: string;
  joined_at: string;
}

export interface Session {
  id: number;
  room_code: string;
  list_id: number;
  votes_per_round: number;
  status: SessionStatus;
  current_round: number;
  submitter_id: number;
  created_at: string;
}

export interface SessionState {
  session: Session;
  participants: Participant[];
  games: Game[];
  voted_count: number;
}

export interface VoteTally {
  game_id: number;
  game_name: string;
  vote_count: number;
}

export interface RoundResult {
  tallies: VoteTally[];
  winner: VoteTally | null;
  tied: VoteTally[];
  all_voted: boolean;
}

export const sessionsApi = {
  create: (list_id: number, votes_per_round: number, submitter_name: string) =>
    api.post<{ session: Session; participant: Participant }>('/sessions', {
      list_id,
      votes_per_round,
      submitter_name,
    }),
  getState: (room_code: string) =>
    api.get<SessionState>(`/sessions/${room_code}`),
  join: (room_code: string, display_name: string) =>
    api.post<{ session: Session; participant: Participant }>(
      `/sessions/${room_code}/join`,
      { display_name }
    ),
  start: (room_code: string, participant_id: number) =>
    api.post<Session>(`/sessions/${room_code}/start`, { participant_id }),
  submitVotes: (room_code: string, participant_id: number, game_ids: number[], round_number: number) =>
    api.post<{ submitted: boolean; voted: number; total: number }>(
      `/sessions/${room_code}/votes`,
      { participant_id, game_ids, round_number }
    ),
  getResults: (room_code: string, round: number) =>
    api.get<RoundResult>(`/sessions/${room_code}/results/${round}`),
  nextRound: (room_code: string, participant_id: number, tied_game_ids: number[]) =>
    api.post<Session>(`/sessions/${room_code}/next-round`, {
      participant_id,
      tied_game_ids,
    }),
  complete: (room_code: string) =>
    api.post<Session>(`/sessions/${room_code}/complete`, {}),
};
