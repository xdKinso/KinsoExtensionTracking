export const discoverSectionsAndSearchQuery = `
query Query(
  $page: Int
  $isAdult: Boolean
  $onList: Boolean
  $countryOfOrigin: CountryCode
  $isLicensed: Boolean
  $search: String
  $startDateGreater: FuzzyDateInt
  $startDateLesser: FuzzyDateInt
  $formatIn: [MediaFormat]
  $formatNotIn: [MediaFormat]
  $statusIn: [MediaStatus]
  $statusNotIn: [MediaStatus]
  $chaptersGreater: Int
  $chaptersLesser: Int
  $volumesGreater: Int
  $volumesLesser: Int
  $genreIn: [String]
  $genreNotIn: [String]
  $tagIn: [String]
  $tagNotIn: [String]
  $sourceIn: [MediaSource]
  $sort: [MediaSort]
) {
  Page(page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    media(
      type: MANGA
      isAdult: $isAdult
      onList: $onList
      countryOfOrigin: $countryOfOrigin
      isLicensed: $isLicensed
      search: $search
      startDate_greater: $startDateGreater
      startDate_lesser: $startDateLesser
      format_in: $formatIn
      format_not_in: $formatNotIn
      status_in: $statusIn
      status_not_in: $statusNotIn
      chapters_greater: $chaptersGreater
      chapters_lesser: $chaptersLesser
      volumes_greater: $volumesGreater
      volumes_lesser: $volumesLesser
      genre_in: $genreIn
      genre_not_in: $genreNotIn
      tag_in: $tagIn
      tag_not_in: $tagNotIn
      source_in: $sourceIn
      sort: $sort
    ) {
      chapters
      coverImage {
        extraLarge
        large
        medium
      }
      format
      genres
      id
      isAdult
      status
      title {
        english
        native
        romaji
      }
      volumes
      synonyms
    }
  }
}
`;

export type DiscoverSectionsAndSearchVariables = {
  page: number;
  isAdult?: boolean;
  onList?: boolean;
  countryOfOrigin?: string;
  isLicensed?: boolean;
  search?: string;
  startDateGreater?: number;
  startDateLesser?: number;
  formatIn?: string[];
  formatNotIn?: string[];
  statusIn?: string[];
  statusNotIn?: string[];
  chaptersGreater?: number;
  chaptersLesser?: number;
  volumesGreater?: number;
  volumesLesser?: number;
  genreIn?: string[];
  genreNotIn?: string[];
  tagIn?: string[];
  tagNotIn?: string[];
  sourceIn?: string[];
  sort: string;
};

export type DiscoverSectionsAndSearch = {
  Page: DiscoverSectionsAndSearchPage;
};

type DiscoverSectionsAndSearchPage = {
  pageInfo: DiscoverSectionsAndSearchPageInfo;
  media: DiscoverSectionsAndSearchMedia[];
};

type DiscoverSectionsAndSearchPageInfo = {
  hasNextPage: boolean;
};

type DiscoverSectionsAndSearchMedia = {
  chapters: number | null;
  coverImage: DiscoverSectionsAndSearchCoverImage;
  format: string;
  genres: string[];
  id: number;
  isAdult: boolean;
  status: string;
  title: DiscoverSectionsAndSearchTitle;
  volumes: number | null;
  synonyms: string[];
};

type DiscoverSectionsAndSearchCoverImage = {
  extraLarge: string;
  large: string;
  medium: string;
};

type DiscoverSectionsAndSearchTitle = {
  english: string | null;
  native: string | null;
  romaji: string | null;
};
