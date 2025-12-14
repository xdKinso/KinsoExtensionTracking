import {
  ButtonRow,
  Form,
  InputRow,
  LabelRow,
  NavigationRow,
  Section,
  SelectRow,
  StepperRow,
  ToggleRow,
} from "@paperback/types";
import type {
  ButtonRowProps,
  FormItemElement,
  FormSectionElement,
  InputRowProps,
  LabelRowProps,
  NavigationRowProps,
  SelectRowProps,
  StepperRowProps,
  ToggleRowProps,
} from "@paperback/types";
import {
  MediaListStatus,
  titleProgressDeletionMutation,
  titleProgressMutationMutation,
  titleProgressQuery,
} from "../../GraphQL/Tracking";
import type {
  TitleProgress,
  TitleProgressDeletion,
  TitleProgressDeletionVariables,
  TitleProgressMediaList,
  TitleProgressMutationVariables,
  TitleProgressQueryVeriables,
} from "../../GraphQL/Tracking";
import makeRequest from "../../Services/Requests";

export class TrackingForm extends Form {
  viewerId: number;
  sourceMangaId: number;
  loadRequest?: Promise<unknown>;
  titleProgress?: TitleProgress;
  error?: Error;

  constructor(viewerId: number, sourceMangaId: number) {
    super();
    this.viewerId = viewerId;
    this.sourceMangaId = sourceMangaId;
  }

  override formWillAppear(): void {
    const queryVariables: TitleProgressQueryVeriables = {
      userId: this.viewerId,
      mediaId: this.sourceMangaId,
    };

    this.loadRequest = makeRequest<TitleProgress, TitleProgressQueryVeriables>(
      titleProgressQuery,
      true,
      queryVariables,
    )
      .then((titleProgress) => {
        if (!this.titleProgress) {
          this.titleProgress = titleProgress;
        }
      })
      .catch((error: Error) => {
        if (!error?.toString().includes("[404]")) {
          this.error = error;
        }

        const newTitleProgressMediaList: TitleProgressMediaList = {
          advancedScores: {},
          completedAt: {
            day: null,
            month: null,
            year: null,
          },
          createdAt: Date.now() / 1000,
          customLists: {},
          hiddenFromStatusLists: false,
          notes: null,
          private: false,
          progress: 0,
          progressVolumes: 0,
          repeat: 0,
          score: 0,
          startedAt: {
            day: null,
            month: null,
            year: null,
          },
          status: "CURRENT",
          updatedAt: Date.now() / 1000,
        };

        const newTitleProgress: TitleProgress = {
          MediaList: newTitleProgressMediaList,
        };

        if (!this.titleProgress) {
          this.titleProgress = newTitleProgress;
        }
      })
      .finally(() => {
        this.reloadForm();
      });
  }

  override get requiresExplicitSubmission(): boolean {
    return true;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.titleProgress == undefined) {
      return;
    }

    const titleProgress = this.titleProgress.MediaList;

    const mutationVariables: TitleProgressMutationVariables = {
      userId: this.viewerId,
      mediaId: this.sourceMangaId,
      status: titleProgress.status,
      score: titleProgress.score,
      progress: titleProgress.progress,
      progressVolumes: titleProgress.progressVolumes,
      repeat: titleProgress.repeat,
      private: titleProgress.private,
      notes: titleProgress.notes,
      hiddenFromStatusLists: titleProgress.hiddenFromStatusLists,
      //customLists: Object.keys(titleProgress.customLists),
      //advancedScores: Object.values(titleProgress.advancedScores),
    };

