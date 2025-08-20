import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      // Update contact to mark as unsubscribed
      await resend.contacts.update({
        email,
        unsubscribed: true,
        audienceId: process.env.RESEND_AUDIENCE_ID!,
      });

      console.log(`✅ Contact unsubscribed in Resend: ${email}`);

      // Send confirmation email
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "shows@sashabayan.com",
          to: email,
          subject: "Unsubscribed from Sasha Bayan Shows",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Unsubscribed Successfully</h1>
              <p>Hi there,</p>
              <p>You've been successfully unsubscribed from my newsletter. You won't receive any more emails about shows and updates.</p>
              <p>If you change your mind, you can always resubscribe by visiting my website.</p>
              <br>
              <p>Thanks for being part of the journey!</p>
              <p>Sasha Bayan</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                To resubscribe, visit 
                <a href="${
                  process.env.NEXT_PUBLIC_BASE_URL || "https://sashabayan.com"
                }/mailing-list">my mailing list page</a>
              </p>
            </div>
          `,
        });

        console.log(`✅ Unsubscribe confirmation email sent to: ${email}`);
      } catch (emailError) {
        console.error(
          "❌ Failed to send unsubscribe confirmation email:",
          emailError,
        );
        // Don't fail the unsubscribe if confirmation email fails
      }

      return NextResponse.json({
        success: true,
        message: "Successfully unsubscribed from newsletter",
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { error: "Email not found in our system" },
          { status: 404 },
        );
      }

      console.error("❌ Failed to unsubscribe contact:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
