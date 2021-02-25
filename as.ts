export const _ = 0;
let code = Deno.readTextFileSync('input.s')
    .toString()
    .split('\n')
    .map(e => e.replaceAll(/(([^;"]|"([^"]|\")+")+)?(;.+)$/gm, '$1').trim())
    .filter(e => e);

let data: Map<number, { buffer: ArrayBuffer }> = new Map();
let offset = 0;
function write(d: { buffer: ArrayBuffer }) {
    data.set(offset, d);
    offset += d.buffer.byteLength;
}

function u8(p: number): Uint8Array {
    if ((p & 0xff) != p) console.warn('[u8] truncating 0x' + p.toString(16))
    return new Uint8Array([p])
}

function u16(p: number): Uint16Array {
    if ((p & 0xffff) != p) console.warn('[u16] truncating 0x' + p.toString(16))
    return new Uint16Array([p])
}
function u24(p: number): Uint8Array {
    if ((p & 0xffffff) != p) console.warn('[u16] truncating 0x' + p.toString(16))
    return new Uint8Array([p, p >> 16, p >> 24])
}

function u32(p: number): Uint32Array {
    if ((p & 0xffffffff) != (p | 0)) console.warn('[u32] truncating 0x' + p.toString(16))
    return new Uint32Array([p])
}

let relocs_todo: Map<string, number[]> = new Map();
let relocs_located: Map<string, number> = new Map();

let regs: Map<string, number> = new Map([
    ['gra', 0x04],
    ['grb', 0x05],
    ['grc', 0x06],
    ['grd', 0x07],
    ['gre', 0x08],
    ['grf', 0x09],
    ['orl', 0x0A],
    ['orr', 0x0B],
    ['nrl', 0x0C],
    ['nrr', 0x0D],
    ['ara', 0x0E],
    ['ars', 0x0F],
    ['arm', 0x10],
    ['ard', 0x11],
    ['aro', 0x12],
    ['bra', 0x13],
    ['bro', 0x14],
    ['brx', 0x15],
    ['brn', 0x16],
    ['srr', 0x17],
    ['srl', 0x18],
    ['nro', 0x19],
    ['prs', 0x1A],
    ['pbs', 0x1B],
    ['mrf', 0x1C],
    ['mri', 0x1D],
    ['mre', 0x1E],
    ['mrn', 0x1F],
    ['mrp', 0x20],
])

let org: number = 0;

function stripsqb(x: string): number {
    if (x.startsWith('[') && x.endsWith(']')) return +x.slice(1, -1)
    return +x
}

function resolveSymReloc(o: string): Uint32Array[] {
    if (!isNaN(+o)) {
        return [u32(+o)]
    }
    if (relocs_located.has(o)) {
        return [u32(relocs_located.get(o)!)]
    }
    if (relocs_todo.has(o)) {
        relocs_todo.get(o)!.push(offset)
    } else {
        relocs_todo.set(o, [offset])
    }
    return [u32(0)]
}
function handleLoad(ldbyte: number, str: string): { buffer: ArrayBuffer }[] {
    if (str.includes('+') || str.includes(' off ')) {
        let [left, right] = str.split(/(\+| off )/)
        if (!regs.has(left)) {
            console.error('invalid operands')
            return []
        }
        if (isNaN(+right)) {
            console.error('invalid operands')
            return []
        }
        return [
            u8(ldbyte + 0x20),
            u24(+right)
        ]
    }
    return [u8(ldbyte), u32(stripsqb(str))]
}
function createBytesForOperand(o: string): { buffer: ArrayBuffer }[] {
    if (regs.has(o)) return [u8(regs.get(o)!)]
    if (o.startsWith('dword ') || o.startsWith('d ')) {
        return handleLoad(0x03, o.split(' ')[1])
    }
    if (o.startsWith('word ') || o.startsWith('w ')) {
        return handleLoad(0x02, o.split(' ')[1])
    }
    if (o.startsWith('byte ') || o.startsWith('b ')) {
        return handleLoad(0x01, o.split(' ')[1])
    }
    if (o.startsWith('[') && o.endsWith(']')) {
        return handleLoad(0x03, o.slice(1, -1))
    }
    return resolveSymReloc(o);
}

for (let e of code) {
    while (/[a-zA-Z0-9]+\:/.test(e)) {
        let label = e.split(':')[0];
        e = e.split(':').slice(1).join(':').trim();
        relocs_located.set(label, offset);
        if (relocs_todo.has(label)) {
            for (let e of relocs_todo.get(label)!) {
                data.set(e, u32(offset));
            }
        }
        relocs_todo.delete(label)
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
            let off0 = offset;
            let dst = createBytesForOperand(left)
            dst.forEach(write)
            let src = createBytesForOperand(right)
            src.forEach(write)
            if (offset > off0 + 6) {
                console.error('Overflowing insn ' + e, offset, off0 + 6)
            }
            while (offset < off0 + 6)write(u8(0))
            write(u8(0x0f))
        } else if (e.startsWith('db ')) {
            write(u8(+e.split(' ')[1]));
        } else if (e.startsWith('dd ')) {
            write(resolveSymReloc(e.split(' ')[1])[0])
        } else if (e.startsWith('org ')) {
            offset = resolveSymReloc(e.split(' ')[1])[0][0]
        } else {
            console.error('Unkown op ' + e)
            break
        }
        if (+t > 1) {
            e = `times ${+t - 1} ${e}`
        }
    }
}
let blob = new Uint8Array([...data.values()].flatMap(e => [...new Uint8Array(e.buffer)]))
Deno.writeFileSync('output.bin', blob)
console.log(blob)

