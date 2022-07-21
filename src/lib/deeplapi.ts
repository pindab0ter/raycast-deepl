import { useCallback, useEffect, useRef, useState } from "react";
import fetch, { AbortError, FormData } from "node-fetch";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";

export function useTranslation(target: Language): { state: TranslationState, performTranslation: (text: string) => Promise<void> } {
  const [state, setState] = useState<TranslationState>({ translation: null, usage: null, isLoading: true });
  const abortControllerRef = useRef<AbortController | null>(null);

  const performTranslation = useCallback(
    async function translate(text: string) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState((oldState: TranslationState) => ({
        ...oldState,
        isLoading: true,
      }));

      try {
        const translation = (text.length > 0) ? await getTranslation(text, target, abortControllerRef.current.signal) : null;
        const usage = translation != null ? await getUsage(abortControllerRef.current.signal) : null;

        setState(() => ({
          translation,
          usage,
          isLoading: false,
        }));

      } catch (error) {
        setState((oldState: TranslationState) => ({
          ...oldState,
          isLoading: false,
        }));

        if (error instanceof AbortError) {
          return;
        }

        console.error("Translation error", error);
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
    performTranslation("");
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { state, performTranslation };
}

async function getTranslation(
  text: string,
  target: Language,
  signal: AbortSignal
): Promise<Translation> {
  console.log("getTranslation", text, target);
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

  const json = await response.json() as | TranslationResponse | ErrorResponse;

  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? json.message : response.statusText);
  }

  // TODO: Support multiple results
  return json.translations[0];
}

export async function getUsage(
  signal: AbortSignal
): Promise<Usage | null> {
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

export const languages = [
  { code: "BG", name: "Bulgarian" },
  { code: "CS", name: "Czech" },
  { code: "DA", name: "Danish" },
  { code: "DE", name: "German" },
  { code: "EL", name: "Greek" },
  { code: "EN", name: "English" },
  { code: "EN-GB", name: "English (British)" },
  { code: "EN-US", name: "English (American)" },
  { code: "ES", name: "Spanish" },
  { code: "ET", name: "Estonian" },
  { code: "FI", name: "Finnish" },
  { code: "FR", name: "French" },
  { code: "HU", name: "Hungarian" },
  { code: "ID", name: "Indonesian" },
  { code: "IT", name: "Italian" },
  { code: "JA", name: "Japanese" },
  { code: "LT", name: "Lithuanian" },
  { code: "LV", name: "Latvian" },
  { code: "NL", name: "Dutch" },
  { code: "PL", name: "Polish" },
  { code: "PT", name: "Portuguese" },
  { code: "PT-BR", name: "Portuguese (Brazilian)" },
  { code: "PT-PT", name: "Portuguese (European)" },
  { code: "RO", name: "Romanian" },
  { code: "RU", name: "Russian" },
  { code: "SK", name: "Slovak" },
  { code: "SL", name: "Slovenian" },
  { code: "SV", name: "Swedish" },
  { code: "TR", name: "Turkish" },
  { code: "ZH", name: "Chinese (simplified)" },
]

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

export type TranslationResponse = {
  translations: Translation[]
}

export type ErrorResponse = {
  message: string
}

export type TranslationState = {
  translation: Translation | null;
  usage: Usage | null;
  isLoading: boolean;
}

export type Translation = {
  text: string,
  detected_source_language: string,
}

export type Usage = {
  character_count: number,
  character_limit: number
}
