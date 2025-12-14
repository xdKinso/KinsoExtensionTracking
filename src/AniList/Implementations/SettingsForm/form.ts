// TODO: Expand upon this by showing more profile data and allowing mutations
import {
  ButtonRow,
  Form,
  LabelRow,
  NavigationRow,
  OAuthButtonRow,
  Section,
  ToggleRow,
} from "@paperback/types";
import type {
  ButtonRowProps,
  FormItemElement,
  FormSectionElement,
  LabelRowProps,
  NavigationRowProps,
  OAuthButtonRowProps,
  ToggleRowProps,
} from "@paperback/types";
import type { JwtPayload, Viewer } from "../../GraphQL/Viewer";
import { viewerQuery } from "../../GraphQL/Viewer";
import makeRequest from "../../Services/Requests";

export function getSynonymsSetting(): boolean {
  return Application.getState("setting-synonyms-in-titles") as boolean;
}

export class SettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    if (Application.getSecureState("session") == undefined) {
      return [Section("no-session", [this.loginButton()])];
    }

    return [
      Section("session", [this.profileViewNavigation(), this.logOutButton()]),
      Section("settings", [this.synonymsToggle()]),
    ];
  }

  loginButton(): FormItemElement<unknown> {
    const loginButtonProps: OAuthButtonRowProps = {
      title: "Log In",
      subtitle: "Log in to AniList to automatically sync your library and reading progress.",
      onSuccess: Application.Selector(this as SettingsForm, "handleLoginSuccess"),
      authorizeEndpoint:
        "https://anilist.co/api/v2/oauth/authorize?client_id=6621&response_type=token",
      responseType: {
        type: "token",
      },
      clientId: "6621",
    };

    return OAuthButtonRow("login", loginButtonProps);
  }

  profileViewNavigation(): FormItemElement<unknown> {
    const profileViewProps: NavigationRowProps = {
      title: "View Profile",
      form: new ProfileViewForm(),
    };

    return NavigationRow("profile-view", profileViewProps);
  }

  logOutButton() {
    const logOutButtonProps: ButtonRowProps = {
      title: "Log Out",
      onSelect: Application.Selector(this as SettingsForm, "logOut"),
    };

    return ButtonRow("log-out", logOutButtonProps);
  }

  synonymsToggle() {
    const synonymsToggleProps: ToggleRowProps = {
      title: "Display title synonyms if the title is not in English",
      value: getSynonymsSetting() ?? false,
      onValueChange: Application.Selector(this as SettingsForm, "handleSynonymsToggle"),
    };

    return ToggleRow("synonyms", synonymsToggleProps);
  }

  async handleSynonymsToggle(value: boolean): Promise<void> {
    Application.setState(value, "setting-synonyms-in-titles");
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleLoginSuccess(accessToken: string): Promise<void> {
    Application.setSecureState(accessToken, "session");

    const viewer = await makeRequest<Viewer>(viewerQuery, true);

    Application.setState(viewer.Viewer.id, "viewer-id");
    Application.setState(
      JSON.stringify(viewer.Viewer.mediaListOptions.mangaList.advancedScoring),
      "viewer-advanced-scoring",
    );
    Application.setState(
      JSON.stringify(viewer.Viewer.mediaListOptions.mangaList.sectionOrder),
      "viewer-list-order",
    );
    Application.setState(
      JSON.stringify(viewer.Viewer.mediaListOptions.mangaList.customLists),
      "viewer-custom-lists",
    );
    Application.setState(
      String(viewer.Viewer.mediaListOptions.mangaList.splitCompletedSectionByFormat),
      "viewer-split-completed-list-by-format",
    );
    Application.setState(
      String(viewer.Viewer.mediaListOptions.mangaList.advancedScoringEnabled),
      "viewer-advanced-scoring-enabled",
    );

    this.reloadForm();
  }

  async logOut(): Promise<void> {
    Application.setSecureState(null, "session");

    Application.setState(null, "viewer-id");
    Application.setState(null, "viewer-advanced-scoring");
    Application.setState(null, "viewer-list-order");
    Application.setState(null, "viewer-custom-lists");
    Application.setState(null, "viewer-split-completed-list-by-format");
    Application.setState(null, "viewer-advanced-scoring-enabled");

    this.reloadForm();
  }
}

class ProfileViewForm extends Form {
  loadRequest?: Promise<unknown>;
  viewer?: Viewer;
  error?: Error;

  override formWillAppear(): void {
    this.loadRequest = makeRequest<Viewer>(viewerQuery, true)
      .then((viewer) => {
        this.viewer = viewer;
      })
      .catch((error: Error) => {
        this.error = error;
      })
      .finally(() => {
        this.reloadForm();
      });
  }

  override getSections(): FormSectionElement[] {
    if (this.viewer == undefined && this.error == undefined) {
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

    return [this.getProfileSection(this.viewer!), this.getSessionSection()];
  }

  getProfileSection(value: Viewer): FormSectionElement {
    const creationDate = new Date(0);
    creationDate.setUTCSeconds(value.Viewer.createdAt);

    const rows: FormItemElement<unknown>[] = [
      // An image form element is needed to be able to display this
      //LabelRow("avatar", { title: "Avatar", value: value.Viewer.avatar.large }),
      LabelRow("username-id", {
        title: "Username",
        value: value.Viewer.name,
        subtitle: "Id: " + value.Viewer.id.toString(),
      }),
      LabelRow("creation-date", {
        title: "Creation Date",
        value: creationDate.toLocaleString(),
      }),
    ];

    return Section({ id: "profile-data", header: "Profile" }, rows);
  }

  getSessionSection(): FormSectionElement {
    const token = String(Application.getSecureState("session"));
    const tokenParts = token.split(".");
    if (!tokenParts[1]) {
      throw new Error("Invalid session token");
    }

    const payload = JSON.parse(
      typeof Application.base64Decode === "function"
        ? Application.base64Decode(tokenParts[1])
        : typeof atob === "function"
          ? atob(tokenParts[1])
          : (() => {
              // eslint-disable-next-line no-undef
              if (typeof Buffer !== "undefined") {
                // eslint-disable-next-line no-undef
                return Buffer.from(tokenParts[1], "base64").toString("utf-8");
              }
              throw new Error("No base64 decoder available in this environment");
            })(),
    ) as JwtPayload;

    const rows: FormItemElement<unknown>[] = [];
    for (const [key, value] of Object.entries(payload)) {
      const labelProps: LabelRowProps = {
        title: key,
      };

      if (key == "jti") {
        labelProps.subtitle = String(value);
      } else {
        labelProps.value = String(value) || "Undefined";
      }

      rows.push(LabelRow(key, labelProps));
    }

    return Section({ id: "session-data", header: "Session" }, rows);
  }
}
