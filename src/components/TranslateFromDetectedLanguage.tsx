import { getPreferenceValues, List } from "@raycast/api";
import { Language, languages, Translation, Usage, useTranslation } from "../lib/deeplapi";
import TranslationResultListItem from "./TranslationResultListItem";

export default function TranslateFromDetectedLanguage(props: { targetLanguage: Language }) {
  const { state, performTranslation } = useTranslation(props.targetLanguage);

  // TODO: Show dropdown of languages to translate from, defaulting to autodetected language
  // TODO: Only show usage when on Free plan
  // TODO: Only show formality when on Pro plan

  return (
    <List
      isLoading={state.isLoading}
      onSearchTextChange={performTranslation}
      searchBarPlaceholder={`Translate to ${props.targetLanguage.name} using DeepL…`}
      throttle
    >
      <List.Section
        title={generateTitle(state.translation)}
        subtitle={generateSubtitle(state.usage)}
      >
        <TranslationResultListItem state={state} />
      </List.Section>
    </List>
  );
}

function generateTitle(translation: Translation | null): string {
  if (translation == null) {
    return "Translation:";
  }

  const sourceLanguage = translation.detected_source_language
    ? languages.find((language: Language) => language.code == translation.detected_source_language)
    : null;

  if (sourceLanguage == null) {
    return "Translation:";
  }

  return `Translated from ${sourceLanguage.name}:`;
}

function generateSubtitle(usage: Usage | null): string {
  if (usage == null) {
    return "";
  }

  const usagePercentage = (usage.character_count / usage.character_limit).toLocaleString(undefined, {
    style: "percent",
    maximumFractionDigits: 2,
  });

  const characterCount = usage.character_count.toLocaleString();
  const characterLimit = usage.character_limit.toLocaleString();
  const plan = getPreferenceValues().plan == "free" ? "DeepL API Free" : "DeepL API Pro";

  return `${usagePercentage} of ${plan} plan used this period (${characterCount} / ${characterLimit} characters)`;
}
