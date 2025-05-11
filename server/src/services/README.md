# Email Service

This service provides email functionality for the Shortly application.

## Features

- Send password reset emails
- Send welcome emails to new users
- Configurable via environment variables
- Development mode with MailHog for testing

## Configuration

The email service is configured through environment variables:

```
SMTP_HOST=localhost       # SMTP server host
SMTP_PORT=1025            # SMTP server port
SMTP_SECURE=false         # Use TLS/SSL (true/false)
SMTP_USER=                # SMTP username (if required)
SMTP_PASS=                # SMTP password (if required)
SMTP_FROM=noreply@shortly.com  # From email address
```

## Development Environment

In development, the application uses MailHog as a local SMTP server. MailHog captures all outgoing emails and provides a web interface to view them.

- SMTP Server: `localhost:1025`
- Web UI: `http://localhost:8025`

## Usage

```typescript
import emailService from '../services/email.service';

// Send password reset email
await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');

// Send welcome email
await emailService.sendWelcomeEmail(user);
```

## Testing

You can test the email service using the provided test script:

```bash
npx tsx src/tests/email.test.ts
```

After running the test, check the MailHog web interface at `http://localhost:8025` to view the sent emails.

## Production Deployment

For production, configure the environment variables to use your actual SMTP server:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## Email Templates

The email service includes the following templates:

1. **Password Reset Email** - Sent when a user requests a password reset
2. **Welcome Email** - Sent when a new user signs up

Templates are defined in the `email.service.ts` file and can be customized as needed.
