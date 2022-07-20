import { List } from "@raycast/api";
import { Language, languages, useTranslation } from "./lib/deeplapi";
import { TranslationListItem } from "./components/translation-list-item";

export default function command(targetLanguage: Language): () => JSX.Element {
  return (): JSX.Element => {
    const { state, translation } = useTranslation(targetLanguage);

    // TODO: Only show usage when on Free plan
    // TODO: Only show formality when on Pro plan
    const usage = state.result?.usage
    let subtitle: string;
    if (usage != null) {
      const usagePercentage = Number(usage.character_count / usage.character_limit)
        .toLocaleString(undefined, {
          style: "percent",
          maximumFractionDigits: 2
        })
      subtitle = `${usage.character_count}/${usage.character_limit} characters used (${usagePercentage})`;
    } else {
      subtitle = "";
    }

    const languageCode: string = state.result?.translation?.detected_source_language as string;
    const sourceLanguage = languageCode
      ? languages.find((language: Language) => language.code == languageCode)
      : null;
    const title = sourceLanguage
      ? `Translated from ${sourceLanguage?.name}:`
      : "Translation:"

    return (
      <List
        isLoading={state.isLoading}
        onSearchTextChange={translation}
        searchBarPlaceholder={`Translate to ${targetLanguage.name} using DeepL…`}
        throttle
      >
        <List.Section title={title} subtitle={subtitle}>
          <TranslationListItem result={state.result}/>
        </List.Section>
      </List>
    );
  }
}
