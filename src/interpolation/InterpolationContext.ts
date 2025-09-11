import { ScopeManager } from './ScopeManager';

export interface InterpolationContext {
  env: Record<string, any>;
  data: Record<string, any>;
  local: ScopeManager;
  params: Record<string, any>;
}

export class InterpolationContextBuilder {
  private context: Partial<InterpolationContext> = {};

  /**
   * Set environment variables
   */
  setEnv(env: Record<string, any>): this {
    this.context.env = env;
    return this;
  }

  /**
   * Set scenario data
   */
  setData(data: Record<string, any>): this {
    this.context.data = data;
    return this;
  }

  /**
   * Set function/action parameters
   */
  setParams(params: Record<string, any>): this {
    this.context.params = params;
    return this;
  }

  /**
   * Build the interpolation context
   */
  build(): InterpolationContext {
    return {
      env: this.context.env || {},
      data: this.context.data || {},
      local: new ScopeManager(),
      params: this.context.params || {}
    };
  }

  /**
   * Create context from base context and local scope
   */
  static createContext(
    baseContext: any,
    params: Record<string, any> = {},
    localScope: Record<string, any> = {}
  ): InterpolationContext {
    const builder = new InterpolationContextBuilder();
    
    // Set environment variables
    builder.setEnv({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    });

    // Set scenario data (combine scenarioContext and userContext.data)
    const scenarioData = {
      ...baseContext.scenarioContext,
      ...baseContext.userContext?.data
    };
    
    // Flatten data structure - move data.* to top level for easier access
    const flattenedData = {
      ...scenarioData,
      ...(scenarioData.data || {})
    };
    
    builder.setData(flattenedData);

    // Set parameters
    builder.setParams(params);

    const context = builder.build();

    // Initialize local scope with provided data
    if (Object.keys(localScope).length > 0) {
      context.local.createScope(localScope);
    }

    return context;
  }
}
