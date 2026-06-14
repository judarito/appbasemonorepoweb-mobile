const path = require("path");

// En monorepo Bun los packages viven en node_modules/.bun/<pkg>/node_modules/<pkg>
// Necesitamos resolver babel-preset-expo explícitamente para que @babel/core lo encuentre.
const findBunPackage = (pkgName) => {
  const bunDir = path.join(__dirname, "../../node_modules/.bun");
  const fs = require("fs");
  try {
    const entries = fs.readdirSync(bunDir);
    const match = entries.find((e) => e.startsWith(pkgName.replace("/", "+").replace("@", "") + "@") || e.startsWith(pkgName + "@"));
    if (match) {
      return path.join(bunDir, match, "node_modules", pkgName);
    }
  } catch (_) {}
  return pkgName;
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [require(findBunPackage("babel-preset-expo"))],
    ],
  };
};
