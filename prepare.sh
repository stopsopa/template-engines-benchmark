
set -e
set -o pipefail

tar_trimmed() {
    local output
    local lines
    local count
    # Disable xtrace for the trimming logic to avoid printing the entire output
    local xtrace_on=0
    if [[ $- == *x* ]]; then
        xtrace_on=1
        set +x
    fi

    output=$("$@" 2>&1)
    local exit_code=$?
    
    # We use a here-string to avoid SIGPIPE in some shells, 
    # though bash here-strings still use pipes/temp files.
    # More importantly, we count lines without echoing the whole thing to a pipe if possible.
    lines=$(grep -c '' <<< "$output")
    count=30
    if [ "$lines" -le $((count * 2)) ]; then
        printf "%s\n" "$output"
    else
        head -n "$count" <<< "$output"
        echo "... ($(( lines - count * 2 )) lines omitted) ..."
        tail -n "$count" <<< "$output"
    fi

    if [ "$xtrace_on" -eq 1 ]; then
        set -x
    fi
    return $exit_code
}

if [ -d lodash ]; then
    echo "${0}: lodash is already extracted"
else
    set -x
    echo "${0}: extracting lodash"
    cd node_modules
    tar_trimmed tar -zcvf lodash.tar.gz lodash
    mv lodash.tar.gz ..
    cd ..
    tar_trimmed tar -zxvf lodash.tar.gz
    rm -rf lodash.tar.gz
    set +x
fi

ls -la

