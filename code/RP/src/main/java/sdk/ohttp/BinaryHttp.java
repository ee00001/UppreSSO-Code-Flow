package sdk.ohttp;

import java.io.*;
import java.nio.charset.StandardCharsets;

public final class BinaryHttp {

    public static byte[] encode(String method, String authority, String path,
                                java.util.Map<String, String> headers, byte[] body) throws IOException {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        DataOutputStream out = new DataOutputStream(buf);
        out.writeByte(0x02);                      // version
        out.writeByte(method.length());
        out.writeBytes(method);
        out.writeByte(authority.length());
        out.writeBytes(authority);
        out.writeByte(path.length());
        out.writeBytes(path);
        out.writeShort(headers.size());
        for (java.util.Map.Entry<String, String> e : headers.entrySet()) {
            byte[] k = e.getKey().getBytes(StandardCharsets.UTF_8);
            byte[] v = e.getValue().getBytes(StandardCharsets.UTF_8);
            out.writeByte(k.length);
            out.write(k);
            out.writeShort(v.length);
            out.write(v);
        }
        out.writeInt(body.length);
        out.write(body);
        return buf.toByteArray();
    }

    public static final class Response {
        public final int status;
        public final byte[] body;
        public Response(int s, byte[] b) { this.status = s; this.body = b; }
    }

    public static Response decode(byte[] raw) throws IOException {
        DataInputStream in = new DataInputStream(new ByteArrayInputStream(raw));
        in.readByte(); // ver
        int status = in.readUnsignedShort();
        int hdrCnt = in.readUnsignedShort();
        for (int i = 0; i < hdrCnt; i++) {
            int kLen = in.readUnsignedByte();
            in.skipBytes(kLen);
            int vLen = in.readUnsignedShort();
            in.skipBytes(vLen);
        }
        int bodyLen = in.readInt();
        byte[] body = new byte[bodyLen];
        in.readFully(body);
        return new Response(status, body);
    }

}
