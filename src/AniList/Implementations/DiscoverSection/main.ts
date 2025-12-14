import { DiscoverSectionType } from "@paperback/types";
import type {
  DiscoverSection,
  DiscoverSectionItem,
  DiscoverSectionProviding,
  PagedResults,
} from "@paperback/types";
import { discoverSectionsAndSearchQuery } from "../../GraphQL/DiscoverSectionsAndSearch";
import type { DiscoverSectionsAndSearchVariables } from "../../GraphQL/DiscoverSectionsAndSearch";
import { CountryCode, MediaSort } from "../../GraphQL/General";
import { getItems } from "../helper";

export class DiscoverSectionImplementation implements DiscoverSectionProviding {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    console.log("[AniList] getDiscoverSections called");
    console.log("[AniList] MediaSort:", MediaSort);
    console.log("[AniList] CountryCode:", CountryCode);

    const trending_now: DiscoverSection = {
      id: "trending-now",
      title: "Trending Now",
      type: DiscoverSectionType.featured,
    };

    const all_time_popular: DiscoverSection = {
      id: "all-time-popular",
      title: "All Time Popular",
      type: DiscoverSectionType.prominentCarousel,
    };

    const popular_manga: DiscoverSection = {
      id: "popular-manga",
      title: "Popular Manga",
      type: DiscoverSectionType.simpleCarousel,
    };

    const popular_manhwa: DiscoverSection = {
      id: "popular-manhwa",
      title: "Popular Manhwa",
      type: DiscoverSectionType.simpleCarousel,
    };

    const top_100_manga: DiscoverSection = {
      id: "top-100-manga",
      title: "Top 100 Manga",
      type: DiscoverSectionType.prominentCarousel,
    };

    const sections = [trending_now, all_time_popular, popular_manga, popular_manhwa, top_100_manga];

    console.log("[AniList] Returning sections:", sections);
    return sections;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: number | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    console.log("[AniList] getDiscoverSectionItems called for section:", section.id);
    console.log("[AniList] metadata:", metadata);

    let sort: string;

    let countryOfOrigin: string | undefined;
    switch (section.id) {
      case "trending-now":
        sort = MediaSort.TRENDING_DESC.id;
        console.log("[AniList] trending-now sort:", sort);
        break;
      case "all-time-popular":
        sort = MediaSort.POPULARITY_DESC.id;
        console.log("[AniList] all-time-popular sort:", sort);
        break;
      case "popular-manga":
        sort = MediaSort.POPULARITY_DESC.id;
        countryOfOrigin = CountryCode.JP.id;
        console.log("[AniList] popular-manga sort:", sort, "country:", countryOfOrigin);
        break;
      case "popular-manhwa":
        sort = MediaSort.POPULARITY_DESC.id;
        countryOfOrigin = CountryCode.KR.id;
        console.log("[AniList] popular-manhwa sort:", sort, "country:", countryOfOrigin);
        break;
      case "top-100-manga":
        sort = MediaSort.SCORE_DESC.id;
        console.log("[AniList] top-100-manga sort:", sort);
        break;
    }

    const variables: DiscoverSectionsAndSearchVariables = {
      page: metadata ?? 1,
      sort: [sort!],
      countryOfOrigin: countryOfOrigin,
    };

    console.log("[AniList] Query variables:", variables);

    try {
      const result = await getItems<DiscoverSectionItem>(
        discoverSectionsAndSearchQuery,
        variables,
        false,
        metadata,
      );
      console.log("[AniList] getItems returned:", result.items.length, "items");
      return result;
    } catch (error) {
      console.error("[AniList] Error in getDiscoverSectionItems:", error);
      throw error;
    }
  }
}
