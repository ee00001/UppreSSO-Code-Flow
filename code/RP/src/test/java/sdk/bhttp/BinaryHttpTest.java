package sdk.bhttp;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class BinaryHttpTest {

    public static void main(String[] args) throws IOException {
        testBinaryHttpRequest();
        testBinaryHttpResponse();
    }

    private static void testBinaryHttpRequest() throws IOException {
        System.out.println("=== Testing BinaryHttpRequest ===");

        BinaryHttpRequest request = new BinaryHttpRequest()
                .setMethod("GET")
                .setScheme("https")
                .setAuthority("example.com")
                .setPath("/api/data")
                .addHeaderField(new BinaryHttpMessage.Field("Accept", "application/json"))
                .addHeaderField(new BinaryHttpMessage.Field("User-Agent", "JavaClient"))
                .setBody("Hello Request".getBytes(StandardCharsets.US_ASCII))
                .setNumPaddingBytes(2);

        // 序列化
        byte[] serialized = request.serialize();
        System.out.println("Serialized Request (" + serialized.length + " bytes): " + Arrays.toString(serialized));
        int encodedSize = request.encodedSize();
        System.out.println("encodedSize: " + encodedSize + ", actual bytes: " + serialized.length);
        assert encodedSize == serialized.length : "encodedSize mismatch";
        System.out.println("Request serialization test passed.\n");

        // 反序列化
        BinaryHttpRequest deserialized = BinaryHttpRequest.deserialize(serialized, request.getNumPaddingBytes());
        assert request.getMethod().equals(deserialized.getMethod());
        System.out.println("Request deserialization method test passed.\n");
        assert request.getScheme().equals(deserialized.getScheme());
        System.out.println("Request deserialization scheme test passed.\n");
        assert request.getAuthority().equals(deserialized.getAuthority());
        System.out.println("Request deserialization authority test passed.\n");
        assert request.getPath().equals(deserialized.getPath());
        System.out.println("Request deserialization path test passed.\n");
        assert Arrays.equals(request.getBody(), deserialized.getBody());
        System.out.println("Request deserialization body test passed.\n");
        assert request.getHeaderFields().equals(deserialized.getHeaderFields());
        System.out.println("Request deserialization header test passed.\n");
        System.out.println("Request deserialization test passed.\n");
    }

    private static void testBinaryHttpResponse() throws IOException {
        System.out.println("=== Testing BinaryHttpResponse ===");

        BinaryHttpResponse response = new BinaryHttpResponse()
                .setStatusCode(200)
                .setReasonPhrase("OK")
                .addHeaderField(new BinaryHttpMessage.Field("Content-Type", "text/plain"))
                .setBody("Hello Response".getBytes(StandardCharsets.US_ASCII))
                .setNumPaddingBytes(3);

        // 序列化
        byte[] serialized = response.serialize();
        System.out.println("Serialized Response (" + serialized.length + " bytes): " + Arrays.toString(serialized));
        int encodedSize = response.encodedSize();
        System.out.println("encodedSize: " + encodedSize + ", actual bytes: " + serialized.length);
        assert encodedSize == serialized.length : "encodedSize mismatch";

        // 反序列化
        BinaryHttpResponse deserialized = BinaryHttpResponse.deserialize(serialized, response.getNumPaddingBytes());
        assert response.getStatusCode() == deserialized.getStatusCode();
        assert response.getReasonPhrase().equals(deserialized.getReasonPhrase());
        assert Arrays.equals(response.getBody(), deserialized.getBody());
        assert response.getHeaderFields().equals(deserialized.getHeaderFields());
        System.out.println("Response deserialization test passed.\n");
    }
}
