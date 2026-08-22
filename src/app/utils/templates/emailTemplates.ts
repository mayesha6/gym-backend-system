export const forgotPasswordTemplate = `
<!DOCTYPE html>
<html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>

        <p>Hi <%= name %>,</p>

        <p>You requested to reset your password.</p>

        <p>
            Click the button below to reset your password.
            This link will expire in <strong>10 minutes</strong>.
        </p>

        <a href="<%= resetUILink %>"
            style="display:inline-block;
                    padding:12px 20px;
                    background:#2563eb;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;">
            Reset Password
        </a>

        <p style="margin-top:20px;font-size:12px;color:#555;">
            If you did not request this, please ignore this email.
        </p>

        <br />
        <p>Regards,<br /><strong>Travel Buddy & Meetup</strong></p>
    </body>
</html>
`;

export const otpTemplate = `
<!DOCTYPE html>
<html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Hello <%= name %>,</h2>
        <p>Your OTP code is: <strong><%= otp %></strong></p>
        <p>This code is valid for 2 minutes.</p>

        <p style="margin-top:20px;font-size:12px;color:#555;">
            If you did not request this, please ignore this email.
        </p>

        <br />
        <p>Regards,<br /><strong>Travel Buddy & Meetup</strong></p>
    </body>
</html>
`;

export const templates: Record<string, string> = {
  forgetPassword: forgotPasswordTemplate,
};
