import { blockchainTemplate } from "./blockchain";
import { jwtAuthTemplate } from "./jwt-auth";
import { httpCycleTemplate } from "./http-cycle";
import { redisStreamTemplate } from "./redis-stream";
import { oauthTemplate } from "./oauth";
import { cicdTemplate } from "./cicd";
import { immuneResponseTemplate } from "./immune-response";
import { legislationTemplate } from "./legislation";
import { simpleTemplate } from "./simple";
import { x402AutonomousRetailTemplate } from "./x402-autonomous-retail";

export interface Template {
  name: string;
  description: string;
  dsl: string;
}

export const TEMPLATES: Template[] = [
  x402AutonomousRetailTemplate,
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
