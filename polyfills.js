import 'react-native-get-random-values';

// Firebase uses navigator.userAgent for environment detection
if (typeof navigator === 'undefined') {
  global.navigator = { userAgent: 'ReactNative' };
} else if (!navigator.userAgent) {
  navigator.userAgent = 'ReactNative';
}
