import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";
import * as theme from "./theme";

interface BaseLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

// Global Production URL with Fallback
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rucoach.app").replace(/\/$/, "");

export const BaseLayout = ({ previewText, children }: BaseLayoutProps) => (
  <Html lang="es">
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={theme.main}>
      <Container style={theme.container}>
        <Section style={theme.logoSection}>
          <Img
            src={`${baseUrl}/android-chrome-512x512.png`}
            width="64"
            height="64"
            alt="RU Coach Logo"
            style={theme.logoImg}
          />
          <Text style={theme.logoText}>RU Coach</Text>
          <Text style={theme.coachSubtext}>Rodrigo Urbina</Text>
        </Section>
        
        <Section style={theme.content}>
          {children}
          <Hr style={theme.hr} />
          <Text style={theme.footer}>
            © 2026 RU Coach Premium | Rodrigo Urbina
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
