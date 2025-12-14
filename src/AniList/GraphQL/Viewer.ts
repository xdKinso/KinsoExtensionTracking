export const viewerQuery = `
query Query {
  Viewer {
    avatar {
      large
    }
    createdAt
    id
    name
    mediaListOptions {
      rowOrder
      scoreFormat
      mangaList {
        advancedScoringEnabled
        advancedScoring
        customLists
        splitCompletedSectionByFormat
        sectionOrder
      }
    }
    options {
      activityMergeTime
      disabledListActivity {
        disabled
        type
      }
      displayAdultContent
      staffNameLanguage
      titleLanguage
    }
  }
}
`;

export type Viewer = {
  Viewer: ViewerUser;
};

type ViewerUser = {
  avatar: ViewerAvatar;
  createdAt: number;
  id: number;
  name: string;
  mediaListOptions: ViewerMediaListOptions;
  options: ViewerOptions;
};

type ViewerAvatar = {
  large: string;
};

type ViewerMediaListOptions = {
  scoreFormat: string;
  mangaList: ViewerMangaList;
};

type ViewerOptions = {
  activityMergeTime: number;
  disabledListActivity: ViewerListActivityOption[];
  displayAdultContent: boolean;
  staffNameLnaguage: string;
  titleLanguage: string;
};

type ViewerMangaList = {
  advancedScoringEnabled: boolean;
  advancedScoring: string[];
  customLists: string[];
  sectionOrder: string[];
  splitCompletedSectionByFormat: boolean;
};

type ViewerListActivityOption = {
  disabled: boolean;
  type: string;
};

export type JwtPayload = {
  aud: number;
  jti: string;
  iat: number;
  nbf: number;
  exp: number;
  sub: number;
  scopes: string[];
};
