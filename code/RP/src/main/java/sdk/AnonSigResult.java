package sdk;

public final class AnonSigResult {
    /** "ring" 或 "pptoken" */
    public final String assertionType;
    /** Base64URL 的 client_assertion；若走 pptoken，可放简单占位（比如空串或摘要） */
    public final String clientAssertion;
    /** 仅当 pptoken 时非空：Authorization 头的完整值，例如 "PrivateToken token=\"...\"" */
    public final String authorizationHeader;

    public AnonSigResult(String type, String assertion, String authz) {
        this.assertionType = type;
        this.clientAssertion = assertion;
        this.authorizationHeader = authz;
    }
}
