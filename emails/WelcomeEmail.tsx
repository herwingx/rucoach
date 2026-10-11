import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";
import * as theme from "./theme";

interface WelcomeEmailProps {
  clientName?: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rucoach.app").replace(/\/$/, "");

export const WelcomeEmail = ({
  clientName = "Atleta",
}: WelcomeEmailProps) => (
  <BaseLayout previewText="¡Bienvenido a la comunidad RU Coach!">
    <Heading style={theme.h1}>¡Cuenta activada!</Heading>
    <Text style={theme.text}>
      Hola <strong>{clientName}</strong>, tu cuenta en RU Coach ha sido creada con éxito.
    </Text>
    <Text style={theme.text}>
      Ya puedes acceder a tu dashboard para ver tus rutinas personalizadas por Rodrigo Urbina, registrar tus progresos y empezar a ganar XP.
    </Text>

    <Section style={btnContainer}>
      <Button style={theme.button} href={`${baseUrl}/client/dashboard`}>
        Ir a mi Dashboard
      </Button>
    </Section>

    <Text style={theme.text}>
      Recuerda que la constancia es la clave del éxito. ¡Vamos a darle con todo!
    </Text>
  </BaseLayout>
);

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

export default WelcomeEmail;
