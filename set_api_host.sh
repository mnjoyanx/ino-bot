FILE_PATH=$(find /usr/share/nginx/html -type f -name "*.js")

DEFAULT_API_HOST="DEFAULT_API_HOST"

for file in $FILE_PATH; do
    sed -i "s|$DEFAULT_API_HOST|$API_HOST|g" "$file"
done
