export class ScopeManager {
  private scopes: Array<Record<string, any>> = [];

  /**
   * Create a new scope and push it to the stack
   */
  createScope(initialData: Record<string, any> = {}): void {
    this.scopes.push({ ...initialData });
  }

  /**
   * Set a variable in the current scope
   */
  setVariable(name: string, value: any): void {
    if (this.scopes.length === 0) {
      this.createScope();
    }
    this.scopes[this.scopes.length - 1][name] = value;
  }

  /**
   * Get a variable from the current scope
   */
  getVariable(name: string): any {
    if (this.scopes.length === 0) {
      return undefined;
    }
    return this.scopes[this.scopes.length - 1][name];
  }

  /**
   * Get a variable by searching through all scopes (current to global)
   * Supports dot notation (e.g., 'response.status')
   */
  findVariable(name: string): any {
    // Handle dot notation
    if (name.includes('.')) {
      const parts = name.split('.');
      const rootName = parts[0];
      
      // Find root object
      for (let i = this.scopes.length - 1; i >= 0; i--) {
        if (rootName in this.scopes[i]) {
          let current = this.scopes[i][rootName];
          
          // Navigate through nested properties
          for (let j = 1; j < parts.length; j++) {
            if (current === null || current === undefined) {
              return undefined;
            }
            current = current[parts[j]];
          }
          
          return current;
        }
      }
      return undefined;
    }
    
    // Simple variable lookup
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name in this.scopes[i]) {
        return this.scopes[i][name];
      }
    }
    return undefined;
  }

  /**
   * Clear the current scope (remove last scope from stack)
   */
  clearScope(): void {
    if (this.scopes.length > 0) {
      this.scopes.pop();
    }
  }

  /**
   * Get the current scope
   */
  getCurrentScope(): Record<string, any> {
    if (this.scopes.length === 0) {
      return {};
    }
    return this.scopes[this.scopes.length - 1];
  }

  /**
   * Get all scopes (for debugging)
   */
  getAllScopes(): Array<Record<string, any>> {
    return [...this.scopes];
  }

  /**
   * Clear all scopes
   */
  clearAllScopes(): void {
    this.scopes = [];
  }
}
