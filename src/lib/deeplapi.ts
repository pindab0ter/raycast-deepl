import { useCallback, useEffect, useRef, useState } from "react";
import fetch, { AbortError, FormData } from "node-fetch";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";

export function useTranslation(target: Language) {
  const [state, setState] = useState<TranslationState>({ result: null, isLoading: true });
  const abortControllerRef = useRef<AbortController | null>(null);

  const translation = useCallback(
    async function translate(text: string) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));
      try {
        const result = await performTranslation(text, target, abortControllerRef.current.signal);
        setState((oldState) => ({
          ...oldState,
          result: result,
          isLoading: false,
        }));
      } catch (error) {
        setState((oldState) => ({
          ...oldState,
          isLoading: false,
        }));

        if (error instanceof AbortError) {
          return;
        }

        console.error("translation error", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Could not perform translation",
          message: String(error)
        }).then();
      }
    },
    [abortControllerRef, setState]
  );

  useEffect(() => {
    translation("").then();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    state: state,
    translation: translation,
  };
}

async function performTranslation(
  text: string,
  target: Language,
  signal: AbortSignal
): Promise<{ translation: Translation; usage: Usage | null } | null> {

  if (text.length === 0) return null;

  const preferences = getPreferenceValues();

  const formData = new FormData();
  formData.append("auth_key", preferences.apikey);
  formData.append("text", text);
  formData.append("target_lang", target.code);

  const response = await fetch(apiUrlFor("translate"), {
    method: "post",
    signal: signal,
    body: formData
  });

  const json = await response.json() as
    | {
        translations: Translation[];
      }
    | { message: string };

  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? json.message : response.statusText);
  }

  const translation = json.translations[0];
  const usage = await getUsage(signal);

  return {
    translation: translation,
    usage: usage
  };
}

export async function getUsage(signal: AbortSignal | null = null): Promise<Usage | null> {
  const preferences = getPreferenceValues();

  const formData = new FormData();
  formData.append("auth_key", preferences.apikey);

  // Fetch after getting translation result to get up-to-date usage info
  const response = await fetch(apiUrlFor("usage"), {
    method: "post",
    signal: signal,
    body: formData
  });

  const json = await response.json() as Usage | ErrorResponse;

  return !response.ok || "message" in json
    ? null
    : json;
}

function apiUrlFor(endpoint: Endpoint): string {
  const baseUrl = getPreferenceValues().plan == "free"
    ? "https://api-free.deepl.com/v2/"
    : "https://api.deepl.com/v2/";

  return baseUrl + endpoint;
}

type Endpoint = "translate" | "usage" | "languages";

export type Language = {
  name: string,
  code: string
}

export type ErrorResponse = {
  message: string
}

export type TranslationState = {
  result: { translation: Translation, usage: Usage | null } | null;
  isLoading: boolean;
}

export type Usage = {
  character_count: number,
  character_limit: number
}

export type Translation = {
  text: string,
  detected_source_language: string,
}
