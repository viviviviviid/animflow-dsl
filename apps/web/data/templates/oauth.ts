import type { Template } from "./index";

export const oauthTemplate: Template = {
  name: "OAuth 2.0 Social Login",
  description: "Authorization Code Flow behind the 'Sign in with Google'",
  dsl: `flowchart LR
  user[User]
  browser[Browser]
  app[Service App<br/>example.com]
  google_auth[Google Auth Server<br/>accounts.google.com]
  google_api[Google API<br/>www.googleapis.com]
  app_db[(App DB<br/>Session Storage)]

  user -->|Click Google Sign In| browser
  browser -->|GET /auth/google| app
  app -->|302 Redirect<br/>client_id, scope, redirect_uri| browser
  browser -->|Authorization Request| google_auth
  user -->|Google Login + Consent| google_auth
  google_auth -->|Authorization Code<br/>One-time Short-lived Code| browser
  browser -->|Pass Code| app
  app -->|Code + Client Secret<br/>Server-to-Server| google_auth
  google_auth -->|Access Token<br/>Refresh Token| app
  app -->|Bearer Access Token| google_api
  google_api -->|User Profile<br/>Email, Name, Photo| app
  app -->|Create & Save Session| app_db
  app -->|Issue Session Cookie| browser
  browser -->|Use Service| user

@animation
  step 1: show user, browser
    name: "Show User and Browser"
    description: "Display the user and browser nodes on screen."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 2: highlight user
    name: "Highlight User"
    description: "Highlight the user."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show app
    name: "Show App Server"
    description: "Display the app server node on screen."
    effect: scaleIn
    duration: 0.8s

  step 4: connect user->browser
    name: "Click Sign In"
    description: "User clicks the Google sign-in button."
    flow: particles
    speed: 1s

  step 5: connect browser->app
    name: "Request App Server"
    description: "Browser sends authentication request to app server."
    flow: particles
    speed: 1.5s

  step 6: highlight app
    name: "Highlight App Server"
    description: "Highlight the app server."
    color: #FF9800
    pulse: true
    duration: 1s

  step 7: show google_auth
    name: "Show Google Auth Server"
    description: "Display the Google Auth Server node on screen."
    effect: slideInRight
    duration: 1s

  step 8: connect app->browser
    name: "302 Redirect"
    description: "App server sends Google redirect to browser."
    flow: arrow
    speed: 1s

  step 9: connect browser->google_auth
    name: "Google Auth Request"
    description: "Browser requests Google Auth Server."
    flow: particles
    speed: 1.5s

  step 10: highlight google_auth
    name: "Highlight Google Auth Server"
    description: "Highlight the Google Auth Server."
    color: #4285F4
    glow: true
    duration: 1.5s

  step 11: connect user->google_auth
    name: "Google Login + Consent"
    description: "User logs in with Google account and consents to permissions."
    flow: particles
    speed: 1.5s

  step 12: connect google_auth->browser
    name: "Issue Authorization Code"
    description: "Google passes Authorization Code to browser."
    flow: particles
    speed: 1.5s

  step 13: highlight browser
    name: "Receive Code"
    description: "Browser receives Authorization Code."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 14: connect browser->app
    name: "Pass Code to App Server"
    description: "Browser passes Code to app server."
    flow: particles
    speed: 1.5s

  step 15: connect app->google_auth
    name: "Exchange Code + Secret"
    description: "App server exchanges Code and Client Secret with Google."
    flow: particles
    speed: 1.5s

  step 16: highlight app
    name: "Highlight App Server Exchange"
    description: "App server requests tokens server-to-server."
    color: #FF9800
    glow: true
    duration: 1s

  step 17: connect google_auth->app
    name: "Issue Access Token"
    description: "Google issues Access Token and Refresh Token to app server."
    flow: particles
    speed: 1.5s

  step 18: show google_api
    name: "Show Google API Server"
    description: "Display the Google API Server node on screen."
    effect: fadeIn
    duration: 0.8s

  step 19: connect app->google_api
    name: "Request User Info"
    description: "App server requests user info with Access Token."
    flow: particles
    speed: 1.5s

  step 20: connect google_api->app
    name: "Return User Profile"
    description: "Google API returns email, name, and photo."
    flow: particles
    speed: 1.5s

  step 21: show app_db
    name: "Show App DB"
    description: "Display the app DB node on screen."
    effect: bounceIn
    duration: 1s

  step 22: connect app->app_db
    name: "Save Session"
    description: "App server saves session to DB."
    flow: particles
    speed: 1s

  step 23: highlight app_db
    name: "Highlight DB"
    description: "Highlight the app DB."
    color: #FF9800
    pulse: true
    duration: 1s

  step 24: connect app->browser
    name: "Issue Session Cookie"
    description: "App server issues session cookie to browser."
    flow: particles
    speed: 1.5s

  step 25: connect browser->user
    name: "Use Service"
    description: "User uses the service."
    flow: particles
    speed: 1s

  step 26: highlight user, app
    name: "Login Complete"
    description: "OAuth 2.0 login is complete."
    color: #4CAF50
    glow: true
    duration: 2s

  step 27: camera fitAll
    name: "Camera Fit All"
    description: "Adjust camera to show entire flow."
    padding: 40px
    duration: 2s
@end

@style
  user:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  browser:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  app:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  google_auth:
    fill: #e8eaf6
    stroke: #4285F4
    stroke-width: 3px

  google_api:
    fill: #e8eaf6
    stroke: #34A853
    stroke-width: 2px

  app_db:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px
@end

@narration
  step 1:
    title: "What Happens Behind the 'Sign in with Google' Button"
    text: "When you click the 'Sign in with Google' button on a website, what happens? Does my Google password get passed to that site? No. OAuth 2.0 is a protocol that delegates trust without passwords. Let's see how this is possible."

  step 6:
    title: "App Server's Role - Preparing Redirect"
    text: "The app server that receives the login request creates a Google auth page URL and tells the browser 'go here'. The URL includes client_id (this app's identity), scope (requested permissions: email, profile), and redirect_uri (where to return after auth). These parameters create the security for the entire flow."

  step 10:
    title: "Google Auth Server - Password Only Here"
    text: "The user is now on Google's official page. Your Google account password is entered only here. example.com cannot see the password. This is the core of OAuth. The consent screen shows 'this app will read your email and profile' - a list of requested permissions."

  step 12:
    title: "Authorization Code - One-time Coupon"
    text: "Google issues an Authorization Code. This is a very short-lived (usually 10 minutes) one-time code. It appears in the browser URL as code=4/0AY0e-g7... This code alone does nothing; you must exchange it with Client Secret to get actual tokens."

  step 15:
    title: "Code + Secret Exchange - Importance of Backchannel"
    text: "The app server directly requests Google with Authorization Code and Client Secret. This communication is server-to-server, not through the browser. The Client Secret is never transmitted through browser networks, so there's no risk of theft. This is why Authorization Code Flow is secure."

  step 17:
    title: "Access Token - Real Key"
    text: "Google issues Access Token and Refresh Token. Access Token is a short-term key (usually 1 hour) used when requesting Google API, and Refresh Token is a long-term key to get a new Access Token when it expires. Only the app server has these tokens. They're never exposed to the browser."

  step 19:
    title: "Obtain User Information"
    text: "Request Google API with Access Token in Authorization header. Example: 'GET https://www.googleapis.com/oauth2/v2/userinfo'. Send in Bearer token format: 'Bearer ya29.a0ARrdaM...' Google API verifies the token and returns email, name, and profile photo."

  step 26:
    title: "Core Value of OAuth 2.0"
    text: "Through all this, example.com verified 'this person is Google account user@gmail.com' without knowing the Google password. Users don't need to create another password and can revoke app access anytime in Google settings. This is the power of password-less delegated authentication."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
