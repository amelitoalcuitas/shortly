import emailService from '../services/email.service';

/**
 * Simple test script to verify email sending functionality
 * Run with: npx tsx src/tests/email.test.ts
 */
async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Test password reset email
    console.log('Sending test password reset email...');
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-12345'
    );
    console.log('Password reset email sent:', resetResult.messageId);
    
    // Test welcome email
    console.log('Sending test welcome email...');
    const welcomeResult = await emailService.sendWelcomeEmail({
      id: 'test-id',
      email: 'test@example.com',
      password: 'not-used',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Welcome email sent:', welcomeResult.messageId);
    
    console.log('Email tests completed successfully!');
    console.log('Check the email UI at http://localhost:8025 to view the sent emails');
  } catch (error) {
    console.error('Error testing email service:', error);
  }
}

// Run the test
testEmailService();
