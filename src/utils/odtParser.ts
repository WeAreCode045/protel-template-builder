import JSZip from 'jszip';

export interface ParsedODT {
  content: string;
  filename: string;
  raw:  ArrayBuffer;
  styles: string;
}

export async function parseODT(file: File): Promise<ParsedODT> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // ODT files have content in content.xml
  const contentXml = await zip.file('content.xml')?.async('text');
  const stylesXml = await zip.file('styles.xml')?.async('text');
  
  if (!contentXml) {
    throw new Error('Invalid ODT file: content.xml not found');
  }
  
  console.log('Parsing ODT file:', file.name);
  
  // Extract readable text from XML
  const textContent = extractTextFromXML(contentXml);
  
  console.log('Extracted text length:', textContent.length);
  console.log('First 200 chars:', textContent.substring(0, 200));
  
  return {
    content: textContent,
    filename: file.name,
    raw: arrayBuffer,
    styles: stylesXml || ''
  };
}

function extractTextFromXML(xml: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  
  let content = '';
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.error('XML parsing error:', parserError.textContent);
    return xml; // Return raw XML if parsing fails
  }
  
  // Extract all text:p and text:h elements (paragraphs and headers)
  const textElements = xmlDoc.querySelectorAll('text\\:p, text\\:h, p, h');
  
  if (textElements.length === 0) {
    // Fallback: try without namespace
    const allTextNodes = xmlDoc.getElementsByTagName('*');
    for (let i = 0; i < allTextNodes.length; i++) {
      const node = allTextNodes[i];
      if (node.localName === 'p' || node.localName === 'h') {
        const text = node.textContent?.trim();
        if (text) {
          content += text + '\n';
        }
      }
    }
  } else {
    // Process found elements
    textElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text) {
        content += text + '\n';
      } else {
        content += '\n'; // Preserve empty lines
      }
    });
  }
  
  // If still no content, return a message
  if (!content.trim()) {
    return 'No text content found in document. The ODT file may be empty or formatted in an unsupported way.';
  }
  
  return content.trim();
}

export async function createODT(content: string, originalFile: ArrayBuffer): Promise<Blob> {
  const zip = await JSZip.loadAsync(originalFile);
  
  // Get original content.xml to preserve structure
  const originalXml = await zip.file('content.xml')?.async('text');
  if (!originalXml) {
    throw new Error('Original content.xml not found');
  }
  
  // Update content while preserving ODT structure
  const updatedXML = updateXMLContent(originalXml, content);
  zip.file('content.xml', updatedXML);
  
  // Generate new ODT file
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

function updateXMLContent(originalXml: string, newContent: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(originalXml, 'text/xml');
  
  // Find the office:text element
  const officeText = xmlDoc.getElementsByTagName('office:text')[0];
  if (!officeText) {
    return wrapContentInXML(newContent);
  }
  
  // Clear existing content
  while (officeText.firstChild) {
    officeText.removeChild(officeText.firstChild);
  }
  
  // Add new paragraphs
  const lines = newContent.split('\n');
  lines.forEach(line => {
    const p = xmlDoc.createElementNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'text:p');
    p.setAttribute('text:style-name', 'Standard');
    p.textContent = line;
    officeText.appendChild(p);
  });
  
  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
}

function wrapContentInXML(content: string): string {
  const paragraphs = content.split('\n').map(line => 
    `<text:p text:style-name="Standard">${escapeXML(line)}</text:p>`
  ).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
                         xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      ${paragraphs}
    </office:text>
  </office:body>
</office:document-content>`;
}

function escapeXML(text:  string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}