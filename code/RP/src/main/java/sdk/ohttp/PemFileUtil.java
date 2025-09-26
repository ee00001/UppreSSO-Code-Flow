package sdk.ohttp;

import org.bouncycastle.util.io.pem.PemReader;
import java.io.FileReader;
import java.io.IOException;

public class PemFileUtil {
    public static byte[] readPem(String path) throws IOException {
        try (PemReader reader = new PemReader(new FileReader(path))) {
            return reader.readPemObject().getContent();
        }
    }
}
