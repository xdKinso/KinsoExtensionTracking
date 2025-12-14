import { ContentRating } from "@paperback/types";
import type { PagedResults } from "@paperback/types";
import type {
  DiscoverSectionsAndSearch,
  DiscoverSectionsAndSearchVariables,
} from "../GraphQL/DiscoverSectionsAndSearch";
import { MediaFormat, MediaStatus } from "../GraphQL/General";
import makeRequest from "../Services/Requests";
import { getSynonymsSetting } from "./SettingsForm/form";

export async function getItems<ResultItemType>(
  query: string,
  queryVariables: DiscoverSectionsAndSearchVariables,
  needsAuth: boolean,
  metadata: number | undefined,
): Promise<PagedResults<ResultItemType>> {
  const items: ResultItemType[] = [];

  const json = await makeRequest<DiscoverSectionsAndSearch, DiscoverSectionsAndSearchVariables>(
    query,
    needsAuth,
    queryVariables,
  );
  if (!json?.Page?.media) {
    throw new Error("AniList returned an empty result set");
  }

  const searchResults = json.Page.media;

  for (const searchResult of searchResults) {
    let title = "";
    switch (searchResult.format) {
      case "NOVEL":
        title += "(" + MediaFormat.NOVEL.label + ") ";
        break;
      case "ONE_SHOT":
        title += "(" + MediaFormat.ONE_SHOT.label + ") ";
    }

    title +=
      searchResult.title.english ??
      searchResult.title.romaji ??
      searchResult.title.native ??
      "No Title";
    if (
      getSynonymsSetting() == true &&
      searchResult.synonyms.length > 0 &&
      !searchResult.title.english
    ) {
      title += " / " + searchResult.synonyms[0];
    }

    const contentRating: ContentRating = searchResult.isAdult
      ? ContentRating.ADULT
      : searchResult.genres.some((e) => e == "ecchi")
        ? ContentRating.MATURE
        : ContentRating.EVERYONE;

    let subtitle;
    switch (searchResult.status) {
      case MediaStatus.FINISHED.id: {
        if (!searchResult.chapters && !searchResult.volumes) {
          subtitle = MediaStatus.FINISHED.label;
          break;
        }
        const chapterAndVolumes = [
          searchResult.chapters ? "Chs. " + searchResult.chapters.toString() : "",
          searchResult.volumes ? "Vols. " + searchResult.volumes.toString() : "",
        ];
        subtitle = chapterAndVolumes.join(" ");

        break;
      }

      case MediaStatus.NOT_YET_RELEASED.id:
        subtitle = MediaStatus.NOT_YET_RELEASED.label;
        break;
      case MediaStatus.CANCELLED.id:
        subtitle = MediaStatus.CANCELLED.label;
        break;
      case MediaStatus.HIATUS.id:
        subtitle = MediaStatus.HIATUS.label;
        break;
      case MediaStatus.RELEASING.id:
        subtitle = MediaStatus.RELEASING.label;
    }

    items.push({
      mangaId: searchResult.id.toString(),
      title,
      imageUrl: searchResult.coverImage.large,
      contentRating,
      subtitle,
    } as ResultItemType);
  }

  metadata = json.Page.pageInfo.hasNextPage ? (metadata ?? 1) + 1 : undefined;

  return {
    items,
    metadata,
  };
}

/* eslint-disable */
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}
