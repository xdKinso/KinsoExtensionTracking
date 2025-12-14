import { ContentRating } from "@paperback/types";
import type { MangaProviding, SourceManga, Tag, TagSection } from "@paperback/types";
import { MediaFormat, MediaStatus } from "../../GraphQL/General";
import { titleViewQuery } from "../../GraphQL/TitleView";
import type { TitleView, TitleViewQueryVariables } from "../../GraphQL/TitleView";
import makeRequest from "../../Services/Requests";
import { getSynonymsSetting } from "../SettingsForm/form";

export class MangaImplementation implements MangaProviding {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const queryVariables: TitleViewQueryVariables = {
      id: Number(mangaId),
    };

    const json = await makeRequest<TitleView, TitleViewQueryVariables>(
      titleViewQuery,
      false,
      queryVariables,
    );

    const mangaDetails = json.Media;

    let synopsis = mangaDetails.description
      ? mangaDetails.description.replaceAll(/<br>|<i>|<\/i>|<a.*?>|<\/a>/g, "")
      : "No description";
    synopsis +=
      mangaDetails.synonyms.length > 0
        ? "\n\nSynonyms: " + mangaDetails.synonyms.toLocaleString().replaceAll(",", ", ") + "\n\n"
        : "";

    const secondaryTitles = [];
    for (const title of Object.values(mangaDetails.title)) {
      if (title == undefined) {
        continue;
      }

      secondaryTitles.push(title);
    }
    for (const synonym of mangaDetails.synonyms) {
      secondaryTitles.push(synonym);
    }

    let primaryTitle =
      mangaDetails.title.english ??
      mangaDetails.title.romaji ??
      mangaDetails.title.native ??
      "No Title";
    if (
      getSynonymsSetting() == true &&
      mangaDetails.synonyms.length > 0 &&
      !mangaDetails.title.english
    ) {
      primaryTitle += "\n" + mangaDetails.synonyms[0];
    }

    let status;
    switch (mangaDetails.status) {
      case MediaStatus.FINISHED.id:
        status = MediaStatus.FINISHED.label;
        break;
      case MediaStatus.NOT_YET_RELEASED.id:
        status = MediaStatus.NOT_YET_RELEASED.label;
        break;
      case MediaStatus.CANCELLED.id:
        status = MediaStatus.CANCELLED.label;
        break;
      case MediaStatus.HIATUS.id:
        status = MediaStatus.HIATUS.label;
        break;
      case MediaStatus.RELEASING.id:
        status = MediaStatus.RELEASING.label;
    }

    let author, artist;
    for (const staff of mangaDetails.staff.edges) {
      if (staff.role.startsWith("Story & Art")) {
        author = staff.node.name.full;
        artist = undefined;
        break;
      }
      if (!author && (staff.role.startsWith("Story") || staff.role.startsWith("Original Story"))) {
        author = staff.node.name.full;
        if (author && artist) break;
      }
      if (staff.role.startsWith("Art")) {
        artist = staff.node.name.full;
        if (author && artist) break;
      }
    }

    const rating = mangaDetails.averageScore ? mangaDetails.averageScore / 100 : undefined;

    const genres: Tag[] = [];
    for (const genre of mangaDetails.genres) {
      genres.push({
        id: genre.replaceAll(" ", "_").toLowerCase(),
        title: genre,
      });
    }

    const tags: Tag[] = [];
    for (const tag of mangaDetails.tags) {
      genres.push({
        id: tag.id.toString().replaceAll(" ", "_").toLowerCase(),
        title: tag.name,
      });
    }

    const tagGroups: TagSection[] = [
      { id: "genres", title: "Genres", tags: genres },
      { id: "tags", title: "Tags", tags: tags },
    ];

    const contentRating: ContentRating = mangaDetails.isAdult
      ? ContentRating.ADULT
      : genres.some((e) => e.id == "ecchi")
        ? ContentRating.MATURE
        : ContentRating.EVERYONE;

    const artworkUrls = [mangaDetails.coverImage.extraLarge];

    if (mangaDetails.bannerImage != null) {
      artworkUrls.push(mangaDetails.bannerImage);
    }

    const additionalInfo: Record<string, string> = {
      Format:
        mangaDetails.format == MediaFormat.MANGA.id
          ? MediaFormat.MANGA.label
          : mangaDetails.format == MediaFormat.NOVEL.id
            ? MediaFormat.NOVEL.label
            : MediaFormat.ONE_SHOT.label,
    };

    return {
      mangaId,
      mangaInfo: {
        thumbnailUrl: mangaDetails.coverImage.extraLarge,
        synopsis,
        primaryTitle,
        secondaryTitles,
        contentRating,
        status,
        artist,
        author,
        bannerUrl: mangaDetails.bannerImage ?? undefined,
        rating,
        tagGroups,
        artworkUrls,
        shareUrl: "https://anilist.co/manga/" + mangaId,
        additionalInfo,
      },
    };
  }
}
