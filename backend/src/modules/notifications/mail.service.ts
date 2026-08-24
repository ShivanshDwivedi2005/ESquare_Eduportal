import nodemailer, { type Transporter } from "nodemailer";

import { ApplicationError } from "../../common/errors.js";
import { getEnvironment } from "../../config/env.js";

export interface MailService {
  sendEmailVerification(email: string, code: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}

class SmtpMailService implements MailService {
  private readonly transporter: Transporter;

  public constructor(
    private readonly from: string,
    host: string,
    port: number,
    user: string,
    password: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      requireTLS: port !== 465,
    });
  }

  public async sendEmailVerification(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Verify your ESQUARE account",
      text: `Your ESQUARE verification code is ${code}. It expires soon and can be used only once.`,
    });
  }

  public async sendPasswordReset(email: string, token: string): Promise<void> {
    const { APP_BASE_URL } = getEnvironment();
    const resetUrl = `${APP_BASE_URL}/reset-password?t=${encodeURIComponent(token)}`;
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Reset your ESQUARE password",
      text: `Open this one-time link to reset your ESQUARE password: ${resetUrl}`,
    });
  }
}

class UnconfiguredMailService implements MailService {
  private unavailable(): never {
    throw new ApplicationError(
      503,
      "EMAIL_UNAVAILABLE",
      "Email delivery is not configured",
    );
  }

  public sendEmailVerification(): Promise<void> {
    return Promise.reject(this.unavailable());
  }

  public sendPasswordReset(): Promise<void> {
    return Promise.reject(this.unavailable());
  }
}

export function createMailService(): MailService {
  const environment = getEnvironment();
  if (
    !environment.SMTP_HOST ||
    !environment.SMTP_USER ||
    !environment.SMTP_PASSWORD ||
    !environment.SMTP_FROM
  ) {
    return new UnconfiguredMailService();
  }
  return new SmtpMailService(
    environment.SMTP_FROM,
    environment.SMTP_HOST,
    environment.SMTP_PORT,
    environment.SMTP_USER,
    environment.SMTP_PASSWORD,
  );
}
