declare module "better-auth/next-js" {
  export function toNextJsHandler(auth: unknown): {
    GET: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
  };

  export function nextCookies(): unknown;
}
