package org.mitre.openid.connect.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Arrays;

public class BinaryHttpResponse extends BinaryHttpMessage<BinaryHttpResponse> {
    private int statusCode = 200;         // HTTP 状态码
    private String reasonPhrase = "";     // 可选的原因短语
    private int indicator = 1;

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

        // Control Data: status code
        size += VarInt62.len(statusCode);

        // Header Fields
        size += headerFields.encodedSize();

        // Body
        size += VarInt62.len(body.length) + body.length;

        // Padding
        size += numPaddingBytes;

        return size;
    }

    @Override
    public byte[] serialize() throws IOException {
        int totalSize = encodedSize();
        DataWriter writer = new DataWriter(totalSize);

        // 写入 Framing Indicator = 1
        writer.writeVarInt62(indicator);

        // 写入 Control Data: status code
        writer.writeVarInt62(statusCode);

        // 写入 Header Fields
        headerFields.encode(writer);

        // 写入 Body
        writer.writeVarInt62(body.length);
        writer.writeBytes(body);

        // 写入 Padding
        writer.writePadding(numPaddingBytes);

        // 返回完整 byte[]
        return writer.toByteArray();
    }

    // ===== 反序列化方法 =====
    public static BinaryHttpResponse deserialize(byte[] data) throws IOException {
        ByteBuffer buffer = ByteBuffer.wrap(data);
        BinaryHttpResponse response = new BinaryHttpResponse();

        // 读取 Framing Indicator，必须是 0
        long framingIndicator = readVarInt62(buffer);
        if (framingIndicator != 1) {
            throw new IOException("Unsupported framing indicator: " + framingIndicator);
        }

        // Control data: status code
        response.statusCode = (int) readVarInt62(buffer);

        // 解析 header fields
        long headersLength = readVarInt62(buffer);
        if (headersLength < 0 || headersLength > buffer.remaining()) {
            throw new IOException("Invalid headers length");
        }
        response.headerFields = readFields(buffer,(int) headersLength);

        //  Content
        long contentLen = readVarInt62(buffer);
        if (contentLen < 0 || contentLen > buffer.remaining()) {
            throw new IOException("Invalid content length");
        }
        byte[] bodyBytes = new byte[(int) contentLen];
        if (contentLen > 0) buffer.get(bodyBytes);
        response.body = bodyBytes;

        // padding 全为 0
        int pad = 0;
        while (buffer.hasRemaining()) {
            if (buffer.get() != 0) throw new IOException("Non-zero padding");
            pad++;
        }
        response.numPaddingBytes = pad;

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
