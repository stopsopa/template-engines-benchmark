
set -e
set -o pipefail

tar_trimmed() {
    local output
    local lines
    local count
    output=$("$@" 2>&1)
    local exit_code=$?
    lines=$(echo "$output" | wc -l | tr -d ' ')
    count=5
    if [ "$lines" -le $((count * 2)) ]; then
        echo "$output"
    else
        echo "$output" | head -n "$count"
        echo "... ($(( lines - count * 2 )) lines omitted) ..."
        echo "$output" | tail -n "$count"
    fi
    return $exit_code
}

if [ -d lodash ]; then
    echo "${0}: lodash is already extracted"
else
    echo "${0}: extracting lodash"
    cd node_modules
    tar_trimmed tar -zcvf lodash.tar.gz lodash
    mv lodash.tar.gz ..
    cd ..
    tar_trimmed tar -zxvf lodash.tar.gz
    rm -rf lodash.tar.gz
fi

ls -la

