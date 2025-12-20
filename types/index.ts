export interface OdtDocument {
  content: string;
  filename: string;
  raw: ArrayBuffer;
  styles?:  string;
}

export interface Placeholder {
  key: string;
  value: string;
  description?: string;
}

export interface PlaceholderGroup {
  [category: string]: {
    [key: string]: string;
  };
}