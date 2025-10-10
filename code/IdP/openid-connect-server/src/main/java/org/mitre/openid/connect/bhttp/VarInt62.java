package org.mitre.openid.connect.bhttp;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class VarInt62 {
    // 计算一个值需要多少字节存储
    public static int len(long value) {
        if (value < (1L << 6)) return 1;
        if (value < (1L << 14)) return 2;
        if (value < (1L << 30)) return 4;
        if (value < (1L << 62)) return 8;
        throw new IllegalArgumentException("VarInt62 too large: " + value);
    }

    // 写入一个 VarInt62
    public static void write(ByteBuffer buffer, long value){
		int L = len(value);
		ensureRemaining(buffer, L);
		buffer.order(ByteOrder.BIG_ENDIAN);

		if (value < (1L << 6)) {
            buffer.put((byte) (value & 0x3f));
        } else if (value < (1L << 14)) {
            int v = (int) (value | 0x4000);
            buffer.putShort((short) v);
        } else if (value < (1L << 30)) {
            int v = (int) (value | 0x80000000L);
            buffer.putInt(v);
        } else {
            long v = value | 0xC000000000000000L;
            buffer.putLong(v);
        }
    }

    // 从 buffer 读取 VarInt62
    public static long read(ByteBuffer buffer){
        int first = buffer.get() & 0xFF;
        int prefix = first >> 6;
		long v;

        switch (prefix) {
            case 0: // 1 byte
                return first & 0x3F;
            case 1: // 2 bytes
				if (buffer.remaining() < 1) throw new IllegalArgumentException("buffer underflow: need 2");
				v = ((first & 0x3F) << 8) | (buffer.get() & 0xFF);
				if (v <= 63) throw new IllegalArgumentException("non-canonical 2-byte varint");
				return v;
            case 2: // 4 bytes
				if (buffer.remaining() < 3) throw new IllegalArgumentException("buffer underflow: need 4");
				v = ((long)(first & 0x3F) << 24)
					| ((long)(buffer.get() & 0xFF) << 16)
					| ((long)(buffer.get() & 0xFF) << 8)
					| (buffer.get() & 0xFF);
				if (v <= 16383) throw new IllegalArgumentException("non-canonical 4-byte varint");
				return v;
            case 3: // 8 bytes
				if (buffer.remaining() < 7) throw new IllegalArgumentException("buffer underflow: need 8");
				v = ((long)(first & 0x3F) << 56);
				for (int i = 0; i < 7; i++) {
					v |= ((long)(buffer.get() & 0xFF) << (48 - i * 8));
				}
				if (v <= 1_073_741_823L) throw new IllegalArgumentException("non-canonical 8-byte varint");
				return v;
            default:
                throw new IllegalArgumentException("Invalid VarInt62 prefix");
        }
    }

    // 预读 (peek) 下一个 varint，不移动 buffer
    public static long peek(ByteBuffer buffer){
        buffer.mark();
        long v = read(buffer);
        buffer.reset();
        return v;
    }

	private static void ensureRemaining(ByteBuffer buf, int need) {
		if (buf.remaining() < need) {
			throw new IllegalArgumentException("buffer underflow: need " + need + ", have " + buf.remaining());
		}
	}
}
