package org.mitre.openid.connect.bhttp;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class BinaryHttpRequest extends BinaryHttpMessage<BinaryHttpRequest> {
    private String method = "";
    private String scheme = "";
    private String authority = "";
    private String path = "";
    private int indicator = 0;

    public BinaryHttpRequest() {
        super();
    }

    // ====== Setter / Getter ======
    public BinaryHttpRequest setMethod(String method) {
        this.method = method;
        return this;
    }

    public String getMethod() {
        return method;
    }

    public BinaryHttpRequest setScheme(String scheme) {
        this.scheme = scheme;
        return this;
    }

    public String getScheme() {
        return scheme;
    }

    public BinaryHttpRequest setAuthority(String authority) {
        this.authority = authority;
        hasHost = !authority.isEmpty();
        return this;
    }

    public String getAuthority() {
        return authority;
    }

    public BinaryHttpRequest setPath(String path) {
        this.path = path;
        return this;
    }

    public String getPath() {
        return path;
    }

    // ====== 序列化方法 ======
    @Override
    public int encodedSize() {
        int size = 0;

        size += VarInt62.len(indicator);

        // ControlData: method
        size += VarInt62.len(method.getBytes(StandardCharsets.US_ASCII).length)
                + method.getBytes(StandardCharsets.US_ASCII).length;

        // ControlData: scheme（即使为空也写入长度0）
        size += VarInt62.len(scheme.getBytes(StandardCharsets.US_ASCII).length)
                + scheme.getBytes(StandardCharsets.US_ASCII).length;

        // ControlData: authority
        size += VarInt62.len(authority.getBytes(StandardCharsets.US_ASCII).length)
                + authority.getBytes(StandardCharsets.US_ASCII).length;

        // ControlData: path
        size += VarInt62.len(path.getBytes(StandardCharsets.US_ASCII).length)
                + path.getBytes(StandardCharsets.US_ASCII).length;

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

        // 写入 Framing Indicator = 0 (Known-Length)
        writer.writeVarInt62(indicator);

        // 写入 Control Data
        writer.writeStringVarInt62(method);
        writer.writeStringVarInt62(scheme);       // 即使为空，也写长度0
        writer.writeStringVarInt62(authority);
        writer.writeStringVarInt62(path);

        // 写入 Header fields
        headerFields.encode(writer);

        // 写入 body
        writer.writeBytes(body);

        // 写入 padding
        writer.writePadding(numPaddingBytes);

        return writer.toByteArray();
    }

    // ===== 反序列化方法 =====
    public static BinaryHttpRequest deserialize(byte[] data, int padding) throws IOException {
        ByteBuffer buffer = ByteBuffer.wrap(data);
        BinaryHttpRequest req = new BinaryHttpRequest();

        // 读取 Framing Indicator，必须是 0
        long framingIndicator = readVarInt62(buffer);
        if (framingIndicator != 0) {
            throw new IOException("Unsupported framing indicator: " + framingIndicator);
        }

        // 读取 Control Data
        req.method = readStringVarInt62(buffer);
        req.scheme = readStringVarInt62(buffer);    // 即使为空也会读取长度0
        req.authority = readStringVarInt62(buffer);
        req.path = readStringVarInt62(buffer);

        // 解析 header fields
        long headersLength = readVarInt62(buffer);
        req.headerFields = readFields(buffer, (int) headersLength);

        // body 部分
        int bodyLen = buffer.remaining() - padding;
        if (bodyLen > 0) {
            byte[] bodyBytes = new byte[bodyLen];
            buffer.get(bodyBytes);
            req.body = bodyBytes;
        }

        req.numPaddingBytes = padding;
        return req;
    }
}
