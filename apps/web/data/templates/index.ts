import { awsTransitGatewayTemplate } from "./aws-transit-gateway";
import { blockchainTemplate } from "./blockchain";
import { jwtAuthTemplate } from "./jwt-auth";
import { httpCycleTemplate } from "./http-cycle";
import { gitBranchTemplate } from "./git-branch";
import { orderProcessTemplate } from "./order-process";
import { networkTopologyTemplate } from "./network-topology";
import { microservicesTemplate } from "./microservices";
import { zkSnarkTemplate } from "./zk-snark";
import { simpleTemplate } from "./simple";
import { dijkstraTemplate } from "./dijkstra";
import { redisStreamTemplate } from "./redis-stream";
import { tcpTlsTemplate } from "./tcp-tls";
import { oauthTemplate } from "./oauth";
import { cicdTemplate } from "./cicd";
import { immuneResponseTemplate } from "./immune-response";
import { legislationTemplate } from "./legislation";

export interface Template {
  name: string;
  description: string;
  dsl: string;
}

export const TEMPLATES: Template[] = [
  awsTransitGatewayTemplate,
  blockchainTemplate,
  jwtAuthTemplate,
  httpCycleTemplate,
  gitBranchTemplate,
  orderProcessTemplate,
  networkTopologyTemplate,
  microservicesTemplate,
  zkSnarkTemplate,
  simpleTemplate,
  dijkstraTemplate,
  redisStreamTemplate,
  tcpTlsTemplate,
  oauthTemplate,
  cicdTemplate,
  immuneResponseTemplate,
  legislationTemplate,
];
