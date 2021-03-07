const kCommandTypeRegex = /^[\t\n\f\r ]*([MLHVZCSQTAmlhvzcsqta])[\t\n\f\r ]*/;
const kFlagRegex = /^[01]/;
const kNumberRegex = /^[+-]?(([0-9]*\.[0-9]+)|([0-9]+\.)|([0-9]+))([eE][+-]?[0-9]+)?/;
const kCoordinateRegex = kNumberRegex;
const kCommaWsp = /^(([\t\n\f\r ]+,?[\t\n\f\r ]*)|(,[\t\n\f\r ]*))/;

const kGrammar: {[key: string]: RegExp[]}  = {
    M: [kCoordinateRegex, kCoordinateRegex],
    L: [kCoordinateRegex, kCoordinateRegex],
    H: [kCoordinateRegex],
    V: [kCoordinateRegex],
    Z: [],
    C: [kCoordinateRegex, kCoordinateRegex, kCoordinateRegex, kCoordinateRegex, kCoordinateRegex, kCoordinateRegex],
    S: [kCoordinateRegex, kCoordinateRegex, kCoordinateRegex, kCoordinateRegex],
    Q: [kCoordinateRegex, kCoordinateRegex, kCoordinateRegex, kCoordinateRegex],
    T: [kCoordinateRegex, kCoordinateRegex],
    A: [kNumberRegex, kNumberRegex, kCoordinateRegex, kFlagRegex, kFlagRegex, kCoordinateRegex, kCoordinateRegex],
};

export class SvgParser {

    static components(type: string, path: string, cursor: number): [number, string[][]]
    {
        const expectedRegexList = kGrammar[type.toUpperCase()];

        const components: string[][] = [];
        while (cursor <= path.length) {
            const component: string[] = [type];
            for (const regex of expectedRegexList) {
                const match = path.slice(cursor).match(regex);

                if (match !== null) {
                    component.push(match[0]);
                    cursor += match[0].length;
                    const ws = path.slice(cursor).match(kCommaWsp);
                    if (ws !== null) {
                        cursor += ws[0].length;
                    }
                } else if (component.length === 1) {
                    return [cursor, components];
                } else {
                    throw new Error('malformed path (first error at ' + cursor + ')');
                }
            }
            components.push(component);
            if (expectedRegexList.length === 0) {
                return [cursor, components];
            }
            if (type === 'm') {
                type = 'l';
            }
            if (type === 'M') {
                type = 'L';
            }
        }
        throw new Error('malformed path (first error at ' + cursor + ')');
    }

    public static parse(path: string): string[][] {
        let cursor = 0;
        let tokens: string[][] = [];
        while (cursor < path.length) {
            const match = path.slice(cursor).match(kCommandTypeRegex);
            if (match !== null) {
                const command = match[1];
                cursor += match[0].length;
                const componentList = SvgParser.components(command, path, cursor);
                cursor = componentList[0];
                tokens = [...tokens, ...componentList[1]];
            } else {
                throw new Error('malformed path (first error at ' + cursor + ')');
            }
        }
        return tokens;
    }
}
