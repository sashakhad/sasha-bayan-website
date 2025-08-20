import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
} from "@react-email/components";

interface ShowNewsletterEmailProps {
  newsletter: {
    id: string;
    dateRange: {
      start: string;
      end: string;
    };
    upcomingShows: Array<{
      title: string;
      date: string;
      venue: string;
      venueLink?: string;
      address: string;
      startTime: string;
      endTime: string;
      ticketLink?: string;
      note?: string;
      description?: string;
      bandWebsite?: string;
    }>;
    futureShows?: Array<{
      title: string;
      date: string;
      venue: string;
      venueLink?: string;
      address: string;
      startTime: string;
      endTime: string;
      ticketLink?: string;
      note?: string;
      description?: string;
      bandWebsite?: string;
    }>;
    intro: string;
    themes: string[];
  };
}

const ShowNewsletterEmail = ({ newsletter }: ShowNewsletterEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sashabayan.com";

  const colors = {
    primary: "#E8E1DD", // Your Tailwind primary color (cream)
    dark: "#332A2A", // Your Tailwind dark color
    white: "#FFFFFF",
    gray: "#666666",
    lightGray: "#f5f5f5",
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    // Handle special cases
    if (!timeString || timeString === "TBD" || timeString === "N/A") {
      return "TBD";
    }
    
    try {
      const [hours, minutes] = timeString.split(":");
      if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
        return timeString; // Return original if parsing fails
      }
      
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString; // Return original if anything goes wrong
    }
  };

  const formatDateRange = (dateRange: { start: string; end: string }) => {
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "This Week";
      }

      const startMonth = startDate.toLocaleDateString("en-US", {
        month: "long",
      });
      const endMonth = endDate.toLocaleDateString("en-US", { month: "long" });
      const year = startDate.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
      } else {
        return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
      }
    } catch (error) {
      console.warn("Error formatting date range:", error);
      return "This Week";
    }
  };

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{
          fontFamily: "Akkurat, Arial, Helvetica, sans-serif",
          lineHeight: "1.6",
          color: colors.dark,
          backgroundColor: colors.white,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: colors.white,
          }}
        >
          <Section
            style={{
              background: colors.dark,
              color: colors.primary,
              padding: "30px 20px",
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <Heading
              style={{
                margin: "0 0 10px 0",
                fontSize: "32px",
                fontFamily: "Glosa Display, Georgia, Times New Roman, serif",
              }}
            >
              Sasha Bayan Shows
            </Heading>
            <Text style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
              Your weekly guide to upcoming performances
            </Text>
            <Text style={{ margin: "0", fontSize: "14px", opacity: "0.8" }}>
              {formatDateRange(newsletter.dateRange)}
            </Text>
          </Section>

          <Section style={{ marginBottom: "30px" }}>
            <Text
              style={{
                fontSize: "16px",
                marginBottom: "15px",
                color: colors.dark,
              }}
            >
              Hey music lovers,
            </Text>
            {newsletter.intro.split("\n").map((paragraph, index) => (
              <Text
                key={index}
                style={{
                  fontSize: "16px",
                  marginBottom: "15px",
                  color: colors.dark,
                }}
              >
                {paragraph}
              </Text>
            ))}
            <Text
              style={{
                fontSize: "14px",
                color: colors.dark,
                marginTop: "20px",
                fontStyle: "italic",
                textAlign: "left",
              }}
            >
              Best,
              <br />
              Sasha
            </Text>
          </Section>

          <Hr
            style={{
              margin: "30px 0",
              borderTop: `1px solid ${colors.lightGray}`,
            }}
          />

          <Section style={{ marginBottom: "30px" }}>
            <Heading
              style={{
                fontSize: "24px",
                marginBottom: "20px",
                color: colors.dark,
                fontFamily: "Glosa Display, Georgia, Times New Roman, serif",
              }}
            >
              This Week's Shows
            </Heading>
            {newsletter.upcomingShows.map((show, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "30px",
                  padding: "20px",
                  backgroundColor: colors.lightGray,
                  borderRadius: "8px",
                  borderBottom:
                    index === newsletter.upcomingShows.length - 1
                      ? "none"
                      : `1px solid ${colors.lightGray}`,
                }}
              >
                <Heading
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    marginTop: "0",
                    color: colors.dark,
                  }}
                >
                  {show.title.includes("High Tide") && show.bandWebsite ? (
                    <>
                      {show.title.split("High Tide")[0]}
                      <Link
                        href={show.bandWebsite}
                        style={{
                          color: colors.dark,
                          textDecoration: "underline",
                        }}
                      >
                        High Tide
                      </Link>
                      {show.title.split("High Tide")[1]}
                    </>
                  ) : (
                    show.title
                  )}
                </Heading>

                <Text
                  style={{
                    fontSize: "16px",
                    marginBottom: "8px",
                    color: colors.dark,
                    fontWeight: "bold",
                  }}
                >
                  📅 {formatDate(show.date)}
                </Text>

                <Text
                  style={{
                    fontSize: "16px",
                    marginBottom: "8px",
                    color: colors.dark,
                  }}
                >
                  🕐 {formatTime(show.startTime)}
                  {show.endTime && show.endTime !== "TBD" && show.endTime !== "N/A" && (
                    <> - {formatTime(show.endTime)}</>
                  )}
                </Text>

                <Text
                  style={{
                    fontSize: "16px",
                    marginBottom: "8px",
                    color: colors.dark,
                  }}
                >
                  📍{" "}
                  {show.venueLink ? (
                    <Link
                      href={show.venueLink}
                      style={{
                        color: colors.dark,
                        textDecoration: "underline",
                      }}
                    >
                      {show.venue}
                    </Link>
                  ) : (
                    show.venue
                  )}
                </Text>

                <Text
                  style={{
                    fontSize: "14px",
                    marginBottom: "12px",
                    color: colors.gray,
                  }}
                >
                  {show.address}
                </Text>

                {show.description && (
                  <Text
                    style={{
                      fontSize: "15px",
                      marginBottom: "12px",
                      color: colors.dark,
                      lineHeight: "1.5",
                    }}
                  >
                    {show.description}
                  </Text>
                )}

                {show.note && (
                  <Text
                    style={{
                      fontSize: "14px",
                      marginBottom: "12px",
                      color: colors.gray,
                      fontStyle: "italic",
                    }}
                  >
                    {show.note}
                  </Text>
                )}

                {show.ticketLink &&
                  show.ticketLink !== "N/A" &&
                  show.ticketLink !== "Private Event" &&
                  show.ticketLink !== "TBD" && (
                    <Text
                      style={{
                        fontSize: "16px",
                        marginBottom: "0",
                      }}
                    >
                      <Link
                        href={show.ticketLink}
                        style={{
                          color: colors.dark,
                          textDecoration: "underline",
                          fontWeight: "bold",
                        }}
                      >
                        🎫 Get Tickets
                      </Link>
                    </Text>
                  )}
              </div>
            ))}
          </Section>

          {newsletter.futureShows && newsletter.futureShows.length > 0 && (
            <>
              <Hr
                style={{
                  margin: "30px 0",
                  borderTop: `1px solid ${colors.lightGray}`,
                }}
              />
              <Section style={{ marginBottom: "30px" }}>
                <Heading
                  style={{
                    fontSize: "22px",
                    marginBottom: "20px",
                    color: colors.dark,
                    fontFamily:
                      "Glosa Display, Georgia, Times New Roman, serif",
                  }}
                >
                  Coming Up
                </Heading>
                {newsletter.futureShows.map((show, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "20px",
                      paddingBottom: "15px",
                      borderBottom:
                        index === (newsletter.futureShows?.length || 0) - 1
                          ? "none"
                          : `1px solid ${colors.lightGray}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        marginBottom: "6px",
                        color: colors.dark,
                      }}
                    >
                      {show.title.includes("High Tide") && show.bandWebsite ? (
                        <>
                          {show.title.split("High Tide")[0]}
                          <Link
                            href={show.bandWebsite}
                            style={{
                              color: colors.dark,
                              textDecoration: "underline",
                            }}
                          >
                            High Tide
                          </Link>
                          {show.title.split("High Tide")[1]}
                        </>
                      ) : (
                        show.title
                      )}
                    </Text>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: colors.gray,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {formatDate(show.date)}
                    </Text>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: colors.dark,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {show.venueLink ? (
                        <Link
                          href={show.venueLink}
                          style={{
                            color: colors.dark,
                            textDecoration: "underline",
                          }}
                        >
                          {show.venue}
                        </Link>
                      ) : (
                        show.venue
                      )}
                    </Text>
                    <Text
                      style={{
                        fontSize: "13px",
                        color: colors.gray,
                        margin: "0",
                      }}
                    >
                      {show.address}
                    </Text>
                  </div>
                ))}
              </Section>
            </>
          )}

          <Hr
            style={{
              margin: "40px 0 30px 0",
              borderTop: `1px solid ${colors.lightGray}`,
            }}
          />

          <Section style={{ textAlign: "center", marginBottom: "30px" }}>
            <Heading
              style={{
                fontSize: "20px",
                marginBottom: "15px",
                color: colors.dark,
                fontFamily: "Glosa Display, Georgia, Times New Roman, serif",
              }}
            >
              Got a space, a vibe, or a wild idea?
            </Heading>
            <Text
              style={{
                fontSize: "16px",
                color: colors.dark,
                marginBottom: "20px",
                lineHeight: "1.5",
              }}
            >
              I'd love to bring the music there — solo sitar, High Tide grooves, or something new together.
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: colors.dark,
                marginBottom: "15px",
              }}
            >
              Appreciate the love and support. See you out there!
            </Text>

            <Text
              style={{
                fontSize: "12px",
                color: colors.gray,
                lineHeight: "1.5",
                marginBottom: "10px",
              }}
            >
              You are receiving this email because you subscribed to Sasha Bayan
              show notifications.
            </Text>

            <Text
              style={{
                fontSize: "12px",
                color: colors.gray,
                lineHeight: "1.5",
                marginBottom: "10px",
              }}
            >
              <Link
                href={`${baseUrl}/shows`}
                style={{ color: colors.dark, textDecoration: "underline" }}
              >
                View all shows
              </Link>
            </Text>

            <Text
              style={{
                fontSize: "12px",
                color: colors.gray,
                lineHeight: "1.5",
              }}
            >
              <Link
                href={`${baseUrl}/unsubscribe`}
                style={{ color: colors.dark, textDecoration: "underline" }}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ShowNewsletterEmail;
