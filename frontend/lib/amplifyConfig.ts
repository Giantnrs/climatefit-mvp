import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_djZJFPjA1',
      userPoolClientId: '2tj54esn827sjk6iro0b1r2hrq',
      loginWith: {
        oauth: {
          domain: 'us-east-1djzjfpja1.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'phone'],
          redirectSignIn: ['http://localhost:3000/login'],
          redirectSignOut: [],
          responseType: 'code',
          
        }
      }
    }
  }
};

Amplify.configure(amplifyConfig);
console.log('🚀 Amplify configured successfully');

export default amplifyConfig;