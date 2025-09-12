package sdk.rfc9380;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;

import java.math.BigInteger;

public class Rfc9380P256Test {

    private final String DST_RO = "QUUX-V01-CS02-with-P256_XMD:SHA-256_SSWU_RO_";
    private final String DST_NU = "QUUX-V01-CS02-with-P256_XMD:SHA-256_SSWU_NU_";

    private String toFixedLengthHex(BigInteger n, int byteLen) {
        String hex = n.toString(16);
        int expectedLen = byteLen * 2;
        if (hex.length() < expectedLen) {
            StringBuilder sb = new StringBuilder(expectedLen);
            for (int i = 0; i < expectedLen - hex.length(); i++) sb.append('0');
            sb.append(hex);
            return sb.toString();
        } else if (hex.length() > expectedLen) {
            return hex.substring(hex.length() - expectedLen);
        } else {
            return hex;
        }
    }

    @Test
    public void testMsgEmpty_RO() {
        String msg = "";
        Rfc9380P256.HashToCurveResult result = Rfc9380P256.hash_to_curve_debug(msg.getBytes(), DST_RO.getBytes());

        Assertions.assertEquals("ad5342c66a6dd0ff080df1da0ea1c04b96e0330dd89406465eeba11582515009",
                toFixedLengthHex(result.u0, 32));
        Assertions.assertEquals("8c0f1d43204bd6f6ea70ae8013070a1518b43873bcd850aafa0a9e220e2eea5a",
                toFixedLengthHex(result.u1, 32));
        Assertions.assertEquals("2c15230b26dbc6fc9a37051158c95b79656e17a1a920b11394ca91c44247d3e4",
                toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), 32));
        Assertions.assertEquals("8a7a74985cc5c776cdfe4b1f19884970453912e9d31528c060be9ab5c43e8415",
                toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), 32));
    }

    @Test
    public void testMsgABC_RO() {
        String msg = "abc";
        Rfc9380P256.HashToCurveResult result = Rfc9380P256.hash_to_curve_debug(msg.getBytes(), DST_RO.getBytes());

        Assertions.assertEquals("afe47f2ea2b10465cc26ac403194dfb68b7f5ee865cda61e9f3e07a537220af1",
                toFixedLengthHex(result.u0, 32));
        Assertions.assertEquals("379a27833b0bfe6f7bdca08e1e83c760bf9a338ab335542704edcd69ce9e46e0",
                toFixedLengthHex(result.u1, 32));
        Assertions.assertEquals("0bb8b87485551aa43ed54f009230450b492fead5f1cc91658775dac4a3388a0f",
                toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), 32));
        Assertions.assertEquals("5c41b3d0731a27a7b14bc0bf0ccded2d8751f83493404c84a88e71ffd424212e",
                toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), 32));
    }

    @Test
    public void testMsgHex_RO() {
        String msg = "abcdef0123456789";
        Rfc9380P256.HashToCurveResult result = Rfc9380P256.hash_to_curve_debug(msg.getBytes(), DST_RO.getBytes());

        Assertions.assertEquals("0fad9d125a9477d55cf9357105b0eb3a5c4259809bf87180aa01d651f53d312c",
                toFixedLengthHex(result.u0, 32));
        Assertions.assertEquals("b68597377392cd3419d8fcc7d7660948c8403b19ea78bbca4b133c9d2196c0fb",
                toFixedLengthHex(result.u1, 32));
        Assertions.assertEquals("65038ac8f2b1def042a5df0b33b1f4eca6bff7cb0f9c6c1526811864e544ed80",
                toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), 32));
        Assertions.assertEquals("cad44d40a656e7aff4002a8de287abc8ae0482b5ae825822bb870d6df9b56ca3",
                toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), 32));
    }

}
