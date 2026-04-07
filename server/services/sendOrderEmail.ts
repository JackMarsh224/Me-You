import nodemailer from "nodemailer";

const ADMIN_EMAIL = "jack@jigsawgym.com";

interface OrderEmailOptions {
  bookId: number;
  authorName: string;
  approvedAt: Date;
  fileBuffer: Buffer;
  fileName: string;
  customerEmail?: string | null;
  deliveryName?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryPostcode?: string | null;
  deliveryCountry?: string | null;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOrderEmail(options: OrderEmailOptions): Promise<void> {
  const { bookId, authorName, approvedAt, fileBuffer, fileName,
    customerEmail, deliveryName, deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry } = options;

  const transport = createTransport();

  const subject = `New Legacy Book Order - ${authorName} - #${bookId}`;

  const deliveryLine = [deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry]
    .filter(Boolean).join(", ");

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;">
        New Book Order — You &amp; Me
      </h1>
      <p style="font-size: 16px;">A customer has approved their book and it is ready for production.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%; background: #f5f5f5;">Order ID</td>
          <td style="padding: 10px; border: 1px solid #ddd;">#${bookId}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Customer Name</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${authorName}</td>
        </tr>
        ${customerEmail ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Email</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${customerEmail}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5;">Date Approved</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${approvedAt.toUTCString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background: #f5f5f5; vertical-align: top;">Delivery Address</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${deliveryName ? `<strong>${deliveryName}</strong><br>` : ""}
            ${deliveryAddress ? `${deliveryAddress}<br>` : ""}
            ${deliveryCity ? `${deliveryCity}<br>` : ""}
            ${deliveryPostcode ? `${deliveryPostcode}<br>` : ""}
            ${deliveryCountry || ""}
            ${!deliveryLine ? "Not provided" : ""}
          </td>
        </tr>
      </table>
      <p style="font-size: 14px; color: #555;">
        The complete book file is attached to this email as an HTML file, ready for print production.
        Open the attachment in a browser and use Print → Save as PDF for the final print-ready version.
      </p>
      <hr style="border: 1px solid #ddd; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">You &amp; Me — A Life Story, Told</p>
    </div>
  `;

  await transport.sendMail({
    from: `"You & Me Orders" <${process.env.SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: fileName,
        content: fileBuffer,
        contentType: "text/html",
      },
    ],
  });

  console.log(`[order-email] Sent order email for book #${bookId} (${authorName}) to ${ADMIN_EMAIL}`);
}
