import nodemailer from "nodemailer";

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

export async function sendOrderConfirmationEmail(options: {
  customerEmail: string;
  customerName: string;
  bookId: number;
  authorName: string;
  deliveryName?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryPostcode?: string | null;
  deliveryCountry?: string | null;
}): Promise<void> {
  const { customerEmail, customerName, bookId, authorName,
    deliveryName, deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry } = options;

  const transport = createTransport();

  const deliveryLine = [deliveryAddress, deliveryCity, deliveryPostcode, deliveryCountry]
    .filter(Boolean).join(", ");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;">
        Your Order Is Confirmed — You &amp; Me
      </h1>
      <p style="font-size: 16px;">Dear ${customerName},</p>
      <p style="font-size: 16px;">
        Thank you for placing your order. We're excited to help you capture ${authorName}'s story.
        Your payment of <strong>£49.99</strong> has been received and your book (Order #${bookId}) is now ready for the interview.
      </p>
      <p style="font-size: 16px;">
        Head back to the app whenever you're ready to begin your guided interview. Take your time — 
        there's no rush, and you can return to it at any point.
      </p>
      ${deliveryLine ? `
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td colspan="2" style="padding: 10px; background: #f5f5f5; font-weight: bold; border: 1px solid #ddd;">
            Delivery Details
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%; background: #f5f5f5;">Deliver To</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${deliveryName ? `<strong>${deliveryName}</strong><br>` : ""}
            ${deliveryAddress ? `${deliveryAddress}<br>` : ""}
            ${deliveryCity ? `${deliveryCity}<br>` : ""}
            ${deliveryPostcode ? `${deliveryPostcode}<br>` : ""}
            ${deliveryCountry || ""}
          </td>
        </tr>
      </table>` : ""}
      <p style="font-size: 14px; color: #555;">
        Once you've completed the interview and approved your book, we'll send it to print and deliver it to the address above.
        We'll also email you when your book is on its way to print.
      </p>
      <hr style="border: 1px solid #ddd; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">You &amp; Me — A Life Story, Told</p>
    </div>
  `;

  await transport.sendMail({
    from: `"You & Me" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: `Order Confirmed — Your Story Begins (Order #${bookId})`,
    html,
  });

  console.log(`[customer-email] Order confirmation sent to ${customerEmail} for book #${bookId}`);
}

export async function sendInProductionEmail(options: {
  customerEmail: string;
  customerName: string;
  bookId: number;
  authorName: string;
}): Promise<void> {
  const { customerEmail, customerName, bookId, authorName } = options;

  const transport = createTransport();

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px;">
        Your Book Is Going to Print — You &amp; Me
      </h1>
      <p style="font-size: 16px;">Dear ${customerName},</p>
      <p style="font-size: 16px;">
        Wonderful news — <strong>${authorName}'s Story</strong> (Order #${bookId}) has been approved 
        and is now in production. Our team will handle the printing and binding, 
        and have it delivered to your address.
      </p>
      <p style="font-size: 16px;">
        Thank you for trusting us with this story. We hope it becomes a treasured keepsake for years to come.
      </p>
      <hr style="border: 1px solid #ddd; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">You &amp; Me — A Life Story, Told</p>
    </div>
  `;

  await transport.sendMail({
    from: `"You & Me" <${process.env.SMTP_USER}>`,
    to: customerEmail,
    subject: `Your book is going to print! — Order #${bookId}`,
    html,
  });

  console.log(`[customer-email] In-production notification sent to ${customerEmail} for book #${bookId}`);
}
