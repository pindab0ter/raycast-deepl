import { List } from "@raycast/api";
import { Language, useTranslation } from "./lib/deeplapi";
import { TranslationListItem } from "./components/translation-list-item";

export default function command(target: Language): () => JSX.Element {
  return (): JSX.Element => {
    const { state, translation } = useTranslation(target);

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

    return (
      <List
        isLoading={state.isLoading}
        onSearchTextChange={translation}
        searchBarPlaceholder={`Translate to ${target.name} using DeepL…`}
        throttle
      >
        <List.Section title={`Translated from ${state.result?.translation.detected_source_language}`} subtitle={subtitle}>
          <TranslationListItem result={state.result}/>
        </List.Section>
      </List>
    );
  }
}
