package org.mitre.openid.connect.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Java 移植版 BinaryHttpMessage (来自 RFC 9292 / C++ quiche 实现)
 *
 * - 包含头字段、body、padding
 * - 提供基础的 getter / setter
 * - encode/decode 在子类中实现
 */
public abstract class BinaryHttpMessage<T extends BinaryHttpMessage<T>> {
    // ========== 内部类定义 ==========

    /** HTTP field: name-value pair */
    public static class Field {
        public String name;
        public String value;

        public Field(String name, String value) {
            this.name = name;
            this.value = value;
        }

        @Override
        public boolean equals(Object obj) {
            if (!(obj instanceof Field)) return false;
            Field other = (Field) obj;
            return this.name.equals(other.name) && this.value.equals(other.value);
        }

        @Override
        public String toString() {
            return name + ": " + value;
        }
    }

    /** Header fields collection */
    public static class Fields {
        private final List<Field> fields = new ArrayList<>();

        public void addField(Field f) {
            fields.add(f);
        }

        public List<Field> getFields() {
            return fields;
        }

        public boolean equals(Fields other) {
            return fields.equals(other.fields);
        }

        public byte[] serialize() throws IOException {
            int size = encodedSize();
            ByteBuffer buffer = ByteBuffer.allocate(size);
            DataWriter writer = new DataWriter(buffer);
            encode(writer);
            return buffer.array();
        }

        /** 先写入 fields 总长度，然后遍历 fields，写入 varint(nameLen +数据 + valueLen + 数据 */
        public void encode(DataWriter writer) throws IOException {
            int contentSize = 0;
            for (Field f : fields) {
                byte[] nameBytes = f.name.getBytes(StandardCharsets.US_ASCII);
                byte[] valueBytes = f.value.getBytes(StandardCharsets.US_ASCII);
                contentSize += VarInt62.len(nameBytes.length) + nameBytes.length;
                contentSize += VarInt62.len(valueBytes.length) + valueBytes.length;
            }
            // 先写入 header fields 总长度 varint
            writer.writeVarInt62(contentSize);

            for (Field f : fields) {
                byte[] nameBytes = f.name.getBytes(StandardCharsets.US_ASCII);
                byte[] valueBytes = f.value.getBytes(StandardCharsets.US_ASCII);

                writer.writeVarInt62(nameBytes.length);
                writer.writeBytes(nameBytes);

                writer.writeVarInt62(valueBytes.length);
                writer.writeBytes(valueBytes);
            }
        }

        /** 计算序列化大小 */
        public int encodedSize() {
            int contentSize = 0;
            for (Field f : fields) {
                byte[] nameBytes = f.name.getBytes(StandardCharsets.US_ASCII);
                byte[] valueBytes = f.value.getBytes(StandardCharsets.US_ASCII);

                contentSize += VarInt62.len(nameBytes.length) + nameBytes.length;
                contentSize += VarInt62.len(valueBytes.length) + valueBytes.length;
            }

            // 总长度 varint 的长度也要加上
            return VarInt62.len(contentSize) + contentSize;
        }
    }

    // ========== 成员变量 ==========
    protected Fields headerFields = new Fields();
    protected byte[] body = new byte[0];
    protected int numPaddingBytes = 0;
    protected boolean hasHost = false;

    // ========== 方法 ==========

    /** 添加 header field */
    public T addHeaderField(Field field) {
        headerFields.addField(field);
        return (T) this;
    }

    public List<Field> getHeaderFields() {
        return headerFields.getFields();
    }

    public T setBody(byte[] body) {
        this.body = body;
        return (T) this;
    }

    public byte[] getBody() {
        return body;
    }

    public void swapBody(byte[] newBody) {
        this.body = newBody;
    }

    public T setNumPaddingBytes(int n) {
        this.numPaddingBytes = n;
        return (T) this;
    }

    public int getNumPaddingBytes() {
        return numPaddingBytes;
    }

    public boolean hasHost() {
        return hasHost;
    }

    // ========== 抽象方法：子类必须实现 ==========
    public abstract int encodedSize();       // 返回序列化后大小
    public abstract byte[] serialize() throws IOException;     // 返回完整 bhttp

    // ====== Protected 公共工具方法 ======

    /** 是否 payload 相等（不考虑 padding） */
    protected boolean isPayloadEqual(BinaryHttpMessage rhs) {
        return this.body.equals(rhs.body)
                && this.headerFields.equals(rhs.headerFields);
    }

    /** 编码 header + body，用于已知长度消息 */
    protected void encodeKnownLengthFieldsAndBody(DataWriter writer) throws IOException {
        // 写 header
        headerFields.encode(writer);
        // 写 body
        writer.writeBytes(body);
    }

    /** 已知长度 header + body 的大小 */
    protected int encodedKnownLengthFieldsAndBodySize() {
        return headerFields.encodedSize() + body.length;
    }

    protected static long readVarInt62(ByteBuffer buffer) throws IOException {
        return VarInt62.read(buffer);
    }

    protected static String readStringVarInt62(ByteBuffer buffer) throws IOException {
        long len = readVarInt62(buffer);
        if (len > Integer.MAX_VALUE) {
            throw new IOException("Length too large");
        }
        byte[] bytes = new byte[(int) len];
        buffer.get(bytes);
        return new String(bytes, StandardCharsets.US_ASCII);
    }

    protected static Fields readFields(ByteBuffer buffer, int fieldsLength) throws IOException {
        Fields fields = new Fields();
        int startPos = buffer.position();
        while (buffer.position() - startPos < fieldsLength) {
            String name = readStringVarInt62(buffer);
            String value = readStringVarInt62(buffer);
            fields.addField(new Field(name, value));
        }
        return fields;
    }

    // ===== 在 BinaryHttpMessage 类中添加 =====
    protected void deserializeHeaderAndBody(ByteBuffer buffer, int headerLength, int bodyLength) throws IOException {
        if (headerLength > 0) {
            ByteBuffer headerBuffer = buffer.slice();
            headerBuffer.limit(headerLength);
            this.headerFields = readFields(headerBuffer, headerLength);
            buffer.position(buffer.position() + headerLength);
        }

        if (bodyLength > 0) {
            byte[] bodyBytes = new byte[bodyLength];
            buffer.get(bodyBytes);
            this.body = bodyBytes;
        }
    }

    @Override
    public String toString() {
        return "[BHTTP] headers=" + headerFields.getFields() + " body=" + body;
    }
}
