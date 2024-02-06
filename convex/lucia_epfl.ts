import {
  OAuthRequestError,
  createOAuth2AuthorizationUrl,
  validateOAuth2AuthorizationCode,
} from "@lucia-auth/oauth";
import {
  LuciaDatabaseUserAttributes,
  LuciaUser,
} from "@lucia-auth/oauth/dist/lucia";
import type { Auth, Key, LuciaError } from "lucia";

const PROVIDER_ID = "google";

type Config = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  accessType?: "online" | "offline";
};

export const epfl = <_Auth extends Auth = Auth>(
  auth: _Auth,
  config: Config,
): EpflAuth<_Auth> => {
  return new EpflAuth(auth, config);
};

class ProviderUserAuth<_Auth extends Auth = Auth> {
  private auth: _Auth;
  private providerId: string;
  private providerUserId: string;

  constructor(auth: _Auth, providerId: string, providerUserId: string) {
    this.auth = auth;
    this.providerId = providerId;
    this.providerUserId = providerUserId;
  }

  public getExistingUser = async (): Promise<LuciaUser<_Auth> | null> => {
    try {
      const key = await this.auth.useKey(
        this.providerId,
        this.providerUserId,
        null,
      );
      const user = await this.auth.getUser(key.userId);
      return user as LuciaUser<_Auth>;
    } catch (e) {
      const error = e as Partial<LuciaError>;
      if (error?.message !== "AUTH_INVALID_KEY_ID") throw e;
      return null;
    }
  };

  public createKey = async (userId: string): Promise<Key> => {
    return await this.auth.createKey({
      userId,
      providerId: this.providerId,
      providerUserId: this.providerUserId,
      password: null,
    });
  };

  public createUser = async (options: {
    userId?: string;
    attributes: LuciaDatabaseUserAttributes<_Auth>;
  }): Promise<LuciaUser<_Auth>> => {
    const user = await this.auth.createUser({
      key: {
        providerId: this.providerId,
        providerUserId: this.providerUserId,
        password: null,
      },
      ...options,
    });
    return user as LuciaUser<_Auth>;
  };
}

abstract class OAuth2ProviderAuth<
  _ProviderUserAuth extends ProviderUserAuth = ProviderUserAuth,
  _Auth = _ProviderUserAuth extends ProviderUserAuth<infer _Auth>
    ? _Auth
    : never,
> {
  protected auth: _Auth;

  constructor(auth: _Auth) {
    this.auth = auth;
  }

  abstract validateCallback: (code: string) => Promise<_ProviderUserAuth>;
  abstract getAuthorizationUrl: () => Promise<
    readonly [url: URL, state: string | null]
  >;
}

export class EpflAuth<_Auth extends Auth = Auth> extends OAuth2ProviderAuth<
  EpflUserAuth<_Auth>
> {
  private config: Config;

  constructor(auth: _Auth, config: Config) {
    super(auth);

    this.config = config;
  }

  public getAuthorizationUrl = async (): Promise<
    readonly [url: URL, state: string]
  > => {
    const scopeConfig = this.config.scope ?? [];
    const [url, state] = await createOAuth2AuthorizationUrl(
      "https://accounts.google.com/o/oauth2/v2/auth",
      {
        clientId: this.config.clientId,
        redirectUri: this.config.redirectUri,
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          ...scopeConfig,
        ],
      },
    );
    const accessType = this.config.accessType ?? "online"; // ( default ) online
    url.searchParams.set("access_type", accessType);
    url.searchParams.set("hd", "epfl.ch");
    return [url, state];
  };

  public validateCallback = async (
    code: string,
  ): Promise<EpflUserAuth<_Auth>> => {
    const googleTokens = await this.validateAuthorizationCode(code);
    const googleUser = await getEpflUser(googleTokens.accessToken);
    return new EpflUserAuth(this.auth, googleUser, googleTokens);
  };

  private validateAuthorizationCode = async (
    code: string,
  ): Promise<EpflTokens> => {
    const tokens = await validateOAuth2AuthorizationCode<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>(code, "https://oauth2.googleapis.com/token", {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      clientPassword: {
        clientSecret: this.config.clientSecret,
        authenticateWith: "client_secret",
      },
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresIn: tokens.expires_in,
    };
  };
}

export class EpflUserAuth<
  _Auth extends Auth = Auth,
> extends ProviderUserAuth<_Auth> {
  public googleTokens: EpflTokens;
  public googleUser: EpflUser;

  constructor(auth: _Auth, googleUser: EpflUser, googleTokens: EpflTokens) {
    super(auth, PROVIDER_ID, googleUser.sub);

    this.googleTokens = googleTokens;
    this.googleUser = googleUser;
  }
}

const getEpflUser = async (accessToken: string): Promise<EpflUser> => {
  const request = new Request("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: authorizationHeader("bearer", accessToken),
    },
  });
  const googleUser = await handleRequest<EpflUser>(request);
  return googleUser;
};

export type EpflTokens = {
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresIn: number;
};

export type EpflUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  email?: string;
  email_verified?: boolean;
  hd?: string;
};

const handleRequest = async <_ResponseBody extends {}>(
  request: Request,
): Promise<_ResponseBody> => {
  request.headers.set("User-Agent", "lucia");
  request.headers.set("Accept", "application/json");
  const response = await fetch(request);
  if (!response.ok) {
    throw new OAuthRequestError(request, response);
  }
  return (await response.json()) as _ResponseBody;
};

const authorizationHeader = (
  type: "bearer" | "basic",
  token: string,
): string => {
  if (type === "basic") {
    return ["Basic", token].join(" ");
  }
  if (type === "bearer") {
    return ["Bearer", token].join(" ");
  }
  throw new TypeError("Invalid token type");
};
