const replace = require("replace-in-file");
const optionsCSS = {
  files: "./out/_next/static/css/*.css",
  from: [/webpack:\/\/\/mini-css-extract-plugin/g],
  to: ["https://namesys-eth.github.io"],
};
const optionsJS = {
  files: [
    "./out/_next/static/chunks/*.js",
    "./out/_next/static/chunks/pages/*.js",
  ],
  from: [],
  to: [],
};
const optionsHTML = {
  files: "./out/*.html",
  from: [],
  to: [],
};
(async function () {
  try {
    const resultsCSS = await replace(optionsCSS);
  } catch (error) {}
  try {
    const resultsJS = await replace(optionsJS);
  } catch (error) {}
  try {
    const resultsHTML = await replace(optionsHTML);
  } catch (error) {}
})();
