// https://hasura.io/docs/latest/actions/action-handlers/#returning-an-error-response
export class ErrorWithStatus extends Error {
  status: number;
  extensions: any;
  constructor(status: number, message: string, extensions?: any) {
    super(message);
    this.status = status;
    this.extensions = extensions;
  }
  toGraphQL() {
    return {
      message: this.message,
      extensions: { code: this.status, ...this.extensions },
    };
  }
}
