import nodemailer from "nodemailer";
import { User } from "../models/user";

/**
 * Email service for sending emails
 */
class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly baseUrl: string;

  constructor() {
    // Get configuration from environment variables
    const host = process.env.SMTP_HOST || "localhost";
    const port = parseInt(process.env.SMTP_PORT || "1025", 10);
    const secure = process.env.SMTP_SECURE === "true";
    this.fromEmail = process.env.SMTP_FROM || "noreply@shortly.com";
    this.baseUrl = process.env.CLIENT_URL || "http://localhost:3000";

    // Create reusable transporter object using SMTP transport
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined, // No auth for development SMTP server
    });
  }

  /**
   * Send a password reset email
   * @param email Recipient email
   * @param resetToken Password reset token
   * @returns Promise resolving to send info
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<nodemailer.SentMessageInfo> {
    const resetLink = `${
      this.baseUrl
    }/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"shorty" <${this.fromEmail}>`,
      to: email,
      subject: "Reset Your shortly Password",
      text: `
        Hello,
        
        You requested a password reset for your shortly account.
        
        Please click the following link to reset your password:
        ${resetLink}
        
        This link will expire in 24 hours.
        
        If you did not request a password reset, please ignore this email.
        
        Regards,
        The shortly Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff0054;">Reset Your shortly Password</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your shortly account.</p>
          <p>Please click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #ff0054; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${resetLink}
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Regards,<br>The shortly Team</p>
        </div>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send a welcome email to a new user
   * @param user User object
   * @returns Promise resolving to send info
   */
  async sendWelcomeEmail(user: User): Promise<nodemailer.SentMessageInfo> {
    const loginLink = `${this.baseUrl}/login`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"shortly" <${this.fromEmail}>`,
      to: user.email,
      subject: "Welcome to shortly!",
      text: `
        Hello ${user.name || ""},
        
        Welcome to shortly! We're excited to have you on board.
        
        You can now start creating shortened URLs by logging in to your account:
        ${loginLink}
        
        If you have any questions, feel free to reply to this email.
        
        Regards,
        The Shortly Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff0054;">Welcome to Shortly!</h2>
          <p>Hello ${user.name || ""},</p>
          <p>We're excited to have you on board.</p>
          <p>You can now start creating shortened URLs by logging in to your account:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #ff0054; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">
              Log In
            </a>
          </p>
          <p>If you have any questions, feel free to reply to this email.</p>
          <p>Regards,<br>The Shortly Team</p>
        </div>
      `,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;
