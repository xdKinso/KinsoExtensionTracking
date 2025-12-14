export const titleViewQuery = `
query Query($id: Int) {
  Media(id: $id) {
    averageScore
    bannerImage
    coverImage {
      extraLarge
      large
      medium
    }
    description
    format
    genres
    isAdult
    staff {
      edges {
        node {
          name {
            full
          }
        }
        role
      }
    }
    status
    tags {
      id
      name
    }
    title {
      english
      native
      romaji
    }
    synonyms
  }
}
`;

export interface TitleViewQueryVariables {
  id: number;
}

export type TitleView = {
  Media: TitleViewMedia;
};

type TitleViewMedia = {
  averageScore: number | null;
  bannerImage: string | null;
  coverImage: TitleViewCoverImage;
  description: string | null;
  format: string;
  genres: string[];
  isAdult: boolean;
  staff: TitleViewStaff;
  status: string;
  tags: TitleViewTag[];
  title: TitleViewTitle;
  synonyms: string[];
};

type TitleViewCoverImage = {
  extraLarge: string;
  large: string;
  medium: string;
};

type TitleViewStaff = {
  edges: TitleViewStaffEdge[];
};

type TitleViewStaffEdge = {
  node: TitleViewStaffNode;
  role: string;
};

type TitleViewStaffNode = {
  name: TitleViewStaffName;
};

type TitleViewStaffName = {
  full: string;
};

type TitleViewTag = {
  id: string;
  name: string;
};

type TitleViewTitle = {
  english: string | null;
  romaji: string | null;
  native: string | null;
};
