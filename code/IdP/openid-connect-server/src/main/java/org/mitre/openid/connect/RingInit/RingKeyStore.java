package org.mitre.openid.connect.RingInit;

import java.math.BigInteger;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class RingKeyStore {
    private final Path dir; // 根目录
    private final int n;

    public RingKeyStore(Path dir, int n) {
        this.dir = dir;
        this.n = n;
    }

    public void generateAndSave(){
        // sub
        BigInteger subSK = EC256k1.randomScalar();
        byte[] subPk = EC256k1.compress(EC256k1.pubFromPriv(subSK));
        IOUtil.writeString(dir.resolve("sub.sk"), Hex.toHex(EC256k1.i2osp32(subSK)));
        IOUtil.writeString(dir.resolve("sub.pk"), Hex.toHex(subPk));

        for (int i = 0; i < n; i++) {
            // online
            BigInteger onSK = EC256k1.randomScalar();
            byte[] onPK = EC256k1.compress(EC256k1.pubFromPriv(onSK));
            IOUtil.writeString(dir.resolve("online_" + i + ".sk"), Hex.toHex(EC256k1.i2osp32(onSK)));
            IOUtil.writeString(dir.resolve("online_" + i + ".pk"), Hex.toHex(onPK));

            // offline
            BigInteger offSK = EC256k1.randomScalar();
            byte[] offPK = EC256k1.compress(EC256k1.pubFromPriv(offSK));
            IOUtil.writeString(dir.resolve("offline_" + i + ".pk"), Hex.toHex(offPK));
            BigInteger summed = EC256k1.addModN(subSK, offSK);
            IOUtil.writeString(dir.resolve("summed_" + i + ".sk"),
                    Hex.toHex(EC256k1.i2osp32(summed)));
        }
    }

    /* ========= 公钥存在性检查 ========= */
    public void assertPublicKeysExist() {
        List<String> missing = new ArrayList<>();
        if (!IOUtil.exists(dir.resolve("sub.pk"))) missing.add("sub.pk");
        for (int i = 0; i < n; i++) {
            if (!IOUtil.exists(dir.resolve("online_" + i + ".pk")))  missing.add("online_" + i + ".pk");
            if (!IOUtil.exists(dir.resolve("offline_" + i + ".pk"))) missing.add("offline_" + i + ".pk");
        }
        if (!missing.isEmpty()) {
            throw new IllegalStateException("缺少公钥文件: " + missing);
        }
    }

    /* ========= 加载 ========= */
    public byte[] loadSubPk() {
        return Hex.fromHex(IOUtil.readString(dir.resolve("sub.pk")));
    }

    public byte[][] loadOnlinePks() {
        byte[][] out = new byte[n][];
        for (int i = 0; i < n; i++) {
            out[i] = Hex.fromHex(IOUtil.readString(dir.resolve("online_" + i + ".pk")));
        }
        return out;
    }

    public byte[][] loadOfflinePks() {
        byte[][] out = new byte[n][];
        for (int i = 0; i < n; i++) {
            out[i] = Hex.fromHex(IOUtil.readString(dir.resolve("offline_" + i + ".pk")));
        }
        return out;
    }

    public byte[] loadOnlineSk32(int index) {
        return Hex.fromHex(IOUtil.readString(dir.resolve("online_" + index + ".sk")));
    }

    public byte[] loadOfflineSk32(int index) {
        return Hex.fromHex(IOUtil.readString(dir.resolve("offline_" + index + ".sk")));
    }

    public byte[] loadSubSk32() {
        return Hex.fromHex(IOUtil.readString(dir.resolve("sub.sk")));
    }

    public byte[] loadSummedSk32(int index) {
        return Hex.fromHex(IOUtil.readString(dir.resolve("summed_" + index + ".sk")));
    }

}
