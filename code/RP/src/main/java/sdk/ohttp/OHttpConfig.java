package sdk.ohttp;

public interface OHttpConfig {
    // 中继，使用自建的 OHTTP 节点，暂未找到可用公共节点
    String RELAY_URL = "http://localhost:9090/.well-known/ohttp-relay";

    // 网关，待修改，根据IdP修改
    String GATEWAY_ORIGIN = "http://localhost:8080";

    // 网关公钥缓存
    String KEY_CONFIG_URL = GATEWAY_ORIGIN + "/.well-known/ohttp-keys";
}
