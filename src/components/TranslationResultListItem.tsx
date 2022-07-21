import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import { Translation, Usage } from "../lib/deeplapi";

export function TranslationResultListItem({ result }: { result: { translation: Translation, usage: Usage | null } | null }) {
  if (result == null) return null;

  return (
    <List.Item
      title={result.translation.text}
      detail={
        <List.Item.Detail
          markdown={`${result.translation.text}`}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Usage" text={result.usage?.character_count + "/" + result.usage?.character_limit}/>
            </List.Item.Detail.Metadata>
          }/>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Translated Text"
              content={result.translation.text}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
