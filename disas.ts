export const _ = 0;
let values: Map<number, string> = new Map([
    [0x00, 'imm'],
    [0x01, 'b'],
    [0x02, 'w'],
    [0x03, 'd'],
    [0x04, 'gra'],
    [0x05, 'grb'],
    [0x06, 'grc'],
    [0x07, 'grd'],
    [0x08, 'gre'],
    [0x09, 'grf'],
    [0x0A, 'orl'],
    [0x0B, 'orr'],
    [0x0C, 'nrl'],
    [0x0D, 'nrr'],
    [0x0E, 'ara'],
    [0x0F, 'ars'],
    [0x10, 'arm'],
    [0x11, 'ard'],
    [0x12, 'aro'],
    [0x13, 'bra'],
    [0x14, 'bro'],
    [0x15, 'brx'],
    [0x16, 'brn'],
    [0x17, 'srr'],
    [0x18, 'srl'],
    [0x19, 'nro'],
    [0x1A, 'prs'],
    [0x1B, 'pbs'],
    [0x1C, 'mrf'],
    [0x1D, 'mri'],
    [0x1E, 'mre'],
    [0x1F, 'mrn'],
    [0x20, 'mrp'],
    [0x21, 'b'],
    [0x22, 'w'],
    [0x23, 'd'],
])
let data = Deno.readFileSync('out.bin')
for (let i = 0;i < data.length;i++) {
    if (i % 8 == 0) {
        if (data[i] == 0xF0) {
            // disassemble
            
        }
    }
}