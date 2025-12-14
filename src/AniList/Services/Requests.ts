import type { Request, Response } from "../GraphQL/General";
import type { JwtPayload } from "../GraphQL/Viewer";

function decodeBase64(payload: string): string {
  // Paperback runtime does not guarantee Node's Buffer, so use a cross-runtime decoder
  if (typeof Application.base64Decode === "function") {
    return Application.base64Decode(payload);
  }

  if (typeof atob === "function") {
    return atob(payload);
  }

  // Last resort: try Buffer if it exists (web builds polyfill it)
  // eslint-disable-next-line no-undef
  if (typeof Buffer !== "undefined") {
    // eslint-disable-next-line no-undef
    return Buffer.from(payload, "base64").toString("utf-8");
  }

  throw new Error("No base64 decoder available in this environment");
}

const GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

export default async function makeRequest<ResponseType, QueryVariablesType = never>(
  query: string,
  needsAuth: boolean,
  QueryVariables?: QueryVariablesType,
): Promise<ResponseType> {
  const request: Request = {
    url: GRAPHQL_ENDPOINT,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: query,
      variables: QueryVariables,
    }),
  };

  if (needsAuth) {
    const token = Application.getSecureState("session");

    if (!token || token === "undefined" || token === "null") {
      throw new Error("You are not authenticated, please log in through the AniList settings");
    }

    const tokenString = String(token);

    const tokenParts = tokenString.split(".");
    if (!tokenParts[1]) {
      throw new Error("Invalid authentication token");
    }
    const payload = JSON.parse(decodeBase64(tokenParts[1])) as JwtPayload;

    if (Number(payload.exp) < new Date().valueOf() / 1000) {
      Application.setSecureState(null, "session");

      Application.setState(null, "viewer-id");
      Application.setState(null, "viewer-advanced-scoring");
      Application.setState(null, "viewer-list-order");
      Application.setState(null, "viewer-custom-lists");
      Application.setState(null, "viewer-split-completed-list-by-format");
      Application.setState(null, "viewer-advanced-scoring-enabled");

      throw new Error(
        "Your authorization token has expired, please log back in through the AniList settings",
      );
    }

    request.headers.Authorization = "Bearer " + tokenString;
  }

  const [_, buffer] = await Application.scheduleRequest(request);
  const data = Application.arrayBufferToUTF8String(buffer);
  const unkownResponse: unknown = JSON.parse(data);

  if (unkownResponse == undefined || typeof unkownResponse !== "object") {
    throw new Error(`Failed to parse JSON object: ${String(unkownResponse)}`);
  }

  const response = unkownResponse as Response;

  if (Array.isArray(response.errors) && response.errors.length > 0) {
    let errorMessages = "";
    for (let i = 0; i < response.errors.length; i++) {
      if (i != 0) {
        errorMessages += "\n";
      }

      const error = response.errors[i];
      if (error) {
        errorMessages += `AniList returned an error: [${error.status}] ${error.message}`;
      }
    }

    throw new Error(errorMessages);
  }

  if (response.data == undefined) {
    throw new Error("AniList returned an empty response body");
  }

  return response.data as ResponseType;
}
