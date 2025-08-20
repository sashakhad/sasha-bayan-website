import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Add contact to Resend
    try {
      await resend.contacts.create({
        email,
        firstName: name || undefined,
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID!,
      });

      console.log(`✅ Contact added to Resend: ${email}`);
    } catch (error: any) {
      // If contact already exists, try to update them
      if (error.statusCode === 409) {
        try {
          await resend.contacts.update({
            email,
            unsubscribed: false,
            audienceId: process.env.RESEND_AUDIENCE_ID!,
          });
          console.log(`✅ Contact updated in Resend: ${email}`);
        } catch (updateError) {
          console.error("❌ Failed to update existing contact:", updateError);
          return NextResponse.json(
            { error: "Failed to update subscription" },
            { status: 500 },
          );
        }
      } else {
        console.error("❌ Failed to add contact to Resend:", error);
        return NextResponse.json(
          { error: "Failed to add subscription" },
          { status: 500 },
        );
      }
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "shows@sashabayan.com",
        to: email,
        subject: "Welcome to Sasha Bayan Shows!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Sasha Bayan Shows!</h1>
            <p>Hi ${name || "there"},</p>
            <p>Thanks for subscribing to my newsletter! You'll now receive updates about upcoming shows, new music, and special events.</p>
            <p>I'm excited to share my musical journey with you.</p>
            <br>
            <p>Best,</p>
            <p>Sasha Bayan</p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              You can unsubscribe anytime by clicking 
              <a href="${
                process.env.NEXT_PUBLIC_BASE_URL || "https://sashabayan.com"
              }/unsubscribe?email=${encodeURIComponent(email)}">here</a>
            </p>
          </div>
        `,
      });

      console.log(`✅ Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError);
      // Don't fail the subscription if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
