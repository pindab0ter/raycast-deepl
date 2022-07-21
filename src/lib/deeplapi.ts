import { useCallback, useEffect, useRef, useState } from "react";
import fetch, { AbortError, FormData } from "node-fetch";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";

export function setUpTranslation(targetLanguage: Language): {
  setText: (text: string) => Promise<void>;
  state: TranslationState;
  setSourceLanguage: (sourceLanguage: (Language | null)) => void
} {
  const [state, setState] = useState<TranslationState>({
    text: "",
    translation: null,
    sourceLanguage: null,
    usage: null,
    isLoading: true
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const setSourceLanguage = useCallback(
    (sourceLanguage: Language | null): void => {
      setState((oldState: TranslationState) => ({ ...oldState, sourceLanguage }));
    },
    [setState]
  );

  const setText = useCallback(
    async function translate(text: string): Promise<void> {
      setState((oldState: TranslationState) => ({ ...oldState, text: text }));
    }, [abortControllerRef, setState]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState((oldState: TranslationState) => ({ ...oldState, isLoading: true }));

    async function performTranslation(): Promise<void> {
      try {
        const translation = state.text.length > 0
          ? await getTranslation(state.text, state.sourceLanguage, targetLanguage, abortControllerRef.current?.signal ?? null)
          : null;

        const usage = translation != null
          ? await getUsage(abortControllerRef.current?.signal ?? null)
          : null;

        setState((oldState: TranslationState) => ({ ...oldState, translation, usage, isLoading: false }));
      } catch (error) {
        setState((oldState: TranslationState) => ({ ...oldState, isLoading: false }));

        if (error instanceof AbortError) return;

        console.error("Translation error", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Could not perform translation",
          message: String(error),
        }).then();
      }
    }

    performTranslation().then();
  }, [state.text, state.sourceLanguage]);

  return { state, setSourceLanguage, setText };
}

async function getTranslation(
  text: string,
  sourceLanguage: Language | null,
  targetLanguage: Language,
  signal: AbortSignal | null,
): Promise<Translation> {
  const preferences = getPreferenceValues();

  const formData = new FormData();
  formData.append("auth_key", preferences.apikey);
  formData.append("text", text);
  if (sourceLanguage != null) {
    formData.append("source_lang", sourceLanguage.code);
  }
  formData.append("target_lang", targetLanguage.code);

  const response = await fetch(apiUrlFor("translate"), {
    method: "post",
    signal: signal,
    body: formData,
  });

  const json = (await response.json()) as TranslationResponse | ErrorResponse;

  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? json.message : response.statusText);
  }

  // We only ever send one query to the API, so only one result is ever returned.
  return json.translations[0];
}

export async function getUsage(
  signal: AbortSignal | null
): Promise<Usage | null> {
  const preferences = getPreferenceValues();

  const formData = new FormData();
  formData.append("auth_key", preferences.apikey);

  // Fetch after getting translation result to get up-to-date usage info
  const response = await fetch(apiUrlFor("usage"), {
    method: "post",
    signal: signal,
    body: formData,
  });

  const json = (await response.json()) as Usage | ErrorResponse;

  return (!response.ok || "message" in json) ? null : json;
}

export const sourceLanguages: Language[] = [
  { code: "BG", name: "Bulgarian" },
  { code: "CS", name: "Czech" },
  { code: "DA", name: "Danish" },
  { code: "DE", name: "German" },
  { code: "EL", name: "Greek" },
  { code: "EN", name: "English" },
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
  { code: "RO", name: "Romanian" },
  { code: "RU", name: "Russian" },
  { code: "SK", name: "Slovak" },
  { code: "SL", name: "Slovenian" },
  { code: "SV", name: "Swedish" },
  { code: "TR", name: "Turkish" },
  { code: "ZH", name: "Chinese (simplified)" },
];

function apiUrlFor(endpoint: Endpoint): string {
  const baseUrl = getPreferenceValues().plan == "free"
    ? "https://api-free.deepl.com/v2/"
    : "https://api.deepl.com/v2/";

  return baseUrl + endpoint;
}

type Endpoint = "translate" | "usage" | "languages";

export type Language = {
  code: string;
  name: string;
};

export type TranslationResponse = {
  translations: Translation[];
};

export type ErrorResponse = {
  message: string;
};

export type TranslationState = {
  text: string;
  translation: Translation | null;
  sourceLanguage: Language | null;
  usage: Usage | null;
  isLoading: boolean;
};

export type Translation = {
  text: string;
  detected_source_language: string;
};

export type Usage = {
  character_count: number;
  character_limit: number;
};
