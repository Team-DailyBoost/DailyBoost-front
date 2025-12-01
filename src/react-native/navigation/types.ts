/**
 * React Navigation Type Definitions
 * 
 * Defines navigation parameter types for all screens
 */

import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Challenge Stack Navigator Param List
 * 
 * Navigation action with payload example:
 * ```ts
 * navigation.navigate('CreateChallenge', {
 *   onChallengeCreated: () => {
 *     // Callback to refresh challenge list after creation
 *     loadChallenges();
 *   }
 * });
 * ```
 * 
 * Note: Functions in params are not officially supported by React Navigation
 * for serialization, but can work in practice for simple callbacks within
 * the same navigation session.
 */
export type ChallengeStackParamList = {
  ChallengeList: undefined;
  CreateChallenge: {
    onChallengeCreated?: () => void;
  };
};

/**
 * Root Tab Navigator Param List
 */
export type RootTabParamList = {
  홈: undefined;
  식단: undefined;
  운동: undefined;
  챌린지: NavigatorScreenParams<ChallengeStackParamList>;
  커뮤니티: undefined;
  마이: undefined;
};

/**
 * Auth Stack Navigator Param List
 */
export type AuthStackParamList = {
  Login: undefined;
  SocialLogin: {
    provider?: 'naver' | 'kakao';
  };
};

/**
 * Root Stack Navigator Param List
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<RootTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

