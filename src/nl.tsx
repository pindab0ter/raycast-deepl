import { Action, ActionPanel, getPreferenceValues, List, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import fetch, { AbortError, FormData } from "node-fetch";

export default function Command() {
  const { state, translation } = useTranslation();

  const usage = state.result?.usage

  let subtitle: string;
  if (usage != null) {
    const usagePercentage = Number(usage.characterCount / usage.characterLimit)
      .toLocaleString(undefined, {
        style: "percent",
        maximumFractionDigits: 2
      })
    subtitle = `${ usage.characterCount }/${ usage.characterLimit } characters used (${ usagePercentage })`;
  } else {
    subtitle = "";
  }

  return (
    <List
      isLoading={ state.isLoading }
      onSearchTextChange={ translation }
      searchBarPlaceholder="Translate to Dutch using DeepL…"
      throttle
    >
      {/* TODO: Add human readable source language */ }
      <List.Section title={ `Translated from ${ state.result?.detectedSourceLanguage }` } subtitle={ subtitle }>
        <TranslationListItem translationResult={ state.result }/>
      </List.Section>
    </List>
  );
}

function TranslationListItem({ translationResult }: { translationResult: TranslationResult | null }) {
  if (translationResult == null) return null;

  return (
    <List.Item
      title={ translationResult.text }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Translated Text"
              content={ translationResult.text }
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function useTranslation() {
  const [state, setState] = useState<TranslationState>({ result: null, isLoading: true });
  const cancelRef = useRef<AbortController | null>(null);

  const translation = useCallback(
    async function translate(text: string) {
      cancelRef.current?.abort();
      cancelRef.current = new AbortController();
      setState((oldState) => ({
        ...oldState,
        isLoading: true,
      }));
      try {
        const result = await performTranslation(text, cancelRef.current.signal);
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
        showToast({ style: Toast.Style.Failure, title: "Could not perform translation", message: String(error) });
      }
    },
    [cancelRef, setState]
  );

  useEffect(() => {
    translation("");
    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  return {
    state: state,
    translation: translation,
  };
}

async function performTranslation(text: string, signal: AbortSignal): Promise<TranslationResult | null> {
  if (text.length === 0) return null;

  const preferences = getPreferenceValues();

  const translationFormData = new FormData();
  translationFormData.append("auth_key", preferences.apikey);
  translationFormData.append("text", text);
  translationFormData.append("target_lang", "NL");

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

interface TranslationState {
  result: TranslationResult | null;
  isLoading: boolean;
}

interface UsageResult {
  characterCount: number,
  characterLimit: number
}

interface TranslationResult {
  text: string,
  detectedSourceLanguage: string,
  usage: UsageResult | null
}
