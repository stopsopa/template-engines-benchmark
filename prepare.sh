
set -e

if [ -d lodash ]; then
    echo "${0}: lodash is already extracted"
else 
    echo "${0}: extracting lodash"
    cd node_modules
    tar -zcvf lodash.tar.gz lodash
    mv lodash.tar.gz ..
    cd ..
    tar -zxvf lodash.tar.gz
    rm -rf lodash.tar.gz
fi

ls -la

