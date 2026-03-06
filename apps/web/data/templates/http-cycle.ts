import type { Template } from "./index";

export const httpCycleTemplate: Template = {
  name: "HTTP Request-Response Cycle",
  description: "Complete flow of HTTP communication",
  dsl: `flowchart LR
  client[Client<br/>Web Browser]
  dns[DNS Server]
  server[Web Server]
  app[Application]
  db[(Database)]

  client -->|DNS Query| dns
  dns -->|Return IP| client
  client -->|HTTP GET| server
  server -->|Forward Request| app
  app -->|Query Data| db
  db -->|Return Data| app
  app -->|Generate HTML| server
  server -->|HTTP Response| client

@animation
  step 1: show client
    name: "Display Client"
    description: "Display the client node on screen."
    effect: fadeIn
    duration: 1s

  step 2: highlight client
    name: "Highlight Client"
    description: "Highlight the client node."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show dns
    name: "Display DNS"
    description: "Display the dns node on screen."
    effect: slideInTop
    duration: 1s

  step 4: connect client->dns
    name: "Connect DNS Query"
    description: "Create flow from client to dns for query request."
    flow: particles
    speed: 1.5s

  step 5: highlight dns
    name: "Highlight DNS"
    description: "Highlight the dns query step."
    color: #9C27B0
    pulse: true
    duration: 1s

  step 6: connect dns->client
    name: "Connect DNS Response"
    description: "Create response flow from dns to client."
    flow: particles
    speed: 1s

  step 7: show server
    name: "Display Server"
    description: "Display the server node on screen."
    effect: slideInRight
    duration: 1s

  step 8: connect client->server
    name: "Connect HTTP Request"
    description: "Create flow from client to server for HTTP request."
    flow: particles
    speed: 2s

  step 9: highlight server
    name: "Highlight Server"
    description: "Highlight the server processing step."
    color: #4CAF50
    glow: true
    duration: 1s

  step 10: show app
    name: "Display Application"
    description: "Display the app node on screen."
    effect: scaleIn
    duration: 1s

  step 11: connect server->app
    name: "Connect Server to App"
    description: "Create flow from server to app for request forwarding."
    flow: arrow
    speed: 1s

  step 12: highlight app
    name: "Highlight App"
    description: "Highlight the app node."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 13: show db
    name: "Display Database"
    description: "Display the db node on screen."
    effect: bounceIn
    duration: 1s

  step 14: connect app->db
    name: "Connect Database Query"
    description: "Create flow from app to db for data query."
    flow: particles
    speed: 1s

  step 15: highlight db
    name: "Highlight Database"
    description: "Highlight the database query step."
    color: #FF9800
    glow: true
    duration: 1s

  step 16: connect db->app
    name: "Connect Database Response"
    description: "Create response flow from db to app."
    flow: particles
    speed: 1s

  step 17: connect app->server
    name: "Connect App Response"
    description: "Create response flow from app to server."
    flow: arrow
    speed: 1s

  step 18: connect server->client
    name: "Connect Final Response"
    description: "Create final response flow from server to client."
    flow: particles
    speed: 2s

  step 19: highlight client
    name: "Highlight Client Complete"
    description: "Highlight the client response completion state."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 20: camera fitAll
    name: "Fit Camera to All"
    description: "Adjust camera to show the entire request-response flow."
    padding: 40px
    duration: 2s
@end

@style
  client:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  dns:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  server, app:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  db:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
@end

@narration
  step 1:
    title: "Starting from Web Browser"
    text: "When you enter a URL (like www.google.com) in your browser's address bar, a complex process begins behind the scenes. Let's follow this process step by step."

  step 2:
    title: "What is a Client?"
    text: "Your web browser is the 'client'. It's the side that requests information from the server. It's like a customer ordering from a menu at a restaurant."

  step 4:
    title: "DNS Lookup - Finding the Address"
    text: "The browser first needs to find where 'www.google.com' is located. The DNS server is like the internet's phone book, converting domain names to actual server IP addresses (e.g., 142.250.196.110)."

  step 5:
    title: "DNS Finds the IP"
    text: "The DNS server returns the answer 'www.google.com = 142.250.196.110'. Now the browser can connect directly to this IP address."

  step 8:
    title: "Send HTTP Request"
    text: "The browser sends a request to the web server saying 'GET / HTTP/1.1'. This means 'Please give me the content of this page'. HTTP is the protocol for exchanging data on the web."

  step 9:
    title: "Web Server Receives Request"
    text: "The web server (Nginx, Apache, etc.) receives the request. If it's a static file (image, CSS), it responds immediately. For dynamic content, it forwards to the application."

  step 12:
    title: "Application Processes"
    text: "The application (Node.js, Django, etc.) executes the business logic. It makes decisions like 'I need to fetch this user's order list from the database'."

  step 14:
    title: "Database Query"
    text: "The application sends an SQL query to the database (MySQL, PostgreSQL, etc.) to fetch the required data. It's like finding needed books in a library."

  step 15:
    title: "Return Data"
    text: "The database returns the requested data. The application converts this data into an HTML page."

  step 18:
    title: "Send HTTP Response"
    text: "The completed HTML returns to the browser through the web server. The response includes a status code (200 OK, 404 Not Found, etc.) and HTML, CSS, and JavaScript files."

  step 19:
    title: "Page Rendering Complete"
    text: "The browser interprets the received HTML and draws it on screen. This entire process usually happens in hundreds of milliseconds (0.1-0.5 seconds)! This is what happens every time you enter a URL."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
@end`,
};
