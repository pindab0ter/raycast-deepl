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
        });
      }
    },
    [abortControllerRef, setState]
  );

  useEffect(() => {
    translation("");
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
): Promise<TranslationResult | null> {

  if (text.length === 0) return null;

  const preferences = getPreferenceValues();

  const translationFormData = new FormData();
  translationFormData.append("auth_key", preferences.apikey);
  translationFormData.append("text", text);
  // TODO: Write script to fill package.json and generate .tsx files with available languages:
  //  https://www.deepl.com/docs-api/other-functions/listing-supported-languages/
  translationFormData.append("target_lang", target.code);

  // TODO: use api/api-free depending on subscription
  const translationResponse = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "post",
    signal: signal,
    body: translationFormData
  });

  const translationJson = (await translationResponse.json()) as
    | {
        translations: {
          detected_source_language: string,
          text: string,
        }[];
      }
    | { message: string };

  if (!translationResponse.ok || "message" in translationJson) {
    throw new Error("message" in translationJson ? translationJson.message : translationResponse.statusText);
  }

  const translationResult = translationJson.translations[0];

  const usageFormData = new FormData();
  usageFormData.append("auth_key", preferences.apikey);

  // TODO: use api/api-free depending on subscription
  // Fetch after getting translation result to get up-to-date usage info
  const usageResponse = await fetch("https://api-free.deepl.com/v2/usage", {
    method: "post",
    signal: signal,
    body: usageFormData
  });

  const usageJson = (await usageResponse.json()) as
    | {
        character_count: number,
        character_limit: number
      }
    | { message: string };

  const usageResult = !usageResponse.ok || "message" in usageJson
    ? null
    : {
      characterCount: usageJson.character_count,
      characterLimit: usageJson.character_limit
    }

  return {
    detectedSourceLanguage: translationResult.detected_source_language,
    text: translationResult.text,
    usage: usageResult
  };
}

export interface Language {
  name: string,
  code: string
}

export interface TranslationState {
  result: TranslationResult | null;
  isLoading: boolean;
}

export interface TranslationResult {
  text: string,
  detectedSourceLanguage: string,
  usage:
    | {
        characterCount: number,
        characterLimit: number
      }
    | null
}
