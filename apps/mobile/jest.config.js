const path = require("path");
const fs = require("fs");

const bunDir = path.join(__dirname, "../../node_modules/.bun");

// Construir modulePaths desde todos los subdirectorios de .bun
const bunModulePaths = [];
try {
  const bunEntries = fs.readdirSync(bunDir);
  bunEntries.forEach((entry) => {
    const nodeModulesPath = path.join(bunDir, entry, "node_modules");
    if (fs.existsSync(nodeModulesPath)) {
      bunModulePaths.push(nodeModulesPath);
    }
  });
} catch (_) {}

module.exports = {
  preset: "jest-expo",
  rootDir: __dirname,
  modulePaths: [
    path.join(__dirname, "../../node_modules"),
    ...bunModulePaths,
  ],
  // NUNCA ignorar archivos dentro de .bun — todos deben ser transformados por Babel
  // porque contienen Flow types y JSX sin compilar.
  transformIgnorePatterns: [
    // Ignorar node_modules raíz excepto: .bun (transformar todo dentro) y paquetes RN
    "/node_modules/(?!\\.bun|react-native|@react-native|expo|@expo|react-navigation|@react-navigation)",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
};
