import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";
import * as theme from "./theme";

interface NewRoutineEmailProps {
  clientName?: string;
  routineName?: string;
}

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://rucoach.app").replace(/\/$/, "");

export const NewRoutineEmail = ({
  clientName = "Atleta",
  routineName = "Nueva Rutina Personalizada",
}: NewRoutineEmailProps) => (
  <BaseLayout previewText="¡Tienes una nueva rutina asignada en RU Coach!">
    <Heading style={theme.h1}>¡Nueva Rutina!</Heading>
    <Text style={theme.text}>
      Hola <strong>{clientName}</strong>, Rodrigo Urbina te ha asignado un nuevo plan de entrenamiento personalizado:
    </Text>
    
    <Section style={theme.infoBox}>
      <Text style={theme.infoBoxTitle}>PLAN ASIGNADO</Text>
      <Text style={theme.infoBoxContent}>{routineName}</Text>
    </Section>

    <Text style={theme.text}>
      Ya puedes ver todos los detalles, ejercicios y series en tu app.
    </Text>

    <Section style={btnContainer}>
      <Button style={theme.button} href={`${baseUrl}/client/routines`}>
        Ver mi nueva rutina
      </Button>
    </Section>

    <Text style={theme.text}>
      ¡Es hora de llevar tu entrenamiento al siguiente nivel con RU Coach!
    </Text>
  </BaseLayout>
);

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

export default NewRoutineEmail;
