package sdk.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class DataWriter {
    private final ByteBuffer buffer;

    public DataWriter(int capacity) {
        buffer = ByteBuffer.allocate(capacity);
    }

    public DataWriter(ByteBuffer existingBuffer) {
        this.buffer = existingBuffer;
    }

    public void writeVarInt62(long value) throws IOException {
        VarInt62.write(buffer, value);
    }

    public void writeStringVarInt62(String s) throws IOException {
        byte[] bytes = s.getBytes(StandardCharsets.UTF_8);
        writeVarInt62(bytes.length);
        buffer.put(bytes);
    }

    public void writeBytes(byte[] bytes) {
        buffer.put(bytes);
    }

    public void writePadding(int n) {
        for (int i = 0; i < n; i++) {
            buffer.put((byte) 0x00);
        }
    }

    public byte[] toByteArray() {
        int pos = buffer.position();
        byte[] result = new byte[pos];
        buffer.rewind();
        buffer.get(result, 0, pos);
        return result;
    }
}
