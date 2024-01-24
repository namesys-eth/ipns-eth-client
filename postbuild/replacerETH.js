const replace = require("replace-in-file");
const optionsCSS = {
  files: "./out/_next/static/css/*.css",
  from: [/webpack:\/\/\/mini-css-extract-plugin/g],
  to: ["https://lite.namesys.eth.limo"],
};
(async function () {
  try {
    const resultsCSS = await replace(optionsCSS);
  } catch (error) {}
})();
