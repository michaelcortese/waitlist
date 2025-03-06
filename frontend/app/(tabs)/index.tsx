import React from 'react';
import { StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={{ backgroundColor }}
    >
      <Stack.Screen options={{ title: 'Rez Seekers', headerShown: true }} />
      
      <ThemedView style={styles.hero}>
        <Image source={require('@/assets/images/favicon.png')} style={styles.logo} />
        <ThemedText type="title" style={styles.title}>Rez Seekers</ThemedText>
        <ThemedText style={styles.subtitle}>Exchange & discover restaurant reservations</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle">Key Features</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.featureCard}>
          <IconSymbol 
            name="arrow.2.squarepath" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].tint} 
            style={styles.featureIcon}
          />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Exchange Reservations</ThemedText>
            <ThemedText>Trade or sell your restaurant bookings</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.featureCard}>
          <IconSymbol 
            name="fork.knife" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].tint} 
            style={styles.featureIcon}
          />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Discover Restaurants</ThemedText>
            <ThemedText>Find new dining experiences near you</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.featureCard}>
          <IconSymbol 
            name="bell.badge.fill" 
            size={24} 
            color={Colors[colorScheme ?? 'light'].tint} 
            style={styles.featureIcon}
          />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">Waitlist Alerts</ThemedText>
            <ThemedText>Get notified when reservations become available</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <TouchableOpacity 
          style={[
            styles.demoButton, 
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]}
        >
          <ThemedText style={[
            styles.buttonText,
            colorScheme === 'dark' ? { color: '#000' } : { color: '#FFFFFF' }
          ]}>Find Reservations</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <ThemedText style={{ color: Colors[colorScheme ?? 'light'].tint }}>List Your Reservation</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>© 2024 Rez Seekers</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCCCCC',
  },
  featureIcon: {
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  demoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.5,
  },
});
