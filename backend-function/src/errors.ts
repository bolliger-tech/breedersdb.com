// https://hasura.io/docs/latest/actions/action-handlers/#returning-an-error-response
export class ErrorWithStatus extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
  toGraphQL() {
    return {
      message: this.message,
      extensions: { code: this.status },
    };
  }
}
