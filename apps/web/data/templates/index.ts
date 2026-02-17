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

export interface Template {
  name: string;
  description: string;
  dsl: string;
}

export const TEMPLATES: Template[] = [
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
];
