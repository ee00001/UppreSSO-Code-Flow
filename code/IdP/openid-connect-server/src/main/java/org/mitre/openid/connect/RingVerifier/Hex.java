package org.mitre.openid.connect.RingVerifier;

public final class Hex {

    private static final char[] HEX = "0123456789abcdef".toCharArray();
    private Hex(){}

    public static String toHex(byte[] b) {
        char[] out = new char[b.length * 2];
        for (int i = 0; i < b.length; i++) {
            int v = b[i] & 0xFF;
            out[i*2]   = HEX[v >>> 4];
            out[i*2+1] = HEX[v & 0x0F];
        }
        return new String(out);
    }

    public static byte[] fromHex(String s) {
        String t = s.trim();
        if ((t.length() & 1) != 0) throw new IllegalArgumentException("hex length not even");
        int n = t.length()/2;
        byte[] out = new byte[n];
        for (int i = 0; i < n; i++) {
            int hi = Character.digit(t.charAt(i*2),16);
            int lo = Character.digit(t.charAt(i*2+1),16);
            if (hi < 0 || lo < 0) throw new IllegalArgumentException("bad hex");
            out[i] = (byte)((hi<<4)|lo);
        }
        return out;
    }
}
