// pdfjs-dist is loaded lazily — only when the user actually picks a PDF to parse.
// This saves ~400kB from the initial page bundle of any page that uses this util.

export async function parseDocumentToText(file: File): Promise<string> {
  // Dynamic import: pdfjs-dist is only downloaded when this function is called
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    if (pageText.trim()) {
      fullText += pageText.trim() + '\n\n'
    }
  }

  return fullText
}
