export default (urlString, setExtension = '.html') => {
  const urlArr = urlString.split('//');
  const urlNameWithoutProtocol = (urlArr[urlArr.length - 1]).split('?')[0];

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
