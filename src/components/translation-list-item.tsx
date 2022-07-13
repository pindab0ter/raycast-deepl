import { Action, ActionPanel, List } from "@raycast/api";
import { TranslationResult } from "../lib/deeplapi";

export function TranslationListItem({ translationResult }: { translationResult: TranslationResult | null }) {
  if (translationResult == null) return null;

  // TODO: Replace with detail view: https://developers.raycast.com/api-reference/user-interface/detail
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
