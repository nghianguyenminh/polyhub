const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─── Expo Go Compatibility ────────────────────────────────────────────────────
// ZegoCloud và các native dependencies của nó không tương thích với Expo Go.
// Dùng resolveRequest để chặn TẤT CẢ require() của các package này (kể cả
// khi chúng được gọi từ bên trong node_modules), redirect về mock files.
//
// ⚠️  KHI BUILD APK / DEVELOPMENT BUILD: xóa toàn bộ block resolveRequest này.
// ─────────────────────────────────────────────────────────────────────────────
const ZEGO_MOCK = path.resolve(__dirname, 'src/mocks/zegocloud-mock.js');
const PREBUILT_MOCK = path.resolve(__dirname, 'src/mocks/zegocloud-prebuilt-mock.js');

// Các package bị thiếu hoặc không tương thích Expo Go
const MOCKED_MODULES = {
  '@zegocloud/zego-uikit-rn': ZEGO_MOCK,
  '@zegocloud/zego-uikit-prebuilt-call-rn': PREBUILT_MOCK,
  '@sayem314/react-native-keep-awake': ZEGO_MOCK,
};

// config.resolver = config.resolver || {};
// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   if (MOCKED_MODULES[moduleName]) {
//     return {
//       filePath: MOCKED_MODULES[moduleName],
//       type: 'sourceFile',
//     };
//   }
//   // Fallback về Metro resolver mặc định
//   return context.resolveRequest(context, moduleName, platform);
// };

module.exports = config;
