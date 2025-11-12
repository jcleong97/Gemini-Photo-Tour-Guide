/**
 * Converts markdown text to HTML with styling
 */
export const formatMarkdownToHTML = (markdown: string): string => {
  return markdown
    .replace(/## (.*)/g, '<h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-300">$1</h3>')
    .replace(/\* \*(.*?)\* \*/g, '<strong>$1</strong>')
    .replace(/\* (.*)/g, '<li class="ml-5 list-disc">$1</li>')
    .replace(/\n/g, '<br />');
};


