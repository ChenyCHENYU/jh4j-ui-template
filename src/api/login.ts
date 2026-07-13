import { getEncrypt } from "@jhlc/common-core/src/api/login";
import request from "@jhlc/common-core/src/util/request";

const client_secret = "secret";
const client_id = "c1";

export async function ssoToken(code: any) {
  const et = await getEncrypt();
  const param = {
    companyId: "1",
    paila_code: code,
    client_code: et(`${client_id},${client_secret}`),
    grant_type: "sso_token_change"
  };

  return request({
    url: "/auth/oauth/token",
    method: "post",
    params: param,
    headers: {
      isToken: false
    }
  });
}
