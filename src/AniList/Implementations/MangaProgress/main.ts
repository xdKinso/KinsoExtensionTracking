import { Form } from "@paperback/types";
import type {
  Chapter,
  ChapterReadActionQueueProcessingResult,
  MangaProgress,
  MangaProgressProviding,
  SourceManga,
  TrackedMangaChapterReadAction,
} from "@paperback/types";
import {
  MediaListStatus,
  titleProgressMutationMutation,
  titleProgressQuery,
} from "../../GraphQL/Tracking";
import type {
  TitleProgress,
  TitleProgressMutationVariables,
  TitleProgressQueryVeriables,
} from "../../GraphQL/Tracking";
import makeRequest from "../../Services/Requests";
import { TrackingForm } from "./form";

export class MangaProgressImplementation implements MangaProgressProviding {
  async getMangaProgressManagementForm(sourceManga: SourceManga): Promise<Form> {
    const viewerId = Number(Application.getState("viewer-id"));

    if (isNaN(viewerId)) {
      throw new Error("You are not authenticated, please log in through the AniList settings");
    }

    return new TrackingForm(viewerId, Number(sourceManga.mangaId));
  }

  async getMangaProgress(sourceManga: SourceManga): Promise<MangaProgress | undefined> {
    const viewerId = Number(Application.getState("viewer-id"));

    if (isNaN(viewerId)) {
      throw new Error("You are not authenticated, please log in through the AniList settings");
    }

    const queryVariables: TitleProgressQueryVeriables = {
      userId: viewerId,
      mediaId: Number(sourceManga.mangaId),
    };

    let mediaList;
    try {
      const json = await makeRequest<TitleProgress, TitleProgressQueryVeriables>(
        titleProgressQuery,
        true,
        queryVariables,
      );
      mediaList = json.MediaList;
    } catch (error) {
      if (!error?.toString().includes("[404]")) {
        throw error;
      }

      return;
    }

    const lastReadChapter: Chapter = {
      chapterId: String(mediaList.progress),
      sourceManga,
      langCode: "unknown",
      chapNum: mediaList.progress,
      volume: mediaList.progressVolumes,
    };

    const lastReadTime = new Date(0);
    lastReadTime.setUTCSeconds(mediaList.updatedAt);

    const mangaProgress: MangaProgress = {
      sourceManga,
      lastReadChapter,
      lastReadTime,
      userRating: mediaList.score,
    };

    return mangaProgress;
  }

  async processChapterReadActionQueue(
    actions: TrackedMangaChapterReadAction[],
  ): Promise<ChapterReadActionQueueProcessingResult> {
    const viewerId = Number(Application.getState("viewer-id"));

    const trackedReadActions: ChapterReadActionQueueProcessingResult = {
      successfulItems: [],
      failedItems: [],
    };

    if (isNaN(viewerId)) {
      return trackedReadActions;
    }

    const highestChapters: Map<string, number> = new Map();
    for (const action of actions) {
      if ((highestChapters.get(action.sourceManga.mangaId) ?? 0) < Math.floor(action.chapterNum)) {
        highestChapters.set(action.sourceManga.mangaId, Math.floor(action.chapterNum));
      }
    }

    for (const action of actions) {
      if ((highestChapters.get(action.sourceManga.mangaId) ?? 0) != Math.floor(action.chapterNum)) {
        trackedReadActions.successfulItems.push(action.id);
        continue;
      }

      try {
        const queryVariables: TitleProgressQueryVeriables = {
          userId: viewerId,
          mediaId: Number(action.sourceManga.mangaId),
        };

        let mediaList;
        try {
          const json = await makeRequest<TitleProgress, TitleProgressQueryVeriables>(
            titleProgressQuery,
            true,
            queryVariables,
          );
          mediaList = json.MediaList;
        } catch (error) {
          if (!error?.toString().includes("[404]")) {
            trackedReadActions.failedItems.push(action.id);
            continue;
          }
        }

        if (mediaList?.progress && mediaList.progress >= action.chapterNum) {
          trackedReadActions.successfulItems.push(action.id);
          continue;
        }

        const mutationVariables: TitleProgressMutationVariables = {
          userId: viewerId,
          mediaId: Number(action.sourceManga.mangaId),
          progress: Math.floor(action.chapterNum),
        };

        if (!mediaList) {
          mutationVariables.status = MediaListStatus.CURRENT.id;
        }

        if (
          action.chapterVolume &&
          (mediaList?.progressVolumes ?? 0) < Math.floor(action.chapterVolume)
        ) {
          mutationVariables.progressVolumes = Math.floor(action.chapterVolume) - 1;
        }

        await makeRequest<TitleProgress, TitleProgressMutationVariables>(
          titleProgressMutationMutation,
          true,
          mutationVariables,
        );

        trackedReadActions.successfulItems.push(action.id);
      } catch {
        trackedReadActions.failedItems.push(action.id);
      }
    }

    return trackedReadActions;
  }
}
