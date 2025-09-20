import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
          scopes: ['openid', 'email', 'phone'],
          redirectSignIn: [process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN!],
          redirectSignOut: [process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT!],
          responseType: 'code',
        }
      }
    }
  }
};

Amplify.configure(amplifyConfig);
console.log('🚀 Amplify configured successfully');
console.log('Amplify env:', {
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
  redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN,
  redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT,
});

export default amplifyConfig;