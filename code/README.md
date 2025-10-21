请务必使用我的补丁版本！！！Cloudflare 的 Privacy Pass ts 库中的 deserialize 存在重大bug，会导致 batchtokenrequest无法解析！

# 如何部署

RP 使用 bootrun 在目录 `code/RP` 下启动，如果使用 privacy pass 功能，bootrun 会同时拉起 sidecar，无需手动拉起；如果已经手动拉起了 sidecar 会跳过拉起。RP 关闭时会同时关闭其拉起的 sidecar，非其拉起的则不会关闭。RP 的端口是 8080。

IdP 在 `code/IdP`(openid-connect-parent) 下，先使用 `mvn clean package install -DskipTests -Dmaven.javadoc.skip=true`，拉取依赖。如果依赖已经拉取，则在 `code/IdP/openid-connect-server-webapp` 下运行 `mvn jetty:run-war` 启动 IdP。IdP 的端口是 8090。

如果 IdP 使用 privacy pass 功能，需手动拉起 sidecar，具体操作为在 `code\sidecar` 下执行 `node dist\sidecar.cjs`。如果 `sidecar` 代码进行了修改，需在 `code\sidecar` 下执行 `npm run build` 更新 sidecar 打包程序。IdP 不在启动的同时拉起 sidecar 的原因是，`jetty:run-war` 和进程执行无法绑定到一个生命周期，我暂时还不知道怎么搞，先使用手动拉起和手动关闭。

Sidecar 的端口是 9797。

`privacy pass issuer` 需要在 `code\issuer` 下使用 `npm run dev` 或 `wrangler dev` 拉起。issuer 的端口是 8787。

Relay Server 需要使用 python 在 `code\Relay Server` 下启动 `relay.py`。relay 的端口是 9090。

一次本地完整测试（包含 privacy pass）需要启动 RP, IdP, Sidecar, relay server, issuer。

实际部署时，RP 和 IdP 都需要拉起各自的 Sidecar，并能访问同一个 issuer 和 relay server。