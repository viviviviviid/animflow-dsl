import type { Template } from "./index";

export const jwtAuthTemplate: Template = {
  name: "JWT Authentication Flow",
  description: "Complete authentication flow from login request to token issuance and verification",
  dsl: `flowchart TD
  client([Client])
  login[Login Request]
  api[Auth API]
  validate{Password Verify}
  issue[Issue JWT]
  store[Store Token]
  request[Protected API Request]
  verify{Verify Token}
  success[Return Data]
  fail[401 Unauthorized]

  client --> login
  login --> api
  api --> validate
  validate -->|Success| issue
  validate -->|Fail| fail
  issue --> store
  store --> request
  request --> verify
  verify -->|Valid| success
  verify -->|Expired/Tampered| fail
  success --> client
  fail --> client

@animation
  step 1: show client
    name: "Display Client"
    description: "Display the client node on screen."
    effect: fadeIn
    duration: 1s

  step 2: show login
    name: "Display Login Request"
    description: "Display the login node on screen."
    effect: fadeIn
    duration: 1s

  step 3: connect client->login
    name: "Connect Login Request"
    description: "Create flow from client to login."
    flow: particles
    speed: 1s

  step 4: show api
    name: "Display Auth API"
    description: "Display the api node on screen."
    effect: scaleIn
    duration: 0.9s

  step 5: connect login->api
    name: "Connect to API"
    description: "Create flow from login to api."
    flow: particles
    speed: 1s

  step 6: show validate
    name: "Display Password Verification"
    description: "Display the validate node on screen."
    effect: scaleIn
    duration: 0.9s

  step 7: connect api->validate
    name: "Connect to Validation"
    description: "Create flow from api to validate."
    flow: particles
    speed: 1s

  step 8: highlight validate
    name: "Highlight Password Verification"
    description: "Highlight the validation process."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: show issue
    name: "Display JWT Issuance"
    description: "Display the issue node on screen."
    effect: bounceIn
    duration: 0.9s

  step 10: connect validate->issue
    name: "Connect Success Path"
    description: "Create success path from validate to issue."
    flow: arrow
    speed: 1s

  step 11: highlight issue
    name: "Highlight JWT Issuance"
    description: "Highlight the issuance step."
    color: #4CAF50
    glow: true
    duration: 1s

  step 12: show store
    name: "Display Token Storage"
    description: "Display the store node on screen."
    effect: bounceIn
    duration: 0.9s

  step 13: connect issue->store
    name: "Connect Storage Flow"
    description: "Create flow from issue to store."
    flow: arrow
    speed: 1s

  step 14: show request
    name: "Display Protected API Request"
    description: "Display the request node on screen."
    effect: fadeIn
    duration: 0.9s

  step 15: connect store->request
    name: "Connect API Request"
    description: "Create flow from store to request."
    flow: particles
    speed: 1s

  step 16: show verify
    name: "Display Token Verification"
    description: "Display the verify node on screen."
    effect: fadeIn
    duration: 0.9s

  step 17: connect request->verify
    name: "Connect Verification"
    description: "Create flow from request to verify."
    flow: particles
    speed: 1s

  step 18: highlight verify
    name: "Highlight Token Verification"
    description: "Highlight the verification process."
    color: #2196F3
    pulse: true
    duration: 1s

  step 19: show success
    name: "Display Success Response"
    description: "Display the success node on screen."
    effect: scaleIn
    duration: 0.8s

  step 20: connect verify->success
    name: "Connect Success Path"
    description: "Create success path from verify to success."
    flow: arrow
    speed: 1s

  step 21: highlight success
    name: "Highlight Success"
    description: "Highlight the success node."
    color: #4CAF50
    glow: true
    duration: 1s

  step 22: show fail
    name: "Display Failure Response"
    description: "Display the fail node on screen."
    effect: fadeIn
    duration: 0.8s

  step 23: connect validate->fail, verify->fail
    name: "Connect Failure Paths"
    description: "Create failure paths from validate and verify to fail."
    flow: dash
    speed: 1s

  step 24: highlight fail
    name: "Highlight Failure"
    description: "Highlight the fail node."
    color: #F44336
    pulse: true
    duration: 1s

  step 25: camera fitAll
    name: "Fit Camera to All"
    description: "Adjust camera to show the entire authentication flow."
    padding: 50px
    duration: 1.5s
@end

@style
  client:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  api, login, request, store:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  validate, verify:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  issue, success:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  fail:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Starting the Login"
    text: "The user enters their username and password on the website and clicks the 'Login' button. This information is transmitted to the server in the first step."

  step 6:
    title: "Server Receives Request"
    text: "When the Auth API server receives the login request, it compares the password hash stored in the database with the password sent by the user."

  step 8:
    title: "Password Verification"
    text: "Passwords are never stored in plain text. Only the value converted by a 'hash function' is stored, so the entered password is converted the same way and compared. It's like a fingerprint match."

  step 11:
    title: "JWT Token Issuance"
    text: "If password verification succeeds, the server issues a JWT (JSON Web Token). JWT is like a 'digital access pass' containing who the user is and what permissions they have."

  step 13:
    title: "JWT Structure"
    text: "JWT consists of three parts: Header (algorithm info), Payload (user info, expiration time), and Signature (tamper-proof signature). Signed with the server's secret key, making it impossible to forge."

  step 16:
    title: "Call API with Token"
    text: "Now the user doesn't need to log in every time. They can simply include the stored JWT in the HTTP header (Authorization: Bearer...). It's like showing an access pass."

  step 18:
    title: "Token Verification"
    text: "The server verifies that the JWT signature is valid and the expiration time hasn't passed. This process is very fast because it only requires the server's secret key, no database lookup needed."

  step 21:
    title: "Authentication Success"
    text: "If the token is valid, the requested data is returned. The user can maintain their logged-in state and freely use the service."

  step 22:
    title: "Authentication Failure"
    text: "If the password is wrong or the token is expired/tampered, a '401 Unauthorized' error is returned. The user must log in again."

  step 24:
    title: "Importance of Security"
    text: "JWT's advantages are that the server doesn't need to maintain state (Stateless) and authentication can be easily shared in microservice environments. However, token theft must be prevented."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
  tts: true
@end`,
};
