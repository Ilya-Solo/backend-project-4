const createNameByUrls = (sourceUrlString, mainPageUrlString, setExtension = '.html') => {
  const sourceUrl = configureUrlObj(sourceUrlString, setExtension);
  const mainPageUrl = configureUrlObj(mainPageUrlString);

  if (sourceUrlString === mainPageUrlString) {
    mainPageUrl.name = null;
  }

  const fullFileName = [mainPageUrl.name, sourceUrl.name]
    .filter(item => item !== null)
    .join('-');
  return `${fullFileName}${sourceUrl.extension}`;
};

const configureUrlObj = (urlString, setExtension) => {
  if (urlString.length === 0) {
    return { name: null, extension: '' };
  }

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

  return { name: fileName, extension: extension || setExtension };
}

export default createNameByUrls;