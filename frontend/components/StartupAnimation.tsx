import { useCallback, useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  withSequence,
  withDelay,
  Easing,
  useSharedValue
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function StartupAnimation({ 
  children,
  onAnimationComplete 
}: { 
  children: React.ReactNode;
  onAnimationComplete: () => void;
}) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // Create animated components
  const AnimatedImage = Animated.createAnimatedComponent(Image);
  
  // Define animated styles
  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value
    };
  });

  const startAnimation = useCallback(() => {
    // Start with the logo animation
    scale.value = withSequence(
      withSpring(1.2, { damping: 12 }),
      withSpring(1, { damping: 8 })
    );
    opacity.value = withTiming(1, { 
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    // After logo animation, fade out the container
    containerOpacity.value = withDelay(
      1000,
      withTiming(0, { 
        duration: 400,
        easing: Easing.out(Easing.ease)
      }, (finished) => {
        if (finished) {
          runOnJS(SplashScreen.hideAsync)();
          runOnJS(onAnimationComplete)();
        }
      })
    );
  }, []);

  // Start animation when component mounts
  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {children}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          styles.animationContainer,
          { backgroundColor },
          containerStyle
        ]}
      >
        <AnimatedImage
          source={require('@/assets/images/favicon.png')}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
}); 