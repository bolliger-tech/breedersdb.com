export type ActionProps = {
  input: any;
  ctx: {
    req: {
      headers: {
        cookie: string | undefined;
        authorization: string | undefined;
      };
    };
    sessionVariables?: {
      [key: string]: string;
    };
  };
};

export type ActionResult<T> = {
  response: T;
  headers?: {
    [key: string]: string[];
  };
};

export type EventResult<T> = {
  response: T;
  headers?: {
    [key: string]: string[];
  };
};
