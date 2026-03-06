import type { Template } from "./index";

export const cicdTemplate: Template = {
  name: "CI/CD Pipeline",
  description: "Complete automated deployment flow from git push to production",
  dsl: `flowchart LR
  dev[Developer<br/>Local Work]
  git[Git Repository<br/>main Branch]
  ci[CI Server<br/>GitHub Actions]
  build[Build<br/>npm run build]
  lint[Lint / Type Check<br/>ESLint, TypeScript]
  unit[Unit Tests<br/>Jest / Vitest]
  integration[Integration Tests<br/>Supertest]
  docker[Docker Image<br/>Build & Tag]
  registry[Container Registry<br/>ECR / Docker Hub]
  staging[Staging Deployment<br/>Kubernetes]
  smoke[Smoke Tests<br/>Core API Validation]
  prod[Production Deployment<br/>Blue-Green]
  monitor[Monitoring<br/>Datadog / Sentry]
  notify[Team Notification<br/>Slack / Email]

  dev -->|git push origin main| git
  git -->|webhook trigger| ci
  ci --> build
  build --> lint
  lint --> unit
  unit --> integration
  integration --> docker
  docker --> registry
  registry --> staging
  staging --> smoke
  smoke -->|Test Passed| prod
  smoke -.->|Test Failed| notify
  prod --> monitor
  monitor --> notify

@animation
  step 1: show dev
    name: "Show Developer"
    description: "Display the developer node on screen."
    effect: slideInLeft
    duration: 1s

  step 2: highlight dev
    name: "Highlight Developer"
    description: "Highlight the developer."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show git
    name: "Show Git Repository"
    description: "Display the Git repository node on screen."
    effect: scaleIn
    duration: 0.8s

  step 4: connect dev->git
    name: "git push"
    description: "Developer pushes code to Git."
    flow: particles
    speed: 1.5s

  step 5: highlight git
    name: "Highlight Git"
    description: "Highlight the Git repository."
    color: #F44336
    pulse: true
    duration: 1s

  step 6: show ci
    name: "Show CI Server"
    description: "Display the CI server node on screen."
    effect: flipIn
    duration: 1s

  step 7: connect git->ci
    name: "webhook trigger"
    description: "Git sends webhook to CI server."
    flow: particles
    speed: 1.5s

  step 8: highlight ci
    name: "Highlight CI Server"
    description: "Highlight the CI server."
    color: #FF9800
    glow: true
    duration: 1s

  step 9: show build
    name: "Show Build"
    description: "Display the build node on screen."
    effect: slideInRight
    duration: 0.8s

  step 10: connect ci->build
    name: "Start Build"
    description: "CI server starts the build."
    flow: arrow
    speed: 1s

  step 11: highlight build
    name: "Highlight Build"
    description: "Highlight the build stage."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: show lint
    name: "Show Lint"
    description: "Display the lint node on screen."
    effect: fadeIn
    duration: 0.8s

  step 13: connect build->lint
    name: "Lint Check"
    description: "Perform code quality check after build."
    flow: arrow
    speed: 1s

  step 14: highlight lint
    name: "Highlight Lint"
    description: "Highlight the lint stage."
    color: #9C27B0
    pulse: true
    duration: 1s

  step 15: show unit
    name: "Show Unit Tests"
    description: "Display the unit tests node on screen."
    effect: fadeIn
    duration: 0.8s

  step 16: connect lint->unit
    name: "Unit Tests"
    description: "Run unit tests after linting."
    flow: arrow
    speed: 1s

  step 17: highlight unit
    name: "Highlight Unit Tests"
    description: "Highlight the unit tests stage."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 18: show integration
    name: "Show Integration Tests"
    description: "Display the integration tests node on screen."
    effect: fadeIn
    duration: 0.8s

  step 19: connect unit->integration
    name: "Integration Tests"
    description: "Run integration tests after unit tests."
    flow: arrow
    speed: 1s

  step 20: highlight integration
    name: "Highlight Integration Tests"
    description: "Highlight the integration tests stage."
    color: #4CAF50
    glow: true
    duration: 1s

  step 21: show docker
    name: "Show Docker Build"
    description: "Display the Docker image build node on screen."
    effect: scaleIn
    duration: 0.8s

  step 22: connect integration->docker
    name: "Build Docker Image"
    description: "Build Docker image after tests pass."
    flow: arrow
    speed: 1s

  step 23: highlight docker
    name: "Highlight Docker"
    description: "Highlight the Docker build stage."
    color: #2196F3
    pulse: true
    duration: 1s

  step 24: show registry
    name: "Show Registry"
    description: "Display the container registry node on screen."
    effect: bounceIn
    duration: 0.8s

  step 25: connect docker->registry
    name: "Push Image"
    description: "Push Docker image to registry."
    flow: particles
    speed: 1.5s

  step 26: highlight registry
    name: "Highlight Registry"
    description: "Highlight the registry."
    color: #2196F3
    glow: true
    duration: 1s

  step 27: show staging
    name: "Show Staging"
    description: "Display the staging deployment node on screen."
    effect: slideInRight
    duration: 0.8s

  step 28: connect registry->staging
    name: "Staging Deployment"
    description: "Deploy from registry to staging environment."
    flow: particles
    speed: 1.5s

  step 29: highlight staging
    name: "Highlight Staging"
    description: "Highlight the staging deployment."
    color: #FF9800
    pulse: true
    duration: 1.5s

  step 30: show smoke
    name: "Show Smoke Tests"
    description: "Display the smoke tests node on screen."
    effect: fadeIn
    duration: 0.8s

  step 31: connect staging->smoke
    name: "Run Smoke Tests"
    description: "Run smoke tests on staging."
    flow: arrow
    speed: 1s

  step 32: highlight smoke
    name: "Highlight Smoke Tests"
    description: "Highlight the smoke tests."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 33: show prod
    name: "Show Production"
    description: "Display the production deployment node on screen."
    effect: scaleIn
    duration: 1s

  step 34: connect smoke->prod
    name: "Production Deployment"
    description: "Deploy to production after smoke tests pass."
    flow: particles
    speed: 2s

  step 35: highlight prod
    name: "Highlight Production"
    description: "Highlight the production deployment."
    color: #4CAF50
    glow: true
    duration: 2s

  step 36: show monitor, notify
    name: "Show Monitoring and Notification"
    description: "Display monitoring and notification nodes on screen."
    effect: fadeIn
    stagger: 0.3s
    duration: 0.8s

  step 37: connect prod->monitor
    name: "Start Monitoring"
    description: "Start monitoring after production deployment."
    flow: arrow
    speed: 1s

  step 38: connect monitor->notify
    name: "Team Notification"
    description: "Notify team of monitoring results."
    flow: arrow
    speed: 1s

  step 39: connect smoke->notify
    name: "Failure Notification"
    description: "Notify team if smoke tests fail."
    flow: dash
    speed: 1.5s

  step 40: camera fitAll
    name: "Camera Fit All"
    description: "Adjust camera to show entire pipeline."
    padding: 40px
    duration: 2s
@end

@style
  dev:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  git:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px

  ci:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  build, lint:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  unit, integration:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  docker, registry:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  staging:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  smoke:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  prod:
    fill: #e8f5e9
    stroke: #2E7D32
    stroke-width: 3px

  monitor:
    fill: #e0f7fa
    stroke: #00BCD4
    stroke-width: 2px

  notify:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px
@end

@narration
  step 1:
    title: "CI/CD - Automation Roadway from Code to Product"
    text: "A system where deployment happens automatically after developer pushes code is called CI/CD. CI (Continuous Integration) means continuously merging and validating code, while CD (Continuous Delivery/Deployment) means continuously deploying validated code. Without this automation roadway, you'd have to manually repeat dozens of steps for each deployment."

  step 7:
    title: "Webhook - Event-based Automation"
    text: "One git push is the starting point of a chain reaction. When GitHub detects a push event, it sends an HTTP POST to a pre-registered webhook URL (the CI server). The CI server receives this signal and starts the pipeline. Developers don't need to press any button; just pushing code starts the entire process."

  step 13:
    title: "Lint and Type Check - Code Review by Machine"
    text: "ESLint finds code style and potential bugs, and the TypeScript compiler catches type errors. This is CI's first value. Instead of humans pointing out style in code review, machines check hundreds of rules in 0.1 seconds. Team members can focus on logic and design in reviews."

  step 17:
    title: "Unit Tests - Fast Safety Net"
    text: "Unit tests independently validate individual functions and classes. Usually hundreds of tests complete in seconds. When adding new features, you immediately know if existing features are broken. When test coverage exceeds 80%, deployment failure probability drops dramatically."

  step 19:
    title: "Integration Tests - Do Components Work Together"
    text: "Unit tests validate individual parts, but integration tests verify complete flow with actual DB and external APIs. For example, 'POST /api/orders API call → DB save → Email sent' works correctly. Slower than unit tests but validates real-world scenarios."

  step 22:
    title: "Docker Image - Reproducible Environment"
    text: "Only code passing all tests gets built into Docker image. Docker solves the 'works on my machine' problem. It creates immutable packages including Node version, OS, and libraries. Tagging with git commit SHA lets you track which deployment corresponds to which code."

  step 29:
    title: "Staging - Mirror of Production"
    text: "Deploy first to staging, a replica of production with identical environment. Final validation with data similar to real users. QA team tests here, planners verify features. Without staging, production becomes the test environment."

  step 32:
    title: "Smoke Tests - Check if Smoke Comes Out"
    text: "Smoke tests quickly validate core functions after deployment. 'Does login work? Can orders be placed? Do payments work?' Basic checks. Machines first check if 'smoke (errors) appears' before moving to production. If it fails, automatically rollback to previous version and notify team."

  step 35:
    title: "Blue-Green Deployment - Zero-downtime Deployment"
    text: "Blue-Green deployment runs current production server (Blue) and new version server (Green) simultaneously, then instantly switches traffic to Green. Users experience no service interruption. If problems arise, switch back to Blue. This is the core of downtime-free deployment."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
