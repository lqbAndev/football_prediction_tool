import { MorphIcon, type MorphIconProps } from 'morphicons/react';

type UCLMorphIconProps = Omit<MorphIconProps, 'reducedMotion' | 'spring'>;

/** Shared policy for UCL state icons: restrained spring and OS motion respect. */
export const UCLMorphIcon: React.FC<UCLMorphIconProps> = (props) => (
  <MorphIcon {...props} spring="snappy" reducedMotion="user" />
);
