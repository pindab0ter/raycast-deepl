import { Action, ActionPanel, getPreferenceValues, List, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import fetch, { AbortError, FormData } from "node-fetch";

export default function Command() {
  const { state, translation } = useTranslation();

  return (
    <List
      isLoading={ state.isLoading }
      onSearchTextChange={ translation }
      searchBarPlaceholder="Translate to Dutch using DeepL…"
      throttle
    >
      <TranslationListItem translationResult={ state.result }/>
    </List>
  );
}

function TranslationListItem({ translationResult }: { translationResult: TranslationResult | null }) {
  if (translationResult == null) return null;

  return (
    <List.Item
      title={ translationResult.text }
      subtitle={ `Translated from ${ translationResult.detectedSourceLanguage }` }
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

  const formData = new FormData();
  formData.append("auth_key", preferences.apikey);
  formData.append("text", text);
  formData.append("target_lang", "NL");

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "post",
    signal: signal,
    body: formData
  });

  const json = (await response.json()) as
    | {
        translations: {
          detected_source_language: string,
          text: string,
        }[];
      }
    | { message: string };

  if (!response.ok || "message" in json) {
    throw new Error("message" in json ? json.message : response.statusText);
  }

  const translationResult = json.translations[0];

  return {
    detectedSourceLanguage: translationResult.detected_source_language,
    text: translationResult.text,
  };
}

interface TranslationState {
  result: TranslationResult | null;
  isLoading: boolean;
}

interface TranslationResult {
  text: string;
  detectedSourceLanguage: string;
}
