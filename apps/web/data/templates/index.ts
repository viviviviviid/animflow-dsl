import { blockchainTemplate } from "./blockchain";
import { jwtAuthTemplate } from "./jwt-auth";
import { httpCycleTemplate } from "./http-cycle";
import { redisStreamTemplate } from "./redis-stream";
import { oauthTemplate } from "./oauth";
import { cicdTemplate } from "./cicd";
import { immuneResponseTemplate } from "./immune-response";
import { legislationTemplate } from "./legislation";
import { simpleTemplate } from "./simple";
import { x402Phase1ManualChaosTemplate } from "./x402-phase1-manual-chaos";
import { x402Phase2SmartEraTemplate } from "./x402-phase2-smart-era";

export interface Template {
  name: string;
  description: string;
  dsl: string;
}

export const TEMPLATES: Template[] = [
  x402Phase1ManualChaosTemplate,
  x402Phase2SmartEraTemplate,
  blockchainTemplate,
  jwtAuthTemplate,
  httpCycleTemplate,
  redisStreamTemplate,
  oauthTemplate,
  cicdTemplate,
  immuneResponseTemplate,
  legislationTemplate,
  simpleTemplate,
];
