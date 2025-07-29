#!/bin/bash

# Find all JS files that contain JSX syntax and rename them to .jsx
find src -name "*.js" -exec grep -l "return (" {} \; | while read file; do
  echo "Renaming $file to ${file%.js}.jsx"
  mv "$file" "${file%.js}.jsx"
done

# Update import statements in renamed files
find src -name "*.jsx" -exec sed -i '' 's/from ".\/\([^"]*\).js"/from ".\/\1.jsx"/g' {} \;
find src -name "*.jsx" -exec sed -i '' "s/from '\.\\/\\([^']*\\)\\.js'/from '\\.\\/'\\1\\.jsx'/g" {} \;

echo "Conversion complete. Check for any missing imports that may need manual updates." 