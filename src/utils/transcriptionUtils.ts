export function cleanTranscriptionOutput(text) {
  const textString = Array.isArray(text) ? text.join(" ") : String(text);

  let cleanText = textString
    .replace(/<\|startoftranscript\|>/g, "")
    .replace(/<\|endoftranscript\|>/g, "")
    .replace(/<\|notimestamps\|>/g, "")
    .replace(/<\|en\|>/g, "")
    .replace(/<\|transcribe\|>/g, "")
    .replace(/<en>/g, "")
    .replace(/<\|endoftext\|>/g, "")
    .trim();

  cleanText = cleanText.replace(/<\|(\d+\.\d+)\|>/g, (_, timestamp) => {
    const time = parseFloat(timestamp);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);

    const lineBreak = cleanText.indexOf(_) === 0 ? "" : "\n\n";
    return `${lineBreak}[${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}] `;
  });

  return cleanText;
}
