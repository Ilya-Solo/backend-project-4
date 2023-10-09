export default (url_string, setExtension = '.html') => {
  const url = new URL(url_string);
  const urlNameWithoutProtocol = `${url.hostname}${url.pathname}`;

  const extensionMatch = urlNameWithoutProtocol.match(/(\.[A-Za-z0-9]+$)/);
  let extension;
  if (extensionMatch && extensionMatch[1]) {
    extension = extensionMatch[1].toLowerCase();
  }

  const fileName = urlNameWithoutProtocol
    .replace(extension, '')
    .replace(/[^A-Za-z0-9]/g, '-');

  return `${fileName}${extension || setExtension}`;
};
