import { Language } from "./lib/deeplapi";
import TranslateFromDetectedLanguage from "./components/TranslateFromDetectedLanguage";

export default function command(targetLanguage: Language): () => JSX.Element {
  return (): JSX.Element => TranslateFromDetectedLanguage(targetLanguage);
}
