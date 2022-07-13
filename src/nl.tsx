import { List } from "@raycast/api";
import { useTranslation } from "./lib/deeplapi";
import { TranslationListItem } from "./components/translation_list_item";

export default function Command() {
  const { state, translation } = useTranslation();

  const usage = state.result?.usage

  // TODO: Only show usage when on Free plan
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
