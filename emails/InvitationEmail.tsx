import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";
import * as theme from "./theme";

interface InvitationEmailProps {
  clientName?: string;
  code?: string;
  signUpUrl?: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rucoach.app").replace(/\/$/, "");

export const InvitationEmail = ({
  clientName = "Atleta",
  code = "ABC-123",
  signUpUrl = `${baseUrl}/auth/sign-up?code=ABC-123`,
}: InvitationEmailProps) => (
  <BaseLayout previewText={`Tu código de acceso a RU Coach: ${code}`}>
    <Heading style={theme.h1}>¡Bienvenido a RU Coach!</Heading>
    <Text style={theme.text}>
      Hola <strong>{clientName}</strong>, Rodrigo Urbina te ha invitado a unirte a su plataforma de entrenamiento premium.
      Usa el siguiente código para crear tu cuenta y comenzar tu transformación de élite.
    </Text>

    <Section style={theme.infoBox}>
      <Text style={theme.infoBoxTitle}>TU CÓDIGO DE ACCESO</Text>
      <Text style={{ ...theme.infoBoxContent, fontSize: "32px", letterSpacing: "6px" }}>
        {code}
      </Text>
    </Section>

    <Text style={theme.text}>
      Haz clic en el botón de abajo para registrarte. El código es válido por 30 días.
    </Text>

    <Section style={btnContainer}>
      <Button style={theme.button} href={signUpUrl}>
        Comenzar mi transformación
      </Button>
    </Section>

    <Text style={theme.text}>
      Si no esperabas este correo, simplemente ignóralo.
    </Text>
  </BaseLayout>
);

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

export default InvitationEmail;
