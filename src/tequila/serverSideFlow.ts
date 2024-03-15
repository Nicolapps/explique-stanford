import Protocol from "./protocol";

interface ServerSideFlowOptions {
  service?: string;
  request?: string[];
  require?: string;
  allows?: string;
  redirectUrl: string;

  tequila_host?: string;
  tequila_port?: string;
  tequila_createrequest_path?: string;
  tequila_requestauth_path?: string;
  tequila_fetchattributes_path?: string;
  tequila_logout_path?: string;
}

export default class ServerSideFlow {
  protocol: Protocol;
  redirectUrl: string;

  constructor(opts: ServerSideFlowOptions) {
    if (!opts) {
      throw new Error("Options are required");
    }
    const protocol = (this.protocol = new Protocol());
    protocol.service = opts.service || "Some node.js app";
    protocol.request = opts.request;
    protocol.require = opts.require;
    protocol.allows = opts.allows;
    if (!opts.redirectUrl) {
      throw new Error("redirectUrl is required");
    }
    this.redirectUrl = opts.redirectUrl;

    (
      [
        "tequila_host",
        "tequila_port",
        "tequila_createrequest_path",
        "tequila_requestauth_path",
        "tequila_fetchattributes_path",
        "tequila_logout_path",
      ] as const
    ).forEach((k) => {
      const value = opts[k];
      if (value) protocol[k] = value;
    });
  }

  async validateTequilaReturn(key: string, authCheck: string): Promise<any> {
    if (!key) {
      throw new Error("validateTequilaReturn: no key found in URL parameter");
    }

    if (!authCheck) {
      throw new Error(
        "validateTequilaReturn: no auth_check found in URL parameter",
      );
    }

    return await this.protocol.fetchAttributes(key, authCheck);
  }

  async prepareLogin(): Promise<any> {
    const result = await this.protocol.createRequest(this.redirectUrl);
    return this.protocol.requestAuthRedirectUrl(result.key);
  }
}
