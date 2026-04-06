# 
# /bin/bash buildTemplate.sh 
# 

# Bundle lodash/template.js into template/template.ts
# Using --bundle to pull in all dependencies
# Using --format=esm to generate ESM
# Using --minify to keep it compact (optional, but good for self-contained)
# Using --platform=node since it might use some node-ish things (though lodash usually doesn't for template)
# ./node_modules/.bin/esbuild node_modules/lodash/template.js \
./node_modules/.bin/esbuild lodash/template.js \
  --bundle \
  --format=esm \
  --outfile=template/template.js \
  --target=esnext

echo "Generated template/template.ts from lodash/template.js"
