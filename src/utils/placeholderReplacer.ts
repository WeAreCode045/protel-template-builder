interface PlaceholderData {
  [key: string]: any;
}

export function replacePlaceholders(content: string, data: PlaceholderData): string {
  let result = content;
  
  // Match patterns like $user.name, $company.address, etc.
  const placeholderRegex = /\$(\w+\. [\w. ]+)/g;
  
  result = result.replace(placeholderRegex, (match, path) => {
    // Navigate nested object path (e.g., "user.name" -> data.user.name)
    const value = path.split('.').reduce((obj:  any, key: string) => {
      return obj && obj[key] !== undefined ? obj[key] :  match;
    }, data);
    
    return value !== match ? value : match;
  });
  
  return result;
}

// Example placeholder detection for highlighting
export function detectPlaceholders(content: string): string[] {
  const placeholderRegex = /\$(\w+\. [\w.]+)/g;
  const matches = content.match(placeholderRegex);
  return matches || [];
}