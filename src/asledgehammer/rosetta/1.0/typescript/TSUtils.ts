export function paginateNotes(notes: string, length: number): string[] {

    function _line(line: string): string[] {
        const split = line?.trim().split(' ');
        const result: string[] = [];
        let s = split[0];
        for (let i = 1; i < split.length; i++) {
            let word = split[i];
            if (s.length + word.length + 1 <= length) {
                s = s + ' ' + word;
            } else {
                result.push(s);
                s = word;
            }
        }
        if (s.length) result.push(s);
        return result;
    }

    const res: string[] = [];
    const lines = notes.split('\n');
    for (const line of lines) {
        const subLines = _line(line);
        for (const subLine of subLines) {
            res.push(subLine);
        }
    }
    return res;
}

export function applyTSDocumentation(ds: string[], s: string, indent: number): string {
    const i = ' '.repeat(indent * 4);
    if (ds.length) {
        if (ds.length === 1) {
            s += `${i}/** ${ds[0]} */\n`;
        } else {
            s += `${i}/**\n`;
            for (const next of ds) {
                s += `${i} * ${next}\n`;
            }
            s = s.substring(0, s.length - 1);
            // s += ds.map((a) => `${i} * ${a}`).join('\n');
            s += `\n${i} */\n`;
        }
    }
    return s;
}

export function wrapAsTSFile(text: string): string {
    let s = '';
    s += `/** @noSelfInFile */\n`;
    s += `declare module '@asledgehammer/pipewrench'`;
    if (text.length) {
        return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
    }
    return `${s} {}\n`;
}

export function wrapAsTSNamespace(namespace: string, text: string): string {
    const s = `export namespace ${namespace}`;
    if (text.length) {
        return `${s} {\n\n` + text.split('\n').map((a) => `    ${a}`).join('\n') + '\n}';
    }
    return `${s} {}\n`;
}
