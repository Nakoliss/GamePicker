import { create } from 'zustand';

interface SessionState {
  participantId: number | null;
  sessionId: number | null;
  roomCode: string | null;
  isSubmitter: boolean;
  submitterId: number | null;
  votesPerRound: number;
  setSession: (data: {
    participantId: number;
    sessionId: number;
    roomCode: string;
    isSubmitter: boolean;
    submitterId: number;
    votesPerRound: number;
  }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  participantId: null,
  sessionId: null,
  roomCode: null,
  isSubmitter: false,
  submitterId: null,
  votesPerRound: 1,
  setSession: (data) =>
    set({
      participantId: data.participantId,
      sessionId: data.sessionId,
      roomCode: data.roomCode,
      isSubmitter: data.isSubmitter,
      submitterId: data.submitterId,
      votesPerRound: data.votesPerRound,
    }),
  clearSession: () =>
    set({
      participantId: null,
      sessionId: null,
      roomCode: null,
      isSubmitter: false,
      submitterId: null,
      votesPerRound: 1,
    }),
}));
