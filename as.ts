let code = Deno.readTextFileSync('test.s')
    .toString()
    .split('\n')
    .map(e => e.replaceAll(/(([^;"]|"([^"]|\")+")+)?(;.+)$/gm, '$1').trim())
    .filter(e => e);

let data: { buffer: ArrayBuffer }[] = [];
let offset = 0;
function write(d: { buffer: ArrayBuffer }) {
    data.push(d);
    offset += d.buffer.byteLength;
}

function u8(p: number): Uint8Array {
    if ((p & 0xff) != p) console.warn('truncating ' + p)
    return new Uint8Array([p])
}

function u32(p: number): Uint32Array {
    return new Uint32Array([p])
}

let relocs_todo: Map<string, number> = new Map();
let relocs_located: Map<string, number> = new Map();

let org: number = 0;

function createBytesForOperand(o: string, memsz = 0): { buffer: ArrayBuffer }[] {
    if (o.startsWith('dword ') || o.startsWith('d ')) {
        return [u8(0x03), u32(+o.split(' ')[1])]
    }
    if (o.startsWith('word ') || o.startsWith('w ')) {
        return [u8(0x02), u32(+o.split(' ')[1])]
    }
    if (o.startsWith('byte ') || o.startsWith('b ')) {
        return [u8(0x01), u32(+o.split(' ')[1])]
    }
    throw new Error('cannot encode')
}

for (let e of code) {
    while (/[a-zA-Z0-9]+\:/.test(e)) {
        let label = e.split(':')[0];
        e = e.split(':').slice(1).join(':').trim();
        relocs_located.set(label, offset);
    }
    if (!e) continue;
    if (!e.startsWith('times ')) e = 'times 1 ' + e;
    while (e.startsWith('times ')) {
        let [, t, ...r] = e.split(' ')
        e = r.join(' ')
        if (e.startsWith('mv ') || e.startsWith('mov ')) {
            write(u8(0xF0))
            let [left, right] = e
                .split(' ')
                .slice(1)
                .join(' ')
                .split(',')
                .map(e => e.trim());
            
        } else if (e.startsWith('db ')) {
            if (isNaN(+e.split(' ')[1])) {

            } else {
                write(u8(+e.split(' ')[1]));
            }
        } else {
            console.error('Unkown op ' + e)
            break
        }
        if (+t > 1) {
            e = `times ${+t - 1} ${e}`
        }
    }
}
