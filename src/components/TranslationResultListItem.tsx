import { Action, ActionPanel, List } from "@raycast/api";
import { TranslationState } from "../lib/deeplapi";

export default function TranslationResultListItem({ state }: { state: TranslationState }) {
  if (state.translation == null) {
    return null
  }

  return (
    <List.Item
      title={state.translation.text}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Translated Text"
              content={state.translation?.text}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
