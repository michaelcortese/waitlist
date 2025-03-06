import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, Keyboard, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const lastNameRef = useRef<TextInput>(null);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleContinue = () => {
    if (firstName.trim() && lastName.trim()) {
      // Here you would typically save the user's name
      router.replace('/(tabs)');
    }
  };

  const inputBorderColor = Colors[colorScheme ?? 'light'].tint;
  const placeholderColor = Colors[colorScheme ?? 'light'].icon;

  return (
    <ThemedView style={styles.container}>
      <Animated.View 
        entering={FadeIn.delay(400)}
        style={[styles.content, isKeyboardVisible && styles.contentCompressed]}
      >
        {!isKeyboardVisible && (
          <Animated.Image
            entering={FadeInDown.delay(600)}
            source={require('@/assets/images/favicon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        
        <Animated.View entering={FadeInUp.delay(800)} layout={Layout}>
          <ThemedText type="title" style={styles.title}>
            Welcome to Rez Seekers
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Join the restaurant reservation exchange
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              { borderColor: inputBorderColor },
              colorScheme === 'dark' && styles.inputDark
            ]}
            placeholder="First Name"
            placeholderTextColor={placeholderColor}
            value={firstName}
            onChangeText={setFirstName}
            autoCorrect={false}
            autoComplete="given-name"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />

          <TextInput
            ref={lastNameRef}
            style={[
              styles.input,
              { borderColor: inputBorderColor },
              colorScheme === 'dark' && styles.inputDark
            ]}
            placeholder="Last Name"
            placeholderTextColor={placeholderColor}
            value={lastName}
            onChangeText={setLastName}
            autoCorrect={false}
            autoComplete="family-name"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim()}
          >
            <Animated.View
              entering={FadeInUp.delay(1000)}
              style={[
                styles.button,
                { backgroundColor: inputBorderColor },
                (!firstName.trim() || !lastName.trim()) && styles.buttonDisabled
              ]}
            >
              <ThemedText style={[
                styles.buttonText,
                colorScheme === 'dark' ? { color: '#000' } : { color: '#FFFFFF' }
              ]}>
                Start Exploring
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentCompressed: {
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  input: {
    width: 300,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
  },
  button: {
    width: 300,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 