    await makeRequest<TitleProgress, TitleProgressMutationVariables>(
      titleProgressMutationMutation,
      true,
      mutationVariables,
    );
  }

  override formDidCancel(): void {
    return;
  }

  override getSections(): FormSectionElement[] {
    const sections: FormSectionElement[] = [];

    if (this.titleProgress == undefined && this.error == undefined) {
      return [Section("loading", [LabelRow("loading", { title: "Loading..." })])];
    }

    if (this.error != undefined) {
      return [
        Section("error", [
          LabelRow("error", {
            title: "Error",
            subtitle: this.error.toString(),
          }),
        ]),
      ];
    }

    const titleProgress = this.titleProgress!.MediaList;

    if (titleProgress.id == undefined) {
      sections.push(this.getNewMediaListEntrySection());
    }

    const trackingSections: FormSectionElement[] = [
      ...this.getProgressSections(),
      ...this.getScoreSections(),
      this.getPrivacySection(),
      this.getNotesSection(),
    ];

    // TODO: Add support for custom lists

    for (const trackingSection of trackingSections) {
      sections.push(trackingSection);
    }

    if (titleProgress.id != undefined) {
      sections.push(this.getDeleteSection());
    }

    return sections;
  }

  getNewMediaListEntrySection(): FormSectionElement {
    const newMediaListEntryLabelProps: LabelRowProps = {
      title: "New Media List Entry",
      subtitle: "Selecting Done will add this item to your media list",
    };

    return Section("newMediaListEntry", [
      LabelRow("newMediaListEntry", newMediaListEntryLabelProps),
    ]);
  }

  getProgressSections(): FormSectionElement[] {
    const titleProgress = this.titleProgress!.MediaList;

    const statusOptions = [];
    for (const key of Object.keys(MediaListStatus) as (keyof typeof MediaListStatus)[]) {
      const statusOption = MediaListStatus[key];
      statusOptions.push({
        id: statusOption.id,
        title: statusOption.label,
      });
    }

    const statusProps: SelectRowProps = {
      title: "Status",
      value: [titleProgress.status.toString()],
      minItemCount: 1,
      maxItemCount: 1,
      options: statusOptions,
      onValueChange: Application.Selector(this as TrackingForm, "statusUpdate"),
    };

    const chapterProgressProps: StepperRowProps = {
      title: "Chapters",
      subtitle: "The highest read chapter number",
      value: titleProgress.progress,
      minValue: 0,
      maxValue: 99999,
      stepValue: 1,
      loopOver: false,

      onValueChange: Application.Selector(this as TrackingForm, "chapterProgressUpdate"),
    };

    const volumeProgressProps: StepperRowProps = {
      title: "Volumes",
      subtitle: "The highest read volume number",
      value: titleProgress.progressVolumes,
      minValue: 0,
      maxValue: 99999,
      stepValue: 1,
      loopOver: false,
      onValueChange: Application.Selector(this as TrackingForm, "volumeProgressUpdate"),
    };

    const rereadCountProps: StepperRowProps = {
      title: "Reread Count",
      subtitle: "The amount of times you have reread the title",
      value: titleProgress.repeat,
      minValue: 0,
      maxValue: 99999,
      stepValue: 1,
      loopOver: false,
      onValueChange: Application.Selector(this as TrackingForm, "rereadCountUpdate"),
    };

    return [
      Section({ id: "progress", header: "Progress" }, [
        SelectRow("status", statusProps),
        StepperRow("chapterProgress", chapterProgressProps),
        StepperRow("volumeProgress", volumeProgressProps),
        StepperRow("rereadCount", rereadCountProps),
      ]),
    ];
  }

  async statusUpdate(newStatus: string[]): Promise<void> {
    if (this.titleProgress && newStatus[0]) {
      this.titleProgress.MediaList.status = newStatus[0];
    }
  }

  async chapterProgressUpdate(newChapterProgress: number): Promise<void> {
    this.titleProgress!.MediaList.progress = newChapterProgress;
    this.reloadForm();
  }

  async volumeProgressUpdate(newVolumeProgress: number): Promise<void> {
    this.titleProgress!.MediaList.progressVolumes = newVolumeProgress;
    this.reloadForm();
  }

  async rereadCountUpdate(newRereadCount: number): Promise<void> {
    this.titleProgress!.MediaList.repeat = newRereadCount;
    this.reloadForm();
  }

  getScoreSections(): FormSectionElement[] {
    const scoreProps: StepperRowProps = {
      title: "Score",
      subtitle: "",
      value: this.titleProgress!.MediaList.score,
      minValue: 0,
      maxValue: 10,
      stepValue: 0.1,
      loopOver: false,
      onValueChange: Application.Selector(this as TrackingForm, "scoreUpdate"),
    };

    // TODO: Add support for advanced scores

    return [Section({ id: "score", header: "Score" }, [StepperRow("score", scoreProps)])];
  }

  async scoreUpdate(newScore: number): Promise<void> {
    this.titleProgress!.MediaList.score = Number(newScore.toFixed(1));
    this.reloadForm();
  }

  getPrivacySection(): FormSectionElement {
    const titleProgress = this.titleProgress!.MediaList;

    const privateProps: ToggleRowProps = {
      title: "Private",
      value: titleProgress.private,
      onValueChange: Application.Selector(this as TrackingForm, "privateUpdate"),
    };

    const hiddenFromStatusListsProps: ToggleRowProps = {
      title: "Hidden From Status Lists",
      value: titleProgress.hiddenFromStatusLists,
      onValueChange: Application.Selector(this as TrackingForm, "hiddenFromStatusListsUpdate"),
    };

    const rows: FormItemElement<unknown>[] = [
      ToggleRow("private", privateProps),
      ToggleRow("hiddenFromStatusLists", hiddenFromStatusListsProps),
    ];

    return Section({ id: "privacy", header: "Privacy" }, rows);
  }

  async privateUpdate(newPrivate: boolean): Promise<void> {
    this.titleProgress!.MediaList.private = newPrivate;
  }

  async hiddenFromStatusListsUpdate(newHiddenFromStatusLists: boolean): Promise<void> {
    this.titleProgress!.MediaList.hiddenFromStatusLists = newHiddenFromStatusLists;
  }

  getNotesSection(): FormSectionElement {
    const notesProps: InputRowProps = {
      title: "Notes",
      value: this.titleProgress!.MediaList.notes ?? "",
      onValueChange: Application.Selector(this as TrackingForm, "updateNotes"),
    };

    return Section(
      {
        id: "notes",
        header: "Notes",
        footer: "Only you can see your notes",
      },
      [InputRow("notes", notesProps)],
    );
  }

  async updateNotes(newNotes: string): Promise<void> {
    this.titleProgress!.MediaList.notes = newNotes;
  }

  getDeleteSection(): FormSectionElement {
    const deleteNavigationProps: NavigationRowProps = {
      title: "Delete",
      form: new DeletionForm(this.titleProgress!.MediaList.id!),
    };

    return Section({ id: "delete", footer: "Delete the title from your media list" }, [
      NavigationRow("delete", deleteNavigationProps),
    ]);
  }
}

