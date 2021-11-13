package sdk.Bean;

public class RegisterResponse {
    String client_id;
    String client_secret;
    String client_secret_expires_at;
    String registration_access_token;
    String registration_client_uri;
    String redirect_uris;
    String client_name;
    String token_endpoint_auth_method;
    String scope;
    String grant_types;
    String response_types;
    String application_type;

    public String getClient_id() {
        return client_id;
    }

    public void setClient_id(String client_id) {
        this.client_id = client_id;
    }

    public String getClient_secret() {
        return client_secret;
    }

    public void setClient_secret(String client_secret) {
        this.client_secret = client_secret;
    }

    public String getClient_secret_expires_at() {
        return client_secret_expires_at;
    }

    public void setClient_secret_expires_at(String client_secret_expires_at) {
        this.client_secret_expires_at = client_secret_expires_at;
    }

    public String getRegistration_access_token() {
        return registration_access_token;
    }

    public void setRegistration_access_token(String registration_access_token) {
        this.registration_access_token = registration_access_token;
    }

    public String getRegistration_client_uri() {
        return registration_client_uri;
    }

    public void setRegistration_client_uri(String registration_client_uri) {
        this.registration_client_uri = registration_client_uri;
    }

    public String getRedirect_uris() {
        return redirect_uris;
    }

    public void setRedirect_uris(String redirect_uris) {
        this.redirect_uris = redirect_uris;
    }

    public String getClient_name() {
        return client_name;
    }

    public void setClient_name(String client_name) {
        this.client_name = client_name;
    }

    public String getToken_endpoint_auth_method() {
        return token_endpoint_auth_method;
    }

    public void setToken_endpoint_auth_method(String token_endpoint_auth_method) {
        this.token_endpoint_auth_method = token_endpoint_auth_method;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getGrant_types() {
        return grant_types;
    }

    public void setGrant_types(String grant_types) {
        this.grant_types = grant_types;
    }

    public String getResponse_types() {
        return response_types;
    }

    public void setResponse_types(String response_types) {
        this.response_types = response_types;
    }

    public String getApplication_type() {
        return application_type;
    }

    public void setApplication_type(String application_type) {
        this.application_type = application_type;
    }
}
