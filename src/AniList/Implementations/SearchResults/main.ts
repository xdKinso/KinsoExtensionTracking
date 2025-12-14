import type {
  PagedResults,
  SearchFilter,
  SearchQuery,
  SearchResultItem,
  SearchResultsProviding,
  SortingOption,
} from "@paperback/types";
import { discoverSectionsAndSearchQuery } from "../../GraphQL/DiscoverSectionsAndSearch";
import type { DiscoverSectionsAndSearchVariables } from "../../GraphQL/DiscoverSectionsAndSearch";
import {
  CountryCode,
  MediaFormat,
  MediaSort,
  MediaSourceMaterial,
  MediaStatus,
} from "../../GraphQL/General";
import { genresQuery, tagsQuery } from "../../GraphQL/SearchFilters";
import type { Genres, Tags } from "../../GraphQL/SearchFilters";
import makeRequest from "../../Services/Requests";
import { getItems } from "../helper";
import { MangaImplementation } from "../Manga/main";

export class SearchResultsImplementation
  extends MangaImplementation
  implements SearchResultsProviding
{
  async getSearchFilters(): Promise<SearchFilter[]> {
    let genres: Genres;
    let tags: Tags;

    const searchFiltersQueryDate = Number(Application.getState("search-filters-query-date") ?? 0);

    if (searchFiltersQueryDate + 604800 > new Date().valueOf() / 1000) {
      genres = JSON.parse(Application.getState("genres") as string) as Genres;
      tags = JSON.parse(Application.getState("tags") as string) as Tags;
    } else {
      genres = await makeRequest<Genres>(genresQuery, false);
      tags = await makeRequest<Tags>(tagsQuery, false);

      Application.setState(JSON.stringify(genres), "genres");
      Application.setState(JSON.stringify(tags), "tags");
      Application.setState(String(new Date().valueOf() / 1000), "search-filters-query-date");
    }

    const genresFilter: SearchFilter = {
      type: "multiselect",
      id: "genres",
      title: "Genres",
      options: genres.GenreCollection.map((x) => ({
        id: x.replaceAll(" ", "_"),
        value: x,
      })),
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const formatsFilter: SearchFilter = {
      type: "multiselect",
      id: "formats",
      title: "Formats",
      options: Object.values(MediaFormat).map((x) => ({
        id: x.id,
        value: x.label,
      })),
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const publishingStatusesFilter: SearchFilter = {
      type: "multiselect",
      id: "publishing-statuses",
      title: "Publishing Statuses",
      options: Object.values(MediaStatus).map((x) => ({
        id: x.id,
        value: x.label,
      })),
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const countryOfOriginFilter: SearchFilter = {
      type: "dropdown",
      id: "country-of-origin",
      title: "Country of Origin",
      options: Object.values(CountryCode).map((x) => ({
        id: x.id,
        value: x.label,
      })),
      value: "",
    };

    const sourceMaterialsFilter: SearchFilter = {
      type: "multiselect",
      id: "source-materials",
      title: "Source Materials",
      options: Object.values(MediaSourceMaterial).map((x) => ({
        id: x.id,
        value: x.label,
      })),
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const startYearsFilter: SearchFilter = {
      type: "input",
      id: "start-years",
      title: "Start Years",
      placeholder: 'Give two years separated by a "-" to give a range',
      value: "",
    };

    const chapterCountsFilter: SearchFilter = {
      type: "input",
      id: "chapter-counts",
      title: "Chapter Counts",
      placeholder: 'Give two chapter counts separated by a "-" to give a range',
      value: "",
    };

    const volumeCountsFilter: SearchFilter = {
      type: "input",
      id: "volume-counts",
      title: "Volume Counts",
      placeholder: 'Give two volume counts separated by a "-" to give a range',
      value: "",
    };

    const adultFilter: SearchFilter = {
      type: "multiselect",
      id: "adult",
      title: "Adult",
      options: [
        {
          id: "adult",
          value: "Adult",
        },
      ],
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const doujinFilter: SearchFilter = {
      type: "multiselect",
      id: "doujin",
      title: "Doujin",
      options: [
        {
          id: "doujin",
          value: "Doujin",
        },
      ],
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const trackedTitlesFilter: SearchFilter = {
      type: "multiselect",
      id: "tracked-titles",
      title: "Tracked Titles",
      options: [
        {
          id: "tracked-titles",
          value: "Tracked Titles",
        },
      ],
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    const tagsFilter: SearchFilter = {
      type: "multiselect",
      id: "tags",
      title: "Tags",
      options: tags.MediaTagCollection.map((x) => ({
        id: x.name.replaceAll(" ", "_").replaceAll("'", "?"),
        value: x.name,
      })),
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    };

    return [
      genresFilter,
      formatsFilter,
      publishingStatusesFilter,
      countryOfOriginFilter,
      sourceMaterialsFilter,
      startYearsFilter,
      chapterCountsFilter,
      volumeCountsFilter,
      adultFilter,
      doujinFilter,
      trackedTitlesFilter,
      tagsFilter,
    ];
  }

  async getSortingOptions(query: SearchQuery): Promise<SortingOption[]> {
    void query;

    const sortingOptions: SortingOption[] = [];
    for (const key of Object.keys(MediaSort) as (keyof typeof MediaSort)[]) {
      const sortingOption = MediaSort[key];
      sortingOptions.push({
        id: sortingOption.id,
        label: sortingOption.label,
      });
    }

    return sortingOptions;
  }

  async getSearchResults(
    query: SearchQuery,
    metadata?: number,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    let needsAuth = false;
    const includedGenres: string[] = [];
    const excludedGenres: string[] = [];
    const includedFormats: string[] = [];
    const excludedFormats: string[] = [];
    const includedPublishingStatuses: string[] = [];
    const excludedPublishingStatuses: string[] = [];
    const includedSourceMaterials: string[] = [];
    const includedTags: string[] = [];
    const excludedTags: string[] = [];

    const variables: DiscoverSectionsAndSearchVariables = {
      page: metadata ?? 1,
      sort: sortingOption!.id,
    };

    if (query.title) {
      variables.search = query.title;
    }

    for (const filter of query.filters) {
      switch (filter.id) {
        case "genres": {
          const genres = (filter.value ?? {}) as Record<string, "included" | "excluded">;

          for (const genre of Object.entries(genres)) {
            switch (genre[1]) {
              case "included":
                includedGenres.push(genre[0].replaceAll("_", " "));
                break;
              case "excluded":
                excludedGenres.push(genre[0].replaceAll("_", " "));
                break;
            }
          }

          if (includedGenres.length > 0) {
            variables.genreIn = includedGenres;
          }

          if (excludedGenres.length > 0) {
            variables.genreNotIn = excludedGenres;
          }

          break;
        }
        case "formats": {
          const formats = (filter.value ?? {}) as Record<string, "included" | "excluded">;

          for (const format of Object.entries(formats)) {
            switch (format[1]) {
              case "included":
                includedFormats.push(format[0]);
                break;
              case "excluded":
                excludedFormats.push(format[0]);
                break;
            }
          }

          if (includedFormats.length > 0) {
            variables.formatIn = includedFormats;
          }

          if (excludedFormats.length > 0) {
            variables.formatNotIn = excludedFormats;
          }

          break;
        }
        case "publishing-statuses": {
          const publishingStatuses = (filter.value ?? {}) as Record<
            string,
            "included" | "excluded"
          >;

          for (const publishingStatus of Object.entries(publishingStatuses)) {
            switch (publishingStatus[1]) {
              case "included":
                includedPublishingStatuses.push(publishingStatus[0]);
                break;
              case "excluded":
                excludedPublishingStatuses.push(publishingStatus[0]);
                break;
            }
          }

          if (includedPublishingStatuses.length > 0) {
            variables.statusIn = includedPublishingStatuses;
          }

          if (excludedPublishingStatuses.length > 0) {
            variables.statusNotIn = excludedPublishingStatuses;
          }

          break;
        }
        case "country-of-origin": {
          const country = filter.value as string;

          if (country) {
            variables.countryOfOrigin = country;
          }

          break;
        }
        case "source-materials": {
          const sourceMaterials = (filter.value ?? {}) as Record<string, "included">;

          for (const sourceMaterial of Object.entries(sourceMaterials)) {
            includedSourceMaterials.push(sourceMaterial[0]);
          }

          if (includedSourceMaterials.length > 0) {
            variables.sourceIn = includedSourceMaterials;
          }

          break;
        }
        case "start-years": {
          if (filter.value == "") {
            break;
          }

          const startYears = (filter.value as string).split("-").map((x) => Number(x));

          if (startYears.length == 0 || startYears.length > 2 || startYears.includes(NaN)) {
            break;
          }

          for (const startYear of startYears) {
            if (startYear < 0 || startYear > 9999) {
              break;
            }
          }

          switch (startYears.length) {
            case 1:
              if (startYears[0] !== undefined) {
                variables.startDateGreater =
                  Number((startYears[0] - 1).toString().padStart(4, "0")) * 10000;
                variables.startDateLesser =
                  Number((startYears[0] + 1).toString().padStart(4, "0")) * 10000;
              }
              break;
            case 2:
              if (
                startYears[0] !== undefined &&
                startYears[1] !== undefined &&
                startYears[0] <= startYears[1]
              ) {
                variables.startDateGreater =
                  Number(startYears[0].toString().padStart(4, "0")) * 10000;
                variables.startDateLesser =
                  Number(startYears[1].toString().padStart(4, "0")) * 10000;
              }

              break;
          }

          break;
        }
        case "chapter-counts": {
          if (filter.value == "") {
            break;
          }

          const chapterCounts = (filter.value as string).split("-").map((x) => Number(x));

          if (
            chapterCounts.length == 0 ||
            chapterCounts.length > 2 ||
            chapterCounts.includes(NaN)
          ) {
            break;
          }

          for (const chapterCount of chapterCounts) {
            if (chapterCount < 0) {
              break;
            }
          }

          switch (chapterCounts.length) {
            case 1:
              if (chapterCounts[0] !== undefined) {
                variables.chaptersGreater = chapterCounts[0] - 1;
                variables.chaptersLesser = chapterCounts[0] + 1;
              }
              break;
            case 2:
              if (
                chapterCounts[0] !== undefined &&
                chapterCounts[1] !== undefined &&
                chapterCounts[0] <= chapterCounts[1]
              ) {
                variables.chaptersGreater = chapterCounts[0];
                variables.chaptersLesser = chapterCounts[1];
              }

              break;
          }

          break;
        }
        case "volume-counts": {
          if (filter.value == "") {
            break;
          }

          const volumeCounts = (filter.value as string).split("-").map((x) => Number(x));

          if (volumeCounts.length == 0 || volumeCounts.length > 2 || volumeCounts.includes(NaN)) {
            break;
          }

          for (const volumeCount of volumeCounts) {
            if (volumeCount < 0) {
              break;
            }
          }

          switch (volumeCounts.length) {
            case 1:
              if (volumeCounts[0] !== undefined) {
                variables.volumesGreater = volumeCounts[0] - 1;
                variables.volumesLesser = volumeCounts[0] + 1;
              }
              break;
            case 2:
              if (
                volumeCounts[0] !== undefined &&
                volumeCounts[1] !== undefined &&
                volumeCounts[0] <= volumeCounts[1]
              ) {
                variables.volumesGreater = volumeCounts[0];
                variables.volumesLesser = volumeCounts[1];
              }

              break;
          }

          break;
        }
        case "adult": {
          const adult = Object.entries(filter.value) as [string, "included" | "excluded"][];

          if (adult.length != 1) {
            break;
          }

          if (adult[0]?.[1]) {
            switch (adult[0][1]) {
              case "included":
                variables.isAdult = true;
                break;
              case "excluded":
                variables.isAdult = false;
                break;
            }
          }

          break;
        }
        case "doujin": {
          const doujin = Object.entries(filter.value) as [string, "included" | "excluded"][];

          if (doujin.length != 1) {
            break;
          }

          if (doujin[0]?.[1]) {
            switch (doujin[0][1]) {
              case "included":
                variables.isLicensed = false;
                break;
              case "excluded":
                variables.isLicensed = true;
                break;
            }
          }

          break;
        }
        case "tracked-titles": {
          const trackedTitles = Object.entries(filter.value) as [string, "included" | "excluded"][];

          if (Object.entries(trackedTitles).length != 1) {
            break;
          }

          if (trackedTitles[0]?.[1]) {
            switch (trackedTitles[0][1]) {
              case "included":
                variables.onList = true;
                needsAuth = true;
                break;
              case "excluded":
                variables.onList = false;
                needsAuth = true;
                break;
            }
          }

          break;
        }
        case "tags": {
          const tags = (filter.value ?? {}) as Record<string, "included" | "excluded">;

          for (const tag of Object.entries(tags)) {
            switch (tag[1]) {
              case "included":
                includedTags.push(tag[0].replaceAll("_", " ").replaceAll("?", "'"));
                break;
              case "excluded":
                excludedTags.push(tag[0].replaceAll("_", " ").replaceAll("?", "'"));
                break;
            }
          }

          if (includedTags.length > 0) {
            variables.tagIn = includedTags;
          }

          if (excludedTags.length > 0) {
            variables.tagNotIn = excludedTags;
          }

          break;
        }
      }
    }

    return getItems<SearchResultItem>(
      discoverSectionsAndSearchQuery,
      variables,
      needsAuth,
      metadata,
    );
  }
}
