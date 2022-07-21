import { List } from "@raycast/api";
import { Language, languages, useTranslation } from "../lib/deeplapi";
import TranslationResultListItem from "./TranslationResultListItem";

export default function TranslateFromDetectedLanguage(props: { targetLanguage: Language }) {
  const { state, performTranslation } = useTranslation(props.targetLanguage);

  // TODO: Show dropdown of languages to translate from, defaulting to autodetected language
  // TODO: Only show usage when on Free plan
  // TODO: Only show formality when on Pro plan
  let subtitle: string;

  if (state.usage != null) {
    const usagePercentage = Number(state.usage.character_count / state.usage.character_limit)
      .toLocaleString(undefined, {
        style: "percent",
        maximumFractionDigits: 2
      })
    subtitle = `${state.usage.character_count}/${state.usage.character_limit} characters used (${usagePercentage})`;
  } else {
    subtitle = "";
  }

  const languageCode: string = state.translation?.detected_source_language ?? "";
  const sourceLanguage = languageCode
    ? languages.find((language: Language) => language.code == languageCode)
    : null;
  const title = sourceLanguage
    ? `Translated from ${sourceLanguage?.name}:`
    : "Translation:"

  return (
    <List
      isLoading={state.isLoading}
      onSearchTextChange={performTranslation}
      searchBarPlaceholder={`Translate to ${props.targetLanguage.name} using DeepL…`}
      throttle
    >
      <List.Section title={title} subtitle={subtitle}>
        <TranslationResultListItem state={state}/>
      </List.Section>
    </List>
  );
}
