org 0xFFFC0000



start:
    mv mri, interrupt_table
    mv orl, mrf
    mv orr, 2
    mv mrf, bro
    mv mre, 0x80000000
    mv mrp, mrp

interrupt_table:
    times 31 dd 0
    dd interface_interrupt_handler

interface_interrupt_handler:
    mv mrp, d prb



; comments
labels:
    mv dword 0xb8000, grb
    mov grb, gra
    mov grc, dword 0xa000
    mov grd, 0xdeadbeef
    mov mrf, 0
    mov mrp, labels
    mov mrp, future
future: