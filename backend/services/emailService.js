import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter using Gmail SMTP settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generic reusable email sender
 * @param {string} to - Destination email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - Email HTML content
 */
export const sendEmail = async (to, subject, htmlBody, attachments = []) => {
  try {
    const mailOptions = {
      from: `"VendorBridge System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlBody,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    // Log the error but do not throw/crash to ensure business processes can proceed
    console.error(`Nodemailer failed sending email to ${to}:`, error.message);
    return null;
  }
};

/**
 * Send RFQ Invitation to assigned vendor
 * @param {object} vendor - Vendor details { name, email }
 * @param {object} rfq - RFQ details { title, description, quantity, deadline }
 */
export const sendRFQInvitation = async (vendor, rfq) => {
  const subject = 'New RFQ Invitation — VendorBridge';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-top: 0;">VendorBridge ERP Notification</h2>
      <p>Dear <strong>${vendor.name}</strong>,</p>
      <p>You have been invited to submit a quotation for the following Request for Quotation (RFQ):</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; width: 35%;">RFQ Title:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${rfq.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Description:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${rfq.description}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Quantity Required:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${rfq.quantity} units</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0;">Submission Deadline:</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #e11d48; font-weight: bold;">${rfq.deadline}</td>
        </tr>
      </table>

      <p>Please login to the VendorBridge portal to review details and submit your formal quotation.</p>
      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b;">
        Regards,<br>
        <strong>VendorBridge Procurement Team</strong>
      </p>
    </div>
  `;

  return sendEmail(vendor.email, subject, htmlBody);
};
