export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(email, otp, resendApiKey) {
  if (!resendApiKey) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return true;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      // PREREQUISITE: The sender domain 'abes.ac.in' must be verified in Resend dashboard
      // before emails can be sent. See: https://resend.com/docs/dashboard/domains/introduction
      from: 'ABES Marketplace <noreply@abes.ac.in>',
      to: email,
      subject: 'Your OTP for ABES Marketplace',
      html: `<p>Your OTP is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    }),
  });

  return response.ok;
}
