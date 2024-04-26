export function fromDelta(ops: any): string {
    let md = '';

    for (const op of ops) {
        const { attributes } = op;
        let link = undefined;
        let s = '';
        let w = '';
        if (op.insert) s = op.insert;
        if (attributes) {
            if (attributes.bold && attributes.italic) w = '***';
            else if (attributes.bold && !attributes.italic) w = '**';
            else if (attributes.italic) w = '*';
            if (attributes.link) link = attributes.link;
        }
        s = `${w}${s}${w}`;
        if (link) s = `[${s}](${link})`;
        md += s;
    }

    return md;
}

export type DeltaAttributes = {
    bold?: boolean;
    italic?: boolean;
    link?: string;
}

export type Delta = {
    insert?: string;
    attributes?: DeltaAttributes;
};

export function toDelta(md: string, forcedAttributes: DeltaAttributes | undefined = undefined): any {
    const ops: Delta[] = [];

    let op: Delta = { insert: '' };
    if (forcedAttributes) op.attributes = { ...forcedAttributes };

    const nextOp = (push: boolean = true) => {
        if (push) ops.push(op);
        op = { insert: '' };
        if (forcedAttributes) op.attributes = { ...forcedAttributes };
    };

    const lastOp = () => {
        let op3 = ops.pop();
        if (!op3) {
            op3 = { insert: '' };
            if (forcedAttributes) op3.attributes = { ...forcedAttributes };
        }
        op = op3;
    }

    let c0 = '', c1 = '', c2 = '', ccc = '';

    const next = (i: number) => {
        c0 = md[i + 0]; // Character + 0
        c1 = md[i + 1]; // Character + 1
        c2 = md[i + 2]; // Character + 2
        ccc = '';
        if (c0 && c1 && c2) {
            ccc = c0 + c1 + c2;
        } else if (c0 && c1) {
            ccc = c0 + c1;
        } else {
            ccc = c0;
        }
    };

    let linkSeek = 0;
    let linkStage = 0;
    let linkText = '';
    let link = '';

    for (let i = 0; i < md.length; i++) {

        next(i);

        let seek = 0;
        let charsToSeek = '';

        if (ccc.startsWith('***')) {
            if (op.insert && op.insert.length) nextOp();
            charsToSeek = '***';
            seek = 3;
            if (!op.attributes) op.attributes = {};
            op.attributes.italic = true;
            op.attributes.bold = true;
        } else if (ccc.startsWith('**')) {
            if (op.insert && op.insert.length) nextOp();
            charsToSeek = '**';
            seek = 2;
            if (!op.attributes) op.attributes = {};
            op.attributes.bold = true;
        } else if (ccc.startsWith('*')) {
            if (op.insert && op.insert.length) nextOp();
            charsToSeek = '*';
            seek = 1;
            if (!op.attributes) op.attributes = {};
            op.attributes.italic = true;
        } else if (c0 === '[') {
            if (op.insert && op.insert.length) nextOp();
            linkStage = 1;
            linkSeek = 1;
            linkText = '';
            link = '';
        }

        const handleLink = (): boolean => {
            while (c0 !== ']') {
                c0 = md[i + linkSeek];
                linkSeek++;

                // Catch EOL here.
                if (!c0) {
                    console.warn(`Invalid markdown! "${md}`);
                    linkStage = 0;
                    lastOp();
                    return false;
                }

                if (c0 !== ']') linkText += c0;
            }

            // Catch bad link syntax here.
            if (md.substring(i + linkSeek - 1, i + linkSeek + 1) !== '](') {
                console.warn(`Invalid markdown! "${md}`);
                // Catch EOL here.
                if (!c0) {
                    console.warn(`Invalid markdown! "${md}`);
                    linkStage = 0;
                    lastOp();
                    return false;
                }
            }

            while (c0 !== ')') {
                c0 = md[i + linkSeek];
                linkSeek++;

                // Catch EOL here.
                if (!c0) {
                    console.warn(`Invalid markdown! "${md}`);
                    linkStage = 0;
                    lastOp();
                    return false;
                }

                if (c0 !== ')') link += c0;
            }

            // Set link.

            // Check for inner-text markdown. In delta, we can stack link attributes to allow rich text features.
            let opsCheck = toDelta(linkText, { ...forcedAttributes, link });
            for (const _ of opsCheck) ops.push(_);
            nextOp();

            // Reset metadata.
            linkStage = 0;
            i += linkSeek - 1;

            return true;
        }

        if (linkStage === 1) {
            // Valid link. Continue on..
            if (handleLink()) continue;
        }

        // Run-out the insert length until the attribute-closure appears.
        if (seek !== 0) {
            while (true) {
                next(i + seek);

                // Catch EOL here.
                if (!c0) {
                    console.warn(`Invalid markdown! "${md}`);
                    return [{ insert: md }];
                }

                if (ccc.startsWith(charsToSeek)) {
                    const ourText = md.substring(i + charsToSeek.length, i + seek);
                    seek += charsToSeek.length - 1;
                    i += seek; // Set ahead.

                    const ops3 = toDelta(ourText, { ...forcedAttributes, ...op.attributes });
                    for (const n of ops3) {
                        ops.push(n);
                    }

                    nextOp(true);
                    break;
                } else {
                    seek++;
                }
            }

            continue;
        }

        // Normal insert chars.
        op.insert += c0;
    }

    if (op.insert?.length) nextOp();

    // Filter empty inserts.
    let ops2: Delta[] = [];
    for (const next of ops) {
        if (!next.insert || !next.insert.length) continue;
        ops2.push(next);
    }
    return ops2;
}

export const createDeltaEditor = (id: string, markdown: string | undefined, onChange: (markdown: string) => void) => {

    if (!markdown) markdown = '';

    const toolbarOptions = [['bold', 'italic', 'link']];
    const options = {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions,
            QuillMarkdown: {}
        }
    };

    // @ts-ignore
    const editor = new Quill(`#${id}`, options);
    // @ts-ignore
    new QuillMarkdown(editor, {});

    const update = () => {
        const { ops } = editor.editor.getContents(0, 99999999);
        let markdown = fromDelta(ops);
        if (markdown === '\n') markdown = '';
        else if (!markdown.endsWith('\n')) markdown += '\n';
        onChange(markdown);
    }

    editor.on('text-change', () => update());

    // Apply markdown as delta.
    if (markdown && markdown.length) {
        setTimeout(() => {
            editor.editor.insertContents(0, toDelta(markdown!));
            update();
        }, 1);
    }
}