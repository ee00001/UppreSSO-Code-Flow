package sdk.Bean;

public class RegistrationResult {
    boolean resultOK;
    String ID;
    String redirect_uri;
    String client_id;

    public boolean isResultOK() {
        return resultOK;
    }

    public void setResultOK(boolean resultOK) {
        this.resultOK = resultOK;
    }

    public String getID() {
        return ID;
    }

    public void setID(String ID) {
        this.ID = ID;
    }

    public String getRedirect_uri() {
        return redirect_uri;
    }

    public void setRedirect_uri(String redirect_uri) {
        this.redirect_uri = redirect_uri;
    }

    public String getClient_id() {
        return client_id;
    }

    public void setClient_id(String client_id) {
        this.client_id = client_id;
    }
}
