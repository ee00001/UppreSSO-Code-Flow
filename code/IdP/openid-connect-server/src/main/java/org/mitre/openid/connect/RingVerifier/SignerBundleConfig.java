package org.mitre.openid.connect.RingVerifier;

import java.util.List;

public class SignerBundleConfig {
	public int version;
	public int index;
	public int n;
	public String subPk;
	public List<String> onlinePks;
	public List<String> offlinePks;
}
