package sdk.Bean;

public class DHKey {

    String ID;
    String pk_server;
    String sk_server;
    String pk_client;
    String sk_client;
    String g;
    String result;
    String basic_client_id;
    String client_id;
    String RPCert;

    public String getRPCert() {
        return RPCert;
    }

    public void setRPCert(String RPCert) {
        this.RPCert = RPCert;
    }

    public void setPk_server(String PK){
        this.pk_server = PK;
    }
    public void setPk_client(String PK){
        this.pk_client = PK;
    }
    public void setSK_server(String SK){
        this.sk_server = SK;
    }
    public void setSK_client(String SK){
        this.sk_client = SK;
    }
    public void setG(String G){
        this.g = G;
    }
    public void setResult(String Result){
        this.result = Result;
    }

    public String getPk_server(){
        return pk_server;
    }
    public String getPk_client(){
        return pk_client;
    }
    public String getSk_server(){
        return sk_server;
    }
    public String getSk_client(){
        return sk_client;
    }
    public String getG(){
        return g;
    }
    public String getResult(){
        return result;
    }

    public String getID() {
        return ID;
    }

    public void setID(String ID) {
        this.ID = ID;
    }

    public void setSk_server(String sk_server) {
        this.sk_server = sk_server;
    }

    public void setSk_client(String sk_client) {
        this.sk_client = sk_client;
    }

    public String getClient_id() {
        return client_id;
    }

    public void setClient_id(String client_id) {
        this.client_id = client_id;
    }

    public String getBasic_client_id() {
        return basic_client_id;
    }

    public void setBasic_client_id(String basic_client_id) {
        this.basic_client_id = basic_client_id;
    }
}
