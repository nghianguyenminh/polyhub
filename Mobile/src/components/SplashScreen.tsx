import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PATHS = [
  {
    id: 'p1',
    d: "M111.78 1.14062C114.385 0.272248 117.346 0.281254 120.684 1.20508C122.387 2.78256 124.178 4.24685 126.055 5.59766C137.327 24.6163 150.665 42.1084 166.066 58.0752C164.225 58.786 162.203 59.0189 159.991 58.7578C150.93 57.3502 143.034 53.5681 136.293 47.4062C129.069 38.6843 122.422 29.5448 116.354 19.9863L115.761 19.0508L115.452 20.1152C108.496 44.1335 98.3521 66.7502 85.0214 87.9668C75.6186 99.663 63.6287 105.582 49.0155 105.751C73.9747 76.361 92.5974 43.2739 104.881 6.48926C106.865 3.78109 109.166 2.01183 111.78 1.14062Z",
    from: { x: -160, y: -160, rotate: '-30deg', scale: 0.4 },
  },
  {
    id: 'p2',
    d: "M117.457 49.3589C147.044 74.5687 180.45 93.1824 217.675 105.196C219.929 107.197 221.399 109.423 222.11 111.874C222.826 114.338 222.785 117.064 221.963 120.069C220.88 122.103 219.441 123.861 217.64 125.346C198.339 136.744 180.708 150.376 164.746 166.238C164.235 163.24 164.449 160.321 165.388 157.471C166.826 155.405 167.504 153.025 167.433 150.349C170.323 143.366 174.595 137.297 180.254 132.138C183.911 129.478 187.569 126.819 191.226 124.159L203.054 115.557L202.071 115.274C176.982 108.048 153.709 97.0782 132.251 82.3658C122.785 73.2033 117.86 62.2093 117.457 49.3589Z",
    from: { x: 160, y: -160, rotate: '30deg', scale: 0.4 },
  },
  {
    id: 'p3',
    d: "M58.9521 58.1421C59.1085 58.689 59.2648 59.2358 59.4209 59.7827C57.0772 74.6184 49.8247 86.463 37.6455 95.3433C31.7971 99.1021 26.1243 103.108 20.627 107.359L19.8428 107.965L20.7959 108.236C44.4989 114.963 66.7817 124.938 87.6426 138.162C98.2225 145.942 104.481 156.315 106.435 169.306C106.557 170.607 106.476 171.886 106.2 173.146C105.117 171.917 103.766 171.126 102.155 170.791C73.5963 147.358 41.6071 129.865 6.19043 118.312C2.51582 115.033 0.667631 111.748 0.510742 108.455C0.353602 105.154 1.88818 101.721 5.25293 98.1441C24.5918 86.5479 42.4 72.8963 58.6797 57.1909C58.7703 57.508 58.8615 57.8252 58.9521 58.1421Z",
    from: { x: -160, y: 160, rotate: '-20deg', scale: 0.4 },
  },
  {
    id: 'p4',
    d: "M138.84 134.543C147.857 122.877 159.512 117.278 173.85 117.712C161.507 131.509 151.084 146.556 142.579 162.853C141.888 163.119 141.335 163.522 140.962 164.082C140.58 164.655 140.416 165.347 140.431 166.125C136.724 172.546 133.24 179.185 129.981 186.039L129.977 186.048C125.392 196.142 121.396 206.46 117.989 217.001C115.017 220.456 111.96 222.284 108.82 222.598C105.68 222.912 102.35 221.722 98.8114 218.915C87.1286 199.483 73.434 181.631 57.7274 165.359C58.9143 164.725 60.2836 164.516 61.8593 164.749L61.8954 164.754H64.7753C66.524 165.978 68.5468 166.641 70.83 166.749C75.3408 168.354 79.6046 170.488 83.6229 173.15C93.0016 181.689 100.624 191.468 106.491 202.489L106.495 202.497L106.5 202.505C106.713 202.872 106.94 203.18 107.189 203.387C107.444 203.598 107.78 203.747 108.155 203.653C108.504 203.566 108.753 203.3 108.931 203.021C109.11 202.738 109.264 202.367 109.401 201.929C110.597 199.176 111.272 196.313 111.428 193.34C117.347 172.214 126.484 152.615 138.84 134.543Z",
    from: { x: 160, y: 160, rotate: '25deg', scale: 0.4 },
  },
];

interface SplashScreenProps {
  onAnimationEnd?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  // Global container opacity for fade out
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerTranslateY = useRef(new Animated.Value(0)).current;

  // Path animations
  const pathAnims = useRef(
    PATHS.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Flash animations
  const flashScale = useRef(new Animated.Value(0.3)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Container bounce/scale when merged
  const containerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Prepare animations for each path
    const animations = PATHS.map((p, i) => {
      const anim = pathAnims[i];
      // Set initial values
      anim.x.setValue(p.from.x);
      anim.y.setValue(p.from.y);
      anim.rotate.setValue(parseFloat(p.from.rotate));
      anim.scale.setValue(p.from.scale);
      anim.opacity.setValue(0);

      // Animate to target
      return Animated.parallel([
        Animated.timing(anim.x, {
          toValue: 0,
          duration: 750,
          delay: 100 + i * 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.y, {
          toValue: 0,
          duration: 750,
          delay: 100 + i * 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.rotate, {
          toValue: 0,
          duration: 750,
          delay: 100 + i * 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 750,
          delay: 100 + i * 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 750,
          delay: 100 + i * 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]);
    });

    // 2. Flash Glow Animation (starts at ~950ms)
    const flashAnimation = Animated.parallel([
      Animated.sequence([
        Animated.delay(950),
        Animated.parallel([
          Animated.timing(flashScale, {
            toValue: 2.2,
            duration: 550,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.timing(flashOpacity, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // fade out flash
      Animated.sequence([
        Animated.delay(1150),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // 3. Logo bounce when merged
    const logoBounce = Animated.sequence([
      Animated.delay(950),
      Animated.parallel([
        Animated.timing(containerScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
      Animated.timing(containerScale, {
        toValue: 1.0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }),
    ]);

    // 4. Fade out entire Splash Screen at 1500ms
    const fadeOut = Animated.sequence([
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.8, 0, 0.2, 1),
        }),
        Animated.timing(containerTranslateY, {
          toValue: -40,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.8, 0, 0.2, 1),
        }),
      ]),
    ]);

    // Run all animations in parallel
    Animated.parallel([
      ...animations,
      flashAnimation,
      logoBounce,
      fadeOut,
    ]).start(() => {
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ translateY: containerTranslateY }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: flashOpacity,
            transform: [{ scale: flashScale }],
          },
        ]}
      />

      {/* Svg paths container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: containerScale }],
          },
        ]}
      >
        {PATHS.map((p, i) => {
          const anim = pathAnims[i];
          const rotateStr = anim.rotate.interpolate({
            inputRange: [-180, 180],
            outputRange: ['-180deg', '180deg'],
          });

          return (
            <Animated.View
              key={p.id}
              style={[
                styles.pathWrapper,
                {
                  opacity: anim.opacity,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate: rotateStr },
                    { scale: anim.scale },
                  ],
                },
              ]}
            >
              <Svg width={180} height={180} viewBox="0 0 224 224">
                <Path d={p.d} fill="#F27125" />
              </Svg>
            </Animated.View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(242, 113, 37, 0.35)',
  },
  logoContainer: {
    position: 'relative',
    width: 180,
    height: 180,
  },
  pathWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 180,
    height: 180,
  },
});
