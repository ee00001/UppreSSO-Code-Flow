package org.mitre.openid.connect.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class BinaryHttpResponse extends BinaryHttpMessage<BinaryHttpResponse> {
    private int statusCode = 200;         // HTTP 状态码
    private String reasonPhrase = "";     // 可选的原因短语
    private int indicator = 0;

    public BinaryHttpResponse() {
        super();
    }

    // ===== Setter / Getter =====
    public BinaryHttpResponse setStatusCode(int code) {
        this.statusCode = code;
        return this;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public BinaryHttpResponse setReasonPhrase(String reason) {
        this.reasonPhrase = reason;
        return this;
    }

    public String getReasonPhrase() {
        return reasonPhrase;
    }

    // ===== 序列化方法 =====
    @Override
    public int encodedSize() {
        int size = 0;

        size += VarInt62.len(indicator);

        // Control Data: status code + reason phrase
        size += VarInt62.len(statusCode);

        size += VarInt62.len(reasonPhrase.getBytes(StandardCharsets.US_ASCII).length)
                + reasonPhrase.getBytes(StandardCharsets.US_ASCII).length;

        // Header Fields
        size += headerFields.encodedSize();

        // Body
        size += body.length;

        // Padding
        size += numPaddingBytes;

        return size;
    }

    @Override
    public byte[] serialize() throws IOException {
        int totalSize = encodedSize();
        DataWriter writer = new DataWriter(totalSize);

        // 写入 Framing Indicator = 0
        writer.writeVarInt62(0);


        // 写入 Control Data
        writer.writeVarInt62(statusCode);

        byte[] reasonBytes = reasonPhrase.getBytes(StandardCharsets.US_ASCII);
        writer.writeVarInt62(reasonBytes.length);
        writer.writeBytes(reasonBytes);

        // 写入 Header Fields
        headerFields.encode(writer);

        // 写入 Body
        writer.writeBytes(body);

        // 写入 Padding
        writer.writePadding(numPaddingBytes);

        // 返回完整 byte[]
        return writer.toByteArray();
    }

    // ===== 反序列化方法 =====
    public static BinaryHttpResponse deserialize(byte[] data, int padding) throws IOException {
        ByteBuffer buffer = ByteBuffer.wrap(data);
        BinaryHttpResponse response = new BinaryHttpResponse();

        // 读取 Framing Indicator，必须是 0
        long framingIndicator = readVarInt62(buffer);
        if (framingIndicator != 0) {
            throw new IOException("Unsupported framing indicator: " + framingIndicator);
        }

        // Control data: status code
        response.statusCode = (int) readVarInt62(buffer);

        // Control data: reason phrase
        response.reasonPhrase = readStringVarInt62(buffer);

        // 解析 header fields
        long headersLength = readVarInt62(buffer);
        response.headerFields = readFields(buffer,(int) headersLength);

        // Body: 最后 padding 字节不计入 body
        int bodyLength = buffer.remaining() - padding;
        if (bodyLength > 0) {
            byte[] bodyBytes = new byte[bodyLength];
            buffer.get(bodyBytes);
            response.body = bodyBytes;
        } else {
            response.body = new byte[0];
        }

        response.numPaddingBytes = padding;
        return response;
    }

    @Override
    protected boolean isPayloadEqual(BinaryHttpMessage rhs) {
        if (!(rhs instanceof BinaryHttpResponse)) return false;
        BinaryHttpResponse r = (BinaryHttpResponse) rhs;
        return this.statusCode == r.statusCode
                && this.reasonPhrase.equals(r.reasonPhrase)
                && Arrays.equals(this.body, r.body)
                && this.headerFields.equals(r.headerFields);
    }
}
