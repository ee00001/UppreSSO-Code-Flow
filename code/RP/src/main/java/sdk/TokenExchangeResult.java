package sdk;

import java.util.Map;

public final class TokenExchangeResult {
    private final Map<String, String> body;
    private final long deserializeNs;

    public TokenExchangeResult(Map<String, String> body, long deserializeNs) {
        this.body = body;
        this.deserializeNs = deserializeNs;
    }

    public Map<String, String> getBody() {
        return body;
    }

    public long getDeserializeNs() {
        return deserializeNs;
    }

}
