export type ActionProps = {
  input: any;
  ctx: {
    req: {
      headers: {
        cookie: string | undefined;
      };
    };
    sessionVariables?: {
      [key: string]: string;
    };
  };
};

export type ActionResult = {
  response: any;
  headers?: {
    [key: string]: string[];
  };
};
