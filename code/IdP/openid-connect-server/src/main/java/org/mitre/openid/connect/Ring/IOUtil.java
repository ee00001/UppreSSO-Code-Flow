package org.mitre.openid.connect.Ring;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public final class IOUtil {

    private IOUtil(){}

    public static void writeString(Path p, String s) {
        try {
            Files.createDirectories(p.getParent());
            Files.write(p, Collections.singletonList(s), StandardCharsets.US_ASCII,
                    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static String readString(Path p) {
        try {
            return new String(Files.readAllBytes(p), StandardCharsets.US_ASCII).trim();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static boolean exists(Path p) {
        return Files.isRegularFile(p);
    }
}
