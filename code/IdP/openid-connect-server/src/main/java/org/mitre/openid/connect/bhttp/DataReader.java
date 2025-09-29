package org.mitre.openid.connect.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class DataReader {
    private final ByteBuffer buffer;

    public DataReader(byte[] data) {
        buffer = ByteBuffer.wrap(data);
    }

    public boolean hasRemaining() {
        return buffer.hasRemaining();
    }

    public long readVarInt62() throws IOException {
        return VarInt62.read(buffer);
    }

    public String readStringVarInt62() throws IOException {
        long len = readVarInt62();
        if (len > buffer.remaining()) {
            throw new IOException("Invalid length in readStringVarInt62");
        }
        byte[] bytes = new byte[(int) len];
        buffer.get(bytes);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    public byte[] readBytes(int n) throws IOException {
        if (n > buffer.remaining()) {
            throw new IOException("Not enough bytes");
        }
        byte[] bytes = new byte[n];
        buffer.get(bytes);
        return bytes;
    }

    public byte[] readRemainingPayload() {
        byte[] bytes = new byte[buffer.remaining()];
        buffer.get(bytes);
        return bytes;
    }

    public long peekVarInt62() throws IOException {
        buffer.mark();
        long v = VarInt62.read(buffer);
        buffer.reset();
        return v;
    }
}
