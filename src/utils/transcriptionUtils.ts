export function cleanTranscriptionOutput(text: string | string[]): string {
  // If text is an array, join it into a single string
  const textString = Array.isArray(text) ? text.join(' ') : String(text);
  
  // First, remove the standard tags
  let cleanText = textString
    .replace(/<\|startoftranscript\|>/g, '')
    .replace(/<\|endoftranscript\|>/g, '')
    .replace(/<\|notimestamps\|>/g, '')
    .replace(/<\|en\|>/g, '')
    .replace(/<\|transcribe\|>/g, '')
    .replace(/<en>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .trim();

  // Format timestamps and add line breaks
  cleanText = cleanText.replace(/<\|(\d+\.\d+)\|>/g, (_, timestamp) => {
    const time = parseFloat(timestamp);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    
    // Add a line break before each timestamp except the first one
    const lineBreak = cleanText.indexOf(_) === 0 ? '' : '\n\n';
    return `${lineBreak}[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}] `;
  });

  return cleanText;
}

export const MAX_NEW_TOKENS = 64;