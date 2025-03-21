module.exports = (api) => {
  // This conditional check ensures Babel only runs in test environments
  const isTest = api.env('test');
  
  if (isTest) {
    return {
      presets: [
        ["@babel/preset-env", {
          "targets": {
            "node": "current"
          }
        }],
        ["@babel/preset-typescript", { 
          "isTSX": true, 
          "allExtensions": true,
          "runtime": "automatic"
        }],
        ["next/babel", {
          "preset-react": {
            "runtime": "automatic",
            "importSource": "react"
          }
        }]
      ],
      plugins: [
        ["@babel/plugin-transform-typescript", { 
          "allowDeclareFields": true,
          "runtime": "automatic"
        }],
        "@babel/plugin-syntax-jsx",
        "@babel/plugin-syntax-flow"
      ],
      env: {
        test: {
          plugins: [
            "@babel/plugin-transform-modules-commonjs"
          ]
        }
      }
    };
  }
  
  // Return minimal configuration for non-test environments
  // This allows SWC to be used for normal development/production
  return {
    presets: []
  };
}; 