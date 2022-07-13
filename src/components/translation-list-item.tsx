import { Action, ActionPanel, List } from "@raycast/api";
import { Translation, Usage } from "../lib/deeplapi";

export function TranslationListItem({ result }: { result: { translation: Translation, usage: Usage | null } | null }) {
  if (result == null) return null;

  // TODO: Replace with detail view: https://developers.raycast.com/api-reference/user-interface/detail
  return (
    <List.Item
      title={ result.translation.text }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Translated Text"
              content={ result.translation.text }
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
