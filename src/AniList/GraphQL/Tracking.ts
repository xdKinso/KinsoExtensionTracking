export const titleProgressQuery = `
query Query($userId: Int, $mediaId: Int) {
  MediaList(userId: $userId, mediaId: $mediaId) {
    advancedScores
    completedAt {
      day
      month
      year
    }
    createdAt
    customLists
    hiddenFromStatusLists
    id
    notes
    private
    progress
    progressVolumes
    repeat
    score
    startedAt {
      day
      month
      year
    }
    status
    updatedAt
  }
}
`;

export type TitleProgressQueryVeriables = {
  userId: number;
  mediaId: number;
};

export type TitleProgress = {
  MediaList: TitleProgressMediaList;
};

export type TitleProgressMediaList = {
  advancedScores: Record<string, number>;
  completedAt: TitleProgressFuzzyDate;
  createdAt: number;
  customLists: Record<string, boolean>;
  hiddenFromStatusLists: boolean;
  id?: number;
  notes: string | null;
  private: boolean;
  progress: number;
  progressVolumes: number;
  repeat: number;
  score: number;
  startedAt: TitleProgressFuzzyDate;
  status: string;
  updatedAt: number;
};

export const MediaListStatus = {
  CURRENT: { id: "CURRENT", label: "Reading" },
  PLANNING: { id: "PLANNING", label: "Planning" },
  COMPLETED: { id: "COMPLETED", label: "Completed" },
  DROPPED: { id: "DROPPED", label: "Dropped" },
  PAUSED: { id: "PAUSED", label: "Paused" },
  REPEATING: { id: "REPEATING", label: "Rereading" },
};

export const titleProgressMutationMutation = `
mutation Mutation(
  $id: Int
  $mediaId: Int
  $status: MediaListStatus
  $score: Float
  $progress: Int
  $progressVolumes: Int
  $repeat: Int
  $private: Boolean
  $notes: String
  $hiddenFromStatusLists: Boolean
  $customLists: [String]
  $advancedScores: [Float]
) {
  SaveMediaListEntry(
    id: $id
    mediaId: $mediaId
    status: $status
    score: $score
    progress: $progress
    progressVolumes: $progressVolumes
    repeat: $repeat
    private: $private
    notes: $notes
    hiddenFromStatusLists: $hiddenFromStatusLists
    customLists: $customLists
    advancedScores: $advancedScores
  ) {
    advancedScores
    completedAt {
      day
      month
      year
    }
    createdAt
    customLists
    hiddenFromStatusLists
    id
    notes
    private
    progress
    progressVolumes
    repeat
    score
    startedAt {
      day
      month
      year
    }
    status
    updatedAt
  }
}
`;

export type TitleProgressMutationVariables = {
  userId: number;
  mediaId: number;
  status?: string;
  score?: number;
  progress?: number;
  progressVolumes?: number;
  repeat?: number;
  private?: boolean;
  notes?: string | null;
  hiddenFromStatusLists?: boolean;
  customLists?: string[];
  advancedScores?: number[];
};

export const titleProgressDeletionMutation = `
mutation Mutation($deleteMediaListEntryId: Int) {
  DeleteMediaListEntry(id: $deleteMediaListEntryId) {
    deleted
  }
}
`;

export type TitleProgressDeletionVariables = {
  deleteMediaListEntryId: number;
};

export type TitleProgressDeletion = {
  DeleteMediaListEntry: TitleProgressDeletionDeleteMediaListEntry;
};

type TitleProgressDeletionDeleteMediaListEntry = {
  deleted: boolean;
};

// Shared
type TitleProgressFuzzyDate = {
  day: number | null;
  month: number | null;
  year: number | null;
};
