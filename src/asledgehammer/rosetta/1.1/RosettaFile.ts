import { RosettaLanguage } from "../RosettaLanguage";
import { LANGUAGE_ADAPTERS } from "./Rosetta";
import { RosettaSerializable } from "./RosettaSerializable";

export class RosettaFile implements RosettaSerializable {

    readonly languages: { [id: string]: RosettaLanguage<string> } = {};

    fromJSON(json: any): void {

        const { languages } = this;

        // (Version Check)
        if (!json.version || json.version !== '1.1') {
            throw new Error(`Invalid Rosetta version: ${json.version} (Should be "1.1")`);
        }

        // (Rosetta Languages)
        const keys = Object.keys(json);
        for (const key of keys) {
            if (LANGUAGE_ADAPTERS[key]) {
                languages[key] = LANGUAGE_ADAPTERS[key](json[key]);
            }
        }

    }

    toJSON(): any {

        const { languages } = this;

        const json: any = {};
        let keys: string[];

        // (Rosetta Version)
        json.version = '1.1';

        // (Rosetta Languages)
        keys = Object.keys(languages);
        if (keys.length) {

            keys.sort((a, b) => a.localeCompare(b));

            // (Write Language)
            for (const key of keys) {
                json[key] = languages[key].toJSON();
            }

        }

        return json;

    }

}