class DeletionForm extends Form {
  mediaListId: number | null;

  constructor(mediaListId: number) {
    super();
    this.mediaListId = mediaListId;
  }

  override getSections(): FormSectionElement[] {
    if (this.mediaListId == null) {
      const deletedLabelProps: LabelRowProps = {
        title: "Deleted",
        subtitle: "The title has been succesfully deleted from your media list",
      };

      return [Section("deleted", [LabelRow("deleted", deletedLabelProps)])];
    }

    const deleteButtonProps: ButtonRowProps = {
      title: "Delete",
      onSelect: Application.Selector(this as DeletionForm, "onDeletion"),
    };

    return [
      Section(
        {
          id: "delete",
          footer: "WARNING: All media list data will be deleted, this action can not be undone",
        },
        [ButtonRow("delete", deleteButtonProps)],
      ),
    ];
  }

  async onDeletion(): Promise<void> {
    const deletionVariables: TitleProgressDeletionVariables = {
      deleteMediaListEntryId: this.mediaListId!,
    };

    const titleProgressDeletion = await makeRequest<
      TitleProgressDeletion,
      TitleProgressDeletionVariables
    >(titleProgressDeletionMutation, true, deletionVariables);

    if (titleProgressDeletion.DeleteMediaListEntry.deleted) {
      this.mediaListId = null;
      this.reloadForm();
    }
  }
}
