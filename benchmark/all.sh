# 
# /bin/bash benchmark/all.sh
# 

set -e

# Change directory to project root if script is run from within /benchmark
CDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$CDIR/.."

export NODE_OPTIONS=""

rm -rf benchmark/*/*.log

/bin/bash buildTemplate.sh

echo "Starting Benchmark Suite (1,000,000 iterations, 4 concurrently)..."

# Define all the ENGINE directories
ENGINES=(
  "custom"
  "underscore"
  "radash"
  "eta"
)
  # "lodash"
  # "typetify"
  # "es-toolkit"
  # "thunder"
  # "ejs"
  # "typed-html"
  # "hbs"
  # "mustache"
  # "edge"
  # "nunjucks"
  # "dot"

# Run them in parallel keeping up to 4 running at all times using xargs
printf "%s\n" "${ENGINES[@]}" | xargs -n 1 -P 3 -I {} bash -c '
  ENGINE="{}"
  echo "Started ${ENGINE}"
  node "benchmark/${ENGINE}/bench.ts" > "benchmark/${ENGINE}/bench.log"  
'

node benchmark/eta/bench.ts --test > benchmark/eta/test.log


echo "Started lodash default"
node benchmark/lodash/bench.ts --test > benchmark/lodash/test.log
diff benchmark/eta/test.log benchmark/lodash/test.log
node "benchmark/lodash/bench.ts" > "benchmark/lodash/bench-default.log"   


# modified lodash/template.js is now not able to handle <%- form.name %> it has to be <%= d.form.name %>
# which is much faster
# but really modifying template engine really doesn't speed up things at all
# but using { variable : 'd'} is bigger speed boost
# so the conslusion is that I can't make it faster by putting my hands into the implementation
# but using { variable : 'd'} helps the most
# see benchmark/summary.log
# echo "Started lodash --usebuilt"
# node benchmark/lodash/bench.ts --test --usebuilt > benchmark/lodash/test.log
# diff benchmark/eta/test.log benchmark/lodash/test.log
# node "benchmark/lodash/bench.ts" --usebuilt > "benchmark/lodash/bench-usebuilt.log"  


echo "Started lodash --useit"
node benchmark/lodash/bench.ts --test --useit > benchmark/lodash/test.log
diff benchmark/eta/test.log benchmark/lodash/test.log
node "benchmark/lodash/bench.ts" --useit > "benchmark/lodash/bench-useit.log"  


echo "Started lodash --usebuilt --useit"
node benchmark/lodash/bench.ts --test --usebuilt --useit > benchmark/lodash/test.log
diff benchmark/eta/test.log benchmark/lodash/test.log
node "benchmark/lodash/bench.ts" --usebuilt --useit > "benchmark/lodash/bench-usebuilt-useit.log" 

echo ""
echo "All benchmarks completed. Generating summary report..."

# Aggregate JSON output from all log files and pass to summary.ts
cat benchmark/*/bench*.log | grep "{" | node benchmark/summary.ts | tee benchmark/summary.log

echo "all good when all benchmarks ended with exit 0"
