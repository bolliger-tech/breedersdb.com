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

export type ActionResult<T> = {
  response: T;
  headers?: {
    [key: string]: string[];
  };
};

export type UserOutput = {
  id: number;
};
