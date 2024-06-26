import { RosettaLanguage } from "../RosettaLanguage";

export const LANGUAGE_ADAPTERS: { [id: string]: (json: any) => RosettaLanguage<string> } = {};
