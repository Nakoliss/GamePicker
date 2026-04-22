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

export function computeResult(
  tallies: VoteTally[],
  participant_count: number,
  votes_submitted: number
): RoundResult {
  const sorted = [...tallies].sort((a, b) => b.vote_count - a.vote_count);
  const all_voted = votes_submitted >= participant_count;

  if (sorted.length === 0) {
    return { tallies: sorted, winner: null, tied: [], all_voted };
  }

  const top = sorted[0].vote_count;
  const tied = sorted.filter(t => t.vote_count === top);

  return {
    tallies: sorted,
    winner: tied.length === 1 ? tied[0] : null,
    tied: tied.length > 1 ? tied : [],
    all_voted,
  };
}
