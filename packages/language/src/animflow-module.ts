import { type Module, inject } from "langium";
import type {
  LangiumServices,
  LangiumSharedServices,
  PartialLangiumServices,
} from "langium/lsp";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
} from "langium/lsp";

import {
  AnimFlowGeneratedModule,
  AnimFlowGeneratedSharedModule,
} from "./generated/module.js";
import {
  AnimFlowValidator,
  registerValidationChecks,
} from "./animflow-validator.js";
import { AnimFlowFormatter } from "./animflow-formatter.js";
import { AnimFlowScopeProvider } from "./animflow-scope-provider.js";

export interface AnimFlowAddedServices {
  validation: {
    AnimFlowValidator: AnimFlowValidator;
  };
}

export type AnimFlowServices = LangiumServices & AnimFlowAddedServices;

export const AnimFlowModule: Module<
  AnimFlowServices,
  PartialLangiumServices & AnimFlowAddedServices
> = {
  lsp: {
    Formatter: () => new AnimFlowFormatter(),
  },
  references: {
    ScopeProvider: (services) => new AnimFlowScopeProvider(services),
  },
  validation: {
    AnimFlowValidator: () => new AnimFlowValidator(),
  },
};

export function createAnimFlowServices(context: DefaultSharedModuleContext): {
  readonly shared: LangiumSharedServices;
  readonly language: AnimFlowServices;
} {
  const shared = inject(
    createDefaultSharedModule(context),
    AnimFlowGeneratedSharedModule,
  );
  const language = inject(
    createDefaultModule({ shared }),
    AnimFlowGeneratedModule,
    AnimFlowModule,
  );

  shared.ServiceRegistry.register(language);
  registerValidationChecks(language);

  if (!context.connection) {
    shared.workspace.ConfigurationProvider.initialized({});
  }

  return { shared, language };
}
