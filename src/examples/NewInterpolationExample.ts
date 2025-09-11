import { InterpolationContext, InterpolationContextBuilder, InterpolationSystem } from '../interpolation';

/**
 * Example of how to use the new interpolation system in actions and functions
 */
export class NewInterpolationExample {
  
  /**
   * Example: SendMessageAction with new interpolation system
   */
  static async sendMessageExample() {
    // Create interpolation context
    const context = new InterpolationContextBuilder()
      .setEnv({
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
      .setData({
        apiUrl: 'https://api.example.com',
        theme: 'dark',
        userName: 'John'
      })
      .setParams({
        messageId: 123,
        chatId: 456
      })
      .build();

    // Create scope for this action
    context.local.createScope();
    
    // Set action-specific variables
    context.local.setVariable('sent', false);
    context.local.setVariable('error', null);
    context.local.setVariable('response', null);

    try {
      // Simulate sending message
      const messageText = 'Hello {{userName}}! Message sent at {{timestamp}}';
      const interpolatedText = InterpolationSystem.interpolate(messageText, context);
      
      console.log('Original:', messageText);
      console.log('Interpolated:', interpolatedText);
      // Output: "Hello John! Message sent at 2024-01-15T10:30:00.000Z"

      // Update local variables
      context.local.setVariable('sent', true);
      context.local.setVariable('response', { messageId: 789 });

      // Interpolate success message
      const successMessage = 'Message {{local.response.messageId}} sent successfully!';
      const successText = InterpolationSystem.interpolate(successMessage, context);
      console.log('Success:', successText);
      // Output: "Message 789 sent successfully!"

    } finally {
      // Clean up scope when action completes
      context.local.clearScope();
    }
  }

  /**
   * Example: Function with nested scopes
   */
  static async functionExample() {
    const context = new InterpolationContextBuilder()
      .setData({
        items: ['apple', 'banana', 'cherry'],
        separator: ', '
      })
      .build();

    // Function A scope
    context.local.createScope();
    context.local.setVariable('functionName', 'JoinToString');
    context.local.setVariable('result', '');

    try {
      // Nested function B scope
      context.local.createScope();
      context.local.setVariable('temp', 'processing...');

      try {
        // Process items
        const items = context.data.items;
        const separator = context.data.separator;
        const result = items.join(separator);
        
        context.local.setVariable('result', result);
        context.local.setVariable('temp', 'completed');

        // Interpolate result message
        const message = '{{local.functionName}}: {{local.result}} ({{local.temp}})';
        const interpolated = InterpolationSystem.interpolate(message, context);
        console.log('Function result:', interpolated);
        // Output: "JoinToString: apple, banana, cherry (completed)"

      } finally {
        // Clear nested scope
        context.local.clearScope();
      }

      // Back to function A scope
      const finalMessage = '{{local.functionName}} completed with result: {{local.result}}';
      const finalInterpolated = InterpolationSystem.interpolate(finalMessage, context);
      console.log('Final result:', finalInterpolated);
      // Output: "JoinToString completed with result: apple, banana, cherry"

    } finally {
      // Clear function A scope
      context.local.clearScope();
    }
  }

  /**
   * Example: Priority system demonstration
   */
  static async priorityExample() {
    const context = new InterpolationContextBuilder()
      .setEnv({ name: 'Environment' })
      .setData({ name: 'Data' })
      .setParams({ name: 'Params' })
      .build();

    // Create local scope
    context.local.createScope();
    context.local.setVariable('name', 'Local');

    // Test priority: local -> params -> data -> env
    const testMessage = 'Name: {{name}}';
    const result = InterpolationSystem.interpolate(testMessage, context);
    console.log('Priority test:', result);
    // Output: "Name: Local" (local has highest priority)

    // Test explicit prefixes
    const explicitMessage = 'Env: {{env.name}}, Data: {{data.name}}, Params: {{params.name}}, Local: {{local.name}}';
    const explicitResult = InterpolationSystem.interpolate(explicitMessage, context);
    console.log('Explicit prefixes:', explicitResult);
    // Output: "Env: Environment, Data: Data, Params: Params, Local: Local"

    context.local.clearScope();
  }

  /**
   * Example: Complex nested object interpolation
   */
  static async complexObjectExample() {
    const context = new InterpolationContextBuilder()
      .setData({
        user: {
          profile: {
            name: 'Alice',
            settings: {
              theme: 'dark',
              language: 'en'
            }
          }
        },
        api: {
          baseUrl: 'https://api.example.com',
          version: 'v1'
        }
      })
      .build();

    context.local.createScope();
    context.local.setVariable('requestId', 'req_123');

    const complexObject = {
      message: 'Hello {{data.user.profile.name}}!',
      api: {
        url: '{{data.api.baseUrl}}/{{data.api.version}}/users',
        requestId: '{{local.requestId}}'
      },
      settings: {
        theme: '{{data.user.profile.settings.theme}}',
        language: '{{data.user.profile.settings.language}}'
      }
    };

    const interpolated = InterpolationSystem.interpolate(complexObject, context);
    console.log('Complex object:', JSON.stringify(interpolated, null, 2));

    context.local.clearScope();
  }
}

// Run examples
if (require.main === module) {
  NewInterpolationExample.sendMessageExample();
  NewInterpolationExample.functionExample();
  NewInterpolationExample.priorityExample();
  NewInterpolationExample.complexObjectExample();
}
