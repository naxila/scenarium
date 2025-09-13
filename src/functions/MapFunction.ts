import { ICustomFunction } from '../types/PluginInterfaces';
import { ProcessingContext } from '../types/Context';
import { InterpolationSystem } from '../interpolation/InterpolationSystem';

export class MapFunction implements ICustomFunction {
  readonly functionName = 'Map';

  async execute(params: any, context: ProcessingContext): Promise<any[]> {
    return MapFunction.execute(params, context);
  }

  static async execute(params: any, context: ProcessingContext): Promise<any[]> {
    // ПРИНЦИП: Единственная ответственность - функция Map только обрабатывает массивы
    // Контекст должен приходить уже готовым и валидным
    const interpolationContext = context.interpolationContext;
    
    console.log('🗺️ Map function called with params:', JSON.stringify(params, null, 2));
    console.log('🗺️ Map function interpolation context:', {
      hasContext: !!interpolationContext,
      hasLocal: !!interpolationContext?.local,
      hasData: !!interpolationContext?.data,
      hasEnv: !!interpolationContext?.env,
      hasParams: !!interpolationContext?.params,
      contextKeys: interpolationContext ? Object.keys(interpolationContext) : 'none'
    });
    
    if (!interpolationContext) {
      throw new Error('Map function: interpolationContext is required - architectural error in context passing');
    }
    
    // Get the items array
    const items = InterpolationSystem.interpolate(params.items, interpolationContext);
    
    console.log('🗺️ Map function items after interpolation:', items);
    
    if (!Array.isArray(items)) {
      throw new Error(`Map function: items parameter must be an array, got ${typeof items}`);
    }
    
    // Get the forEach template
    const forEachTemplate = params.forEach;
    if (!forEachTemplate) {
      throw new Error('Map function: forEach parameter is required');
    }
    
    // Process each item
    const results: any[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Create a new scope for this iteration
      interpolationContext.local.createScope();
      
      // Set the current item as 'it' in the local context
      interpolationContext.local.setVariable('it', item);
      interpolationContext.local.setVariable('index', i);
      
      try {
        // Interpolate the template for this item
        const result = InterpolationSystem.interpolate(forEachTemplate, interpolationContext);
        results.push(result);
      } finally {
        // Clean up the scope for this iteration
        interpolationContext.local.clearScope();
      }
    }
    
    // ПРИНЦИП: Единственная ответственность - Map только возвращает массив
    return results;
  }
}
