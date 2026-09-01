import { StyleSheet, Text, View } from 'react-native';
import type { Persona } from '@cloud6/shared';
import { PERSONA_DISPLAY, PERSONAS } from '@cloud6/shared';
import { PersonaOption } from './PersonaOption';
import { spacing, typography } from '../../theme';

interface PersonaSelectorProps {
  persona: Persona | null;
  onSelect: (persona: Persona) => void;
}

/** Persona grid plus the selected persona's contextual description, sourced from the shared PERSONA_DISPLAY config. */
export function PersonaSelector({ persona, onSelect }: PersonaSelectorProps) {
  const selectedDisplay = persona ? PERSONA_DISPLAY[persona] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {PERSONAS.map((option) => (
          <PersonaOption
            key={option}
            persona={option}
            selected={option === persona}
            onPress={() => onSelect(option)}
          />
        ))}
      </View>

      {selectedDisplay ? (
        <View style={styles.description}>
          <Text style={typography.cardTitle}>{selectedDisplay.displayName}</Text>
          <Text style={styles.descriptionBody}>{selectedDisplay.description}</Text>
        </View>
      ) : (
        <Text style={styles.neutral}>Choose how you use CLOUD6</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  description: {
    gap: spacing.xs,
  },
  descriptionBody: {
    ...typography.bodySecondary,
  },
  neutral: {
    ...typography.bodySecondary,
  },
});
