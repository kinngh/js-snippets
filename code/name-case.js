function nameCase(str, options = {}) {
  const defaultOptions = {
    lazy: true,
    irish: true,
    spanish: true,
    sonOrDaughterOf: true,
  };
  options = { ...defaultOptions, ...options };

  if (options.lazy) {
    const firstLetterLower = str[0] === str[0].toLowerCase();
    const allLowerOrUpper =
      str.toLowerCase() === str || str.toUpperCase() === str;

    if (!firstLetterLower && !allLowerOrUpper) return str;
  }

  let localString = str.toLowerCase();
  localString = localString.replace(/\b\w/g, (match) => match.toUpperCase());
  localString = localString.replace(/'\w\b/g, (match) => match.toLowerCase());

  if (options.irish) {
    localString = applyIrishRules(localString);
  }

  if (options.sonOrDaughterOf) {
    localString = applySonOrDaughterOfRules(localString);
  }

  localString = localString.replace(
    / \b((?:[Xx]{1,3}|[Xx][Ll]|[Ll][Xx]{0,3})?(?:[Ii]{1,3}|[Ii][VvXx]|[Vv][Ii]{0,3})?)\b/g,
    (match) => match.toUpperCase()
  );

  if (options.spanish) {
    ["Y", "E", "I"].forEach((conjunction) => {
      localString = localString.replace(
        new RegExp(`\\b${conjunction}\\b`, "g"),
        conjunction.toLowerCase()
      );
    });
  }

  return localString;
}

function applyIrishRules(localString) {
  if (
    /\bMac[A-Za-z]{2,}[^aciozj]\b/.test(localString) ||
    /\bMc/.test(localString)
  ) {
    const match = localString.match(/\b(Ma?c)([A-Za-z]+)/);
    if (match) {
      localString = localString.replace(
        /\bMa?c[A-Za-z]+/g,
        match[1] + match[2][0].toUpperCase() + match[2].slice(1)
      );
    }
    const macExceptions = [
      "MacEdo",
      "MacEvicius",
      "MacHado",
      "MacHar",
      "MacHin",
      "MacHlin",
      "MacIas",
      "MacIulis",
      "MacKie",
      "MacKle",
      "MacKlin",
      "MacKmin",
      "MacQuarie",
    ];
    macExceptions.forEach((exception) => {
      localString = localString.replace(
        new RegExp(`\\b${exception}`, "g"),
        exception
      );
    });
  }
  return localString.replace("Macmurdo", "MacMurdo");
}

function applySonOrDaughterOfRules(localString) {
  const sonOrDaughterOfReplacements = [
    { regex: /\bAl(?=\s+\w)/g, replacement: "al" },
    { regex: /\b(Bin|Binti|Binte)\b/g, replacement: "bin" },
    { regex: /\bAp\b/g, replacement: "ap" },
    { regex: /\bBen(?=\s+\w)/g, replacement: "ben" },
    { regex: /\bDell([ae])\b/g, replacement: "dell$1" },
    { regex: /\bD([aeiou])\b/g, replacement: "d$1" },
    { regex: /\bD([ao]s)\b/g, replacement: "d$1" },
    { regex: /\bDe([lr])\b/g, replacement: "de$1" },
    { regex: /\bEl\b/g, replacement: "el" },
    { regex: /\bLa\b/g, replacement: "la" },
    { regex: /\bL([eo])\b/g, replacement: "l$1" },
    { regex: /\bVan(?=\s+\w)/g, replacement: "van" },
    { regex: /\bVon\b/g, replacement: "von" },
  ];
  sonOrDaughterOfReplacements.forEach(({ regex, replacement }) => {
    localString = localString.replace(regex, replacement);
  });
  return localString;
}

// Usage

const name1 = "harshdeep";
const name2 = "mcharshdeep";
console.log(nameCase(name1), nameCase(name2));
//Harshdeep, McHarshdeep
