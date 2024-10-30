FILE_PATH=$(find /usr/share/nginx/html -type f -name "*.js")


for file in $FILE_PATH; do
    sed -i "s|{{API_HOST}}|$API_HOST|g" "$file"
done
