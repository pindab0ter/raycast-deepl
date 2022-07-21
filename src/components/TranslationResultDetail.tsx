import { Action, ActionPanel, Detail, getPreferenceValues } from "@raycast/api";
import { TranslationState, Usage } from "../lib/deeplapi";

export default function TranslationResultDetail({ state }: { state: TranslationState }) {

  if (state.translation == null) {
    return null;
  }

  return <Detail
    markdown={`${state.translation?.text}`}
    actions={
      <ActionPanel>
        <Action.CopyToClipboard
          title="Copy Translated Text"
          content={state.translation?.text}
        />
      </ActionPanel>
    }
    metadata={metadata(state.usage)}
  />;
}

function metadata(usage: Usage | null): JSX.Element | null {
  if (usage == null) {
    return null;
  }

  const preferences = getPreferenceValues();
  const plan = preferences.plan == "free" ? "DeepL API Free" : "DeepL API Pro";

  return <Detail.Metadata>
    <Detail.Metadata.Label
      title={`${plan} usage this period`}
      text={(usage.character_count / usage.character_limit).toLocaleString(undefined, {
        style: "percent",
        maximumFractionDigits: 2
      })}
    />
    <Detail.Metadata.Label
      title="Characters used"
      text={`${usage.character_count.toLocaleString()} / ${usage.character_limit.toLocaleString()}`}
    />
  </Detail.Metadata>
}


