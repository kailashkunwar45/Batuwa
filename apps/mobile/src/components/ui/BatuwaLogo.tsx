import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '../theme/theme';
import { Shield } from 'lucide-react-native';

interface BatuwaLogoProps {
  size?: number;
}

export function BatuwaLogo({ size = 40 }: BatuwaLogoProps) {
  // We use a custom View to recreate the logo shown in the image until you save the actual image file.
  // Once you save the image as 'assets/logo.png', you can swap this with an <Image> component.
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { width: size, height: size, borderRadius: size * 0.3 }]}>
        <Text style={[styles.iconText, { fontSize: size * 0.6 }]}>B</Text>
      </View>
      <Text style={[styles.text, { fontSize: size * 0.8 }]}>Batuwa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    backgroundColor: '#4ade80', // Green color matching the image
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  iconText: {
    color: '#000000',
    fontWeight: '900',
  },
  text: {
    color: '#4ade80',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
