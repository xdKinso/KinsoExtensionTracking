import { ContentRating, SourceIntents, type SourceInfo } from "@paperback/types";

export default {
  name: "AniList",
  description: "Extension that integrates with anilist.co for tracking and collection management.",
  version: "0.0.05",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities:
    SourceIntents.SETTINGS_UI |
    SourceIntents.DISCOVER_SECIONS |
    SourceIntents.MANGA_SEARCH |
    SourceIntents.MANGA_PROGRESS,
  // SourceIntents.COLLECTION_MANAGEMENT,
  badges: [],
  developers: [
    {
      name: "Kinso",
      github: "https://github.com/xdKinso",
    },
  ],
} satisfies SourceInfo